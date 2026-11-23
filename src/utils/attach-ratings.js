import { getCollections } from "../config/db.js";

// Service list e prottek service er average rating ar review count jure dey.
// Ekta-i aggregate query, tai card onujayi alada query lage na.
export async function attachRatings(list) {
  if (!list.length) return list;

  const { bookings } = await getCollections();
  const ids = list.map((s) => String(s._id));

  const stats = await bookings
    .aggregate([
      { $match: { serviceId: { $in: ids }, rating: { $ne: null } } },
      {
        $group: {
          _id: "$serviceId",
          sum: { $sum: "$rating" },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray();

  const map = new Map(stats.map((s) => [s._id, s]));

  return list.map((service) => {
    const s = map.get(String(service._id));
    return {
      ...service,
      averageRating: s ? Math.round((s.sum / s.count) * 10) / 10 : 0,
      reviewCount: s ? s.count : 0,
    };
  });
}