import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyCustomer, verifyTechnician } from "../middleware/roles.js";
import {
  cancelBooking,
  createBooking,
  getMyBookings,
  getTechnicianBookings,
  updateBookingStatus,
} from "../controllers/booking.controller.js";
import { addReview } from "../controllers/review.controller.js";

const router = Router();

// Customer
router.post("/", verifyToken, verifyCustomer, createBooking);
router.get("/my", verifyToken, verifyCustomer, getMyBookings);
router.patch("/:id/cancel", verifyToken, verifyCustomer, cancelBooking);
router.patch("/:id/review", verifyToken, verifyCustomer, addReview);

// Technician
router.get("/technician", verifyToken, verifyTechnician, getTechnicianBookings);
router.patch("/:id/status", verifyToken, verifyTechnician, updateBookingStatus);

export default router;