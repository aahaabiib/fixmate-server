import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";

let indexesReady = null;

// unique index: ekta session ba ekta booking er jonno ekta-i payment
function ensureIndexes(payments) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      payments.createIndex({ stripeSessionId: 1 }, { unique: true }),
      payments.createIndex({ bookingId: 1 }, { unique: true }),
    ]).catch((err) => {
      indexesReady = null;
      throw err;
    });
  }
  return indexesReady;
}

// verify endpoint ar webhook, duto-i eta call kore. Bar bar call korleo ekbar-i save hoy.
export async function savePaymentFromSession(session) {
  if (session.payment_status !== "paid") {
    return { inserted: false, payment: null };
  }

  const bookingId = session.metadata?.bookingId;
  if (!bookingId || !ObjectId.isValid(bookingId)) {
    throw new Error("Stripe session has no valid bookingId");
  }

  const db = await getDb();
  const payments = db.collection("payments");
  const bookings = db.collection("bookings");
  await ensureIndexes(payments);

  const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });
  if (!booking) throw new Error("Booking not found for this payment");

  const paymentIntent =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const doc = {
    bookingId: String(booking._id),
    serviceTitle: booking.serviceTitle,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    technicianName: booking.technicianName,
    technicianEmail: booking.technicianEmail,
    amount: (session.amount_total ?? 0) / 100,
    currency: session.currency || "usd",
    transactionId: paymentIntent || null,
    paymentStatus: "paid",
    type: "job",
    paidAt: new Date(),
  };

  let inserted = false;
  try {
    const result = await payments.updateOne(
      { stripeSessionId: session.id },
      { $setOnInsert: doc },
      { upsert: true }
    );
    inserted = result.upsertedCount === 1;
  } catch (err) {
    // 11000 = duplicate key, mane age-i save hoye geche, ta thik ache
    if (err?.code !== 11000) throw err;
  }

  // booking paid kore dao (already paid hole kichu change hobe na)
  await bookings.updateOne(
    { _id: booking._id, paymentStatus: { $ne: "paid" } },
    { $set: { paymentStatus: "paid" } }
  );

  const payment =
    (await payments.findOne({ stripeSessionId: session.id })) ||
    (await payments.findOne({ bookingId: String(booking._id) }));

  return { inserted, payment };
}