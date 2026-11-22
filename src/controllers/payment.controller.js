import { getCollections } from "../config/db.js";

// Customer-er nijer payment history
export async function getMyPayments(req, res, next) {
  try {
    const { payments } = await getCollections();
    const list = await payments
      .find({ customerEmail: req.user.email })
      .sort({ paidAt: -1 })
      .toArray();
    const totalPaid = list.reduce((sum, p) => sum + (p.amount || 0), 0);
    res.json({ payments: list, total: list.length, totalPaid });
  } catch (err) {
    next(err);
  }
}