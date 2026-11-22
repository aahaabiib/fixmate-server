import { ObjectId } from "mongodb";
import { getDb } from "../config/db.js";
import { getStripe } from "../config/stripe.js";
import { savePaymentFromSession } from "../services/payment-service.js";

function getClientUrl(req) {
  const allowed = (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  return allowed.includes(origin) ? origin : allowed[0];
}

// POST /api/payments/create-checkout-session
export async function createCheckoutSession(req, res) {
  try {
    const { bookingId } = req.body || {};
    if (!bookingId || !ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking id" });
    }

    const db = await getDb();
    const booking = await db
      .collection("bookings")
      .findOne({ _id: new ObjectId(bookingId) });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "This is not your booking" });
    }
    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ message: "You can pay only after the job is completed" });
    }
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "This booking is already paid" });
    }

    // amount sobsomoy booking theke, client er kotha shuni na
    const amount = Number(booking.finalAmount ?? booking.basePrice);
    if (!(amount > 0)) {
      return res.status(400).json({ message: "Invalid payment amount" });
    }

    const clientUrl = getClientUrl(req);

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: booking.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: booking.serviceTitle,
              description: `Repair service by ${booking.technicianName}`,
            },
          },
        },
      ],
      metadata: {
        type: "job",
        bookingId: String(booking._id),
        customerEmail: booking.customerEmail,
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel?booking_id=${booking._id}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session error:", err.message);
    res.status(502).json({ message: "Could not start the payment. Please try again." });
  }
}

// GET /api/payments/verify?session_id=
export async function verifyPayment(req, res) {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ message: "session_id is required" });
    }

    let session;
    try {
      session = await getStripe().checkout.sessions.retrieve(sessionId);
    } catch {
      return res.status(404).json({ message: "Payment session not found" });
    }

    if (session.metadata?.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "This payment is not yours" });
    }
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment is not completed" });
    }

    const { payment } = await savePaymentFromSession(session);
    res.json({ payment });
  } catch (err) {
    console.error("verify payment error:", err.message);
    res.status(500).json({ message: "Could not verify the payment" });
  }
}

// POST /api/payments/webhook (raw body lage, app.js e alada kore boshabo)
export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers["stripe-signature"];

  if (!secret || !signature) {
    return res.status(400).send("Webhook is not configured");
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      if (session.mode === "payment" && session.metadata?.type === "job") {
        await savePaymentFromSession(session);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error("webhook handler error:", err.message);
    // 500 dile Stripe pore abar try korbe
    res.status(500).json({ message: "Webhook handler failed" });
  }
}