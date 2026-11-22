import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { getProfile, updateProfile } from "../controllers/profile.controller.js";

const router = Router();

// je kono logged-in user (customer, technician, admin)
router.get("/profile", verifyToken, getProfile);
router.patch("/profile", verifyToken, updateProfile);

export default router;