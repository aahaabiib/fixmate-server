import { getCollections } from "../config/db.js";
import { toObjectId } from "../utils/object-id.js";

// ---------- Customer: rating dao (ekbar-i) ----------
export async function addReview(req, res, next) {
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

    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ message: "You can rate only a completed job" });
    }

    if (booking.rating !== null && booking.rating !== undefined) {
      return res
        .status(409)
        .json({ message: "You have already rated this job" });
    }

    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a whole number from 1 to 5" });
    }

    const review = String(req.body.review || "").trim();
    if (review.length > 300) {
      return res
        .status(400)
        .json({ message: "Review can be at most 300 characters" });
    }

    // filter-e rating: null ache, tai dui bar click korleo ekbar-i save hobe
    const result = await bookings.updateOne(
      { _id: id, rating: null },
      { $set: { rating, review: review || null, reviewedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res
        .status(409)
        .json({ message: "You have already rated this job" });
    }

    res.json({ message: "Thank you for your review" });
  } catch (err) {
    next(err);
  }
}

// ---------- Public: ekta service er review ----------
export async function getServiceReviews(req, res, next) {
  try {
    const { bookings } = await getCollections();

    const all = await bookings
      .find(
        { serviceId: req.params.id, rating: { $ne: null } },
        {
          projection: {
            customerName: 1,
            rating: 1,
            review: 1,
            reviewedAt: 1,
            createdAt: 1,
          },
        }
      )
      .toArray();

    const count = all.length;
    const sum = all.reduce((total, b) => total + b.rating, 0);
    const average = count ? Math.round((sum / count) * 10) / 10 : 0;

    const toTime = (b) => new Date(b.reviewedAt || b.createdAt).getTime();
    const reviews = all
      .sort((a, b) => toTime(b) - toTime(a))
      .slice(0, 20)
      .map((b) => ({
        _id: b._id,
        customerName: b.customerName,
        rating: b.rating,
        review: b.review,
        date: b.reviewedAt || b.createdAt,
      }));

    res.json({ average, count, reviews });
  } catch (err) {
    next(err);
  }
}