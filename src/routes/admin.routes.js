import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyAdmin } from "../middleware/roles.js";
import {
  getAllBookings,
  getAllPayments,
  getAllServices,
  getUsers,
  updateServiceApproval,
  updateUserRole,
} from "../controllers/admin.controller.js";
import { getAdminStats } from "../controllers/admin-stats.controller.js";

const router = Router();

// Prottek route-e age token, tarpor admin check
router.get("/stats", verifyToken, verifyAdmin, getAdminStats);

router.get("/users", verifyToken, verifyAdmin, getUsers);
router.patch("/users/:id/role", verifyToken, verifyAdmin, updateUserRole);

router.get("/services", verifyToken, verifyAdmin, getAllServices);
router.patch("/services/:id/approval", verifyToken, verifyAdmin, updateServiceApproval);

router.get("/bookings", verifyToken, verifyAdmin, getAllBookings);
router.get("/payments", verifyToken, verifyAdmin, getAllPayments);

export default router;