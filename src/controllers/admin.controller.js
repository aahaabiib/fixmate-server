import { getCollections } from "../config/db.js";
import { toObjectId } from "../utils/object-id.js";
import { BOOKING_STATUSES } from "../utils/booking-rules.js";

const ROLES = ["customer", "technician", "admin"];
const APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// BetterAuth-er user _id ObjectId ba string, duto-i dhore search kori
function userFilter(id) {
  const oid = toObjectId(id);
  return oid ? { $or: [{ _id: oid }, { _id: id }] } : { _id: id };
}

// ---------- Users ----------
export async function getUsers(req, res, next) {
  try {
    const { users } = await getCollections();

    const query = {};
    const role = String(req.query.role || "");
    if (ROLES.includes(role)) query.role = role;

    const search = String(req.query.search || "").trim();
    if (search) {
      const rx = new RegExp(escapeRegex(search), "i");
      query.$or = [{ name: rx }, { email: rx }];
    }

    const list = await users
      .find(query, {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          image: 1,
          phone: 1,
          area: 1,
          createdAt: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ users: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { users } = await getCollections();

    const role = String(req.body.role || "");
    if (!ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: "Role must be customer, technician or admin" });
    }

    const target = await users.findOne(userFilter(req.params.id));
    if (!target) return res.status(404).json({ message: "User not found" });

    if (target.email === req.user.email) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    await users.updateOne(
      { _id: target._id },
      { $set: { role, updatedAt: new Date() } }
    );

    res.json({
      message: `${target.name} is now a ${role}`,
      user: { _id: target._id, name: target.name, email: target.email, role },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Services ----------
export async function getAllServices(req, res, next) {
  try {
    const { services } = await getCollections();

    const match = {};
    const status = String(req.query.status || "");
    if (APPROVAL_STATUSES.includes(status)) match.approvalStatus = status;

    // pending service shobar age, tarpor notun-ta age
    const list = await services
      .aggregate([
        { $match: match },
        {
          $addFields: {
            _order: { $cond: [{ $eq: ["$approvalStatus", "pending"] }, 0, 1] },
          },
        },
        { $sort: { _order: 1, createdAt: -1 } },
        { $project: { _order: 0 } },
      ])
      .toArray();

    res.json({ services: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

export async function updateServiceApproval(req, res, next) {
  try {
    const { services } = await getCollections();

    const id = toObjectId(req.params.id);
    if (!id) return res.status(404).json({ message: "Service not found" });

    const status = String(req.body.status || "");
    if (!["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be approved or rejected" });
    }

    const result = await services.updateOne(
      { _id: id },
      { $set: { approvalStatus: status } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Service not found" });
    }

    const service = await services.findOne({ _id: id });
    res.json({ message: `Service ${status}`, service });
  } catch (err) {
    next(err);
  }
}

// ---------- Bookings (read-only) ----------
export async function getAllBookings(req, res, next) {
  try {
    const { bookings } = await getCollections();

    const query = {};
    const status = String(req.query.status || "");
    if (BOOKING_STATUSES.includes(status)) query.status = status;

    const list = await bookings.find(query).sort({ createdAt: -1 }).toArray();
    res.json({ bookings: list, total: list.length });
  } catch (err) {
    next(err);
  }
}

// ---------- Payments ----------
export async function getAllPayments(req, res, next) {
  try {
    const { payments } = await getCollections();

    const list = await payments.find({}).sort({ paidAt: -1 }).toArray();
    const totalRevenue = list.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({ payments: list, total: list.length, totalRevenue });
  } catch (err) {
    next(err);
  }
}