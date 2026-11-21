import { getCollections } from "../config/db.js";
import { toObjectId } from "../utils/object-id.js";
import { validateBookingInput } from "../utils/validate-booking.js";
import {
  ACTIVE_STATUSES,
  BOOKING_STATUSES,
  TECHNICIAN_TRANSITIONS,
} from "../utils/booking-rules.js";

// ---------- Customer: notun request ----------
export async function createBooking(req, res, next) {
  try {
    const { services, bookings } = await getCollections();

    const serviceId = toObjectId(req.body.serviceId);
    if (!serviceId) {
      return res.status(400).json({ message: "Valid service is required" });
    }

    const error = validateBookingInput(req.body);
    if (error) return res.status(400).json({ message: error });

    // Shudhu approved + available service-e request kora jay
    const service = await services.findOne({
      _id: serviceId,
      approvalStatus: "approved",
      isAvailable: true,
    });
    if (!service) {
      return res
        .status(404)
        .json({ message: "Service not found or not available" });
    }

    if (service.technicianEmail === req.user.email) {
      return res
        .status(403)
        .json({ message: "You cannot request your own service" });
    }

    // Ek service-e duita active request na
    const duplicate = await bookings.findOne({
      serviceId: String(service._id),
      customerEmail: req.user.email,
      status: { $in: ACTIVE_STATUSES },
    });
    if (duplicate) {
      return res.status(409).json({
        message: "You already have an active request for this service",
      });
    }

    const now = new Date();
    const booking = {
      serviceId: String(service._id),
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      // Customer-er info session theke, client-er pathano data theke na
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: String(req.body.customerPhone).trim(),
      address: String(req.body.address).trim(),
      preferredDate: String(req.body.preferredDate).trim(),
      problemDescription: String(req.body.problemDescription).trim(),
      status: "requested",
      finalAmount: service.basePrice,
      paymentStatus: "unpaid",
      rating: null,
      review: null,
      statusHistory: [{ status: "requested", changedAt: now }],
      createdAt: now,
    };

    const result = await bookings.insertOne(booking);

    res.status(201).json({
      message: "Repair request sent successfully",
      booking: { ...booking, _id: result.insertedId },
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Customer: nijer booking ----------
export async function getMyBookings(req, res, next) {
  try {
    const { bookings } = await getCollections();
    const list = await bookings
      .find({ customerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();
    res.json({ bookings: list });
  } catch (err) {
    next(err);
  }
}

// ---------- Customer: cancel ----------
export async function cancelBooking(req, res, next) {
  try {
    const { bookings } = await getCollections();

    const id = toObjectId(req.params.id);
    if (!id) return res.status(404).json({ message: "Booking not found" });

    const booking = await bookings.findOne({ _id: id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customerEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Forbidden: this is not your booking" });
    }

    if (booking.status !== "requested") {
      return res.status(400).json({
        message: "Only requests that are still pending can be cancelled",
      });
    }

    // filter-e status: "requested" ache, tai race condition-e-o safe
    const result = await bookings.updateOne(
      { _id: id, status: "requested" },
      {
        $set: { status: "cancelled" },
        $push: { statusHistory: { status: "cancelled", changedAt: new Date() } },
      }
    );
    if (result.matchedCount === 0) {
      return res
        .status(409)
        .json({ message: "Booking was just updated. Please refresh." });
    }

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    next(err);
  }
}

// ---------- Technician: nijer booking ----------
export async function getTechnicianBookings(req, res, next) {
  try {
    const { bookings } = await getCollections();

    const query = { technicianEmail: req.user.email };
    const status = String(req.query.status || "");
    if (BOOKING_STATUSES.includes(status)) query.status = status;

    const list = await bookings.find(query).sort({ createdAt: -1 }).toArray();
    res.json({ bookings: list });
  } catch (err) {
    next(err);
  }
}

// ---------- Technician: status pipeline ----------
export async function updateBookingStatus(req, res, next) {
  try {
    const { bookings } = await getCollections();

    const id = toObjectId(req.params.id);
    if (!id) return res.status(404).json({ message: "Booking not found" });

    const booking = await bookings.findOne({ _id: id });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.technicianEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: "Forbidden: this booking is not assigned to you" });
    }

    const nextStatus = String(req.body.status || "");
    const allowed = TECHNICIAN_TRANSITIONS[booking.status] || [];

    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        message: `Cannot change status from "${booking.status}" to "${nextStatus}"`,
      });
    }

    const set = { status: nextStatus };

    if (nextStatus === "completed") {
      const amount = Number(req.body.finalAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Final amount must be greater than 0" });
      }
      set.finalAmount = amount;
    }

    const result = await bookings.updateOne(
      { _id: id, status: booking.status },
      {
        $set: set,
        $push: { statusHistory: { status: nextStatus, changedAt: new Date() } },
      }
    );
    if (result.matchedCount === 0) {
      return res
        .status(409)
        .json({ message: "Booking was just updated. Please refresh." });
    }

    const updated = await bookings.findOne({ _id: id });
    res.json({ message: `Status updated to ${nextStatus}`, booking: updated });
  } catch (err) {
    next(err);
  }
}