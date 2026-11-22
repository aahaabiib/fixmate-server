import { getCollections } from "../config/db.js";
import { BOOKING_STATUSES } from "../utils/booking-rules.js";

export async function getAdminStats(req, res, next) {
  try {
    const { users, services, bookings, payments } = await getCollections();

    const [
      totalUsers,
      totalTechnicians,
      totalCustomers,
      totalServices,
      pendingServices,
      approvedServices,
      totalBookings,
      bookingAgg,
      categoryAgg,
      revenueAgg,
    ] = await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ role: "technician" }),
      users.countDocuments({ role: "customer" }),
      services.countDocuments({}),
      services.countDocuments({ approvalStatus: "pending" }),
      services.countDocuments({ approvalStatus: "approved" }),
      bookings.countDocuments({}),
      bookings.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
      services.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]).toArray(),
      payments.aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }]).toArray(),
    ]);

    const bookingMap = Object.fromEntries(bookingAgg.map((b) => [b._id, b.count]));

    res.json({
      totalUsers,
      totalTechnicians,
      totalCustomers,
      totalServices,
      pendingServices,
      approvedServices,
      totalBookings,
      totalRevenue: revenueAgg[0]?.total || 0,
      // chart-er jonno: status onujayi booking sonkha (0 hole-o thakbe)
      bookingsByStatus: BOOKING_STATUSES.map((status) => ({
        status,
        count: bookingMap[status] || 0,
      })),
      servicesByCategory: categoryAgg
        .map((c) => ({ category: c._id, count: c.count }))
        .sort((a, b) => b.count - a.count),
    });
  } catch (err) {
    next(err);
  }
}