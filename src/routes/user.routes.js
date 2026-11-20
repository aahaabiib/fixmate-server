import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// Logged-in user er current info (role database theke ashe)
router.get("/me", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;