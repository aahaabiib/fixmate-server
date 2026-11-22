import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyCustomer } from "../middleware/roles.js";
import { getMyPayments } from "../controllers/payment.controller.js";

const router = Router();

router.get("/my", verifyToken, verifyCustomer, getMyPayments);

export default router;