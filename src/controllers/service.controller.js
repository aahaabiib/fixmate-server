import { getCollections } from "../config/db.js";
import { CATEGORIES, SERVICE_MODES } from "../constants.js";
import { toObjectId } from "../utils/object-id.js";
import { validateServiceInput } from "../utils/validate-service.js";
import { attachRatings } from "../utils/attach-ratings.js";

const SORTS = {
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { basePrice: 1, _id: 1 },
  "price-desc": { basePrice: -1, _id: 1 },
};

// User er search text ke regex e dhokar age special character neutralize kori
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/services?search=&category=&mode=&sort=&page=&limit=
export async function getServices(req, res, next) {
  try {
    const { services } = await getCollections();

    const search = String(req.query.search ?? "").trim();
    const category = String(req.query.category ?? "");
    const mode = String(req.query.mode ?? "");
    const sort = SORTS[req.query.sort] ? req.query.sort : "newest";
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

    const filter = { approvalStatus: "approved", isAvailable: true };

    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      filter.$or = [{ title: regex }, { category: regex }];
    }
    if (CATEGORIES.includes(category)) filter.category = category;
    if (SERVICE_MODES.includes(mode)) filter.serviceMode = mode;

    const [items, total] = await Promise.all([
      services
        .find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      services.countDocuments(filter),
    ]);

    res.json({
      services: await attachRatings(items),
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
    });
  } catch (error) {
    next(error);
  }
}

// GET /api/services/:id (shudhu approved + available)
export async function getServiceById(req, res, next) {
  try {
    const _id = toObjectId(req.params.id);
    if (!_id) return res.status(404).json({ message: "Service not found" });

    const { services, users } = await getCollections();
    const service = await services.findOne({
      _id,
      approvalStatus: "approved",
      isAvailable: true,
    });
    if (!service) return res.status(404).json({ message: "Service not found" });

    const technician = await users.findOne(
      { email: service.technicianEmail },
      { projection: { _id: 0, name: 1, image: 1, area: 1, bio: 1 } }
    );

    res.json({ service, technician });
  } catch (error) {
    next(error);
  }
  
}

// Service ta khuje ber kore, owner na hole nijei response pathay ebong null dey
async function loadOwnedService(req, res) {
  const _id = toObjectId(req.params.id);
  if (!_id) {
    res.status(404).json({ message: "Service not found" });
    return null;
  }

  const { services } = await getCollections();
  const service = await services.findOne({ _id });
  if (!service) {
    res.status(404).json({ message: "Service not found" });
    return null;
  }
  if (service.technicianEmail !== req.user.email) {
    res.status(403).json({ message: "Forbidden: this is not your service" });
    return null;
  }
  return service;
}

// GET /api/services/mine
export async function getMyServices(req, res, next) {
  try {
    const { services } = await getCollections();
    const items = await services
      .find({ technicianEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ services: items });
  } catch (error) {
    next(error);
  }
}

// POST /api/services
export async function createService(req, res, next) {
  try {
    const { data, error } = validateServiceInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const { services } = await getCollections();
    const doc = {
      ...data,
      technicianName: req.user.name,
      technicianEmail: req.user.email,
      approvalStatus: "pending",
      isAvailable: true,
      createdAt: new Date(),
    };
    const result = await services.insertOne(doc);

    res.status(201).json({
      message: "Service submitted and waiting for admin approval",
      service: { ...doc, _id: result.insertedId },
    });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/services/:id (edit korle abar admin approval lagbe)
export async function updateService(req, res, next) {
  try {
    const existing = await loadOwnedService(req, res);
    if (!existing) return;

    const { data, error } = validateServiceInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const { services } = await getCollections();
    await services.updateOne(
      { _id: existing._id },
      { $set: { ...data, approvalStatus: "pending", updatedAt: new Date() } }
    );

    res.json({ message: "Service updated and sent for admin approval again" });
  } catch (error) {
    next(error);
  }
}

// PATCH /api/services/:id/availability
export async function toggleAvailability(req, res, next) {
  try {
    if (typeof req.body?.isAvailable !== "boolean") {
      return res.status(400).json({ message: "isAvailable must be true or false" });
    }
    const existing = await loadOwnedService(req, res);
    if (!existing) return;

    const { services } = await getCollections();
    await services.updateOne(
      { _id: existing._id },
      { $set: { isAvailable: req.body.isAvailable } }
    );

    res.json({
      message: req.body.isAvailable ? "Service is now available" : "Service is now hidden",
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /api/services/:id
export async function deleteService(req, res, next) {
  try {
    const existing = await loadOwnedService(req, res);
    if (!existing) return;

    const { services } = await getCollections();
    await services.deleteOne({ _id: existing._id });

    res.json({ message: "Service deleted" });
  } catch (error) {
    next(error);
  }
}