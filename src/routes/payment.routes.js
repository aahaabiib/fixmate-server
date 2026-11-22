import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyCustomer } from "../middleware/roles.js";
import { getMyPayments } from "../controllers/payment.controller.js";
import {
  createCheckoutSession,
  verifyPayment,
} from "../controllers/checkout.controller.js";

const router = Router();

router.get("/my", verifyToken, verifyCustomer, getMyPayments);
router.get("/verify", verifyToken, verifyCustomer, verifyPayment);
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

export default router;