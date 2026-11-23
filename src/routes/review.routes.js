import { Router } from "express";
import { getServiceReviews } from "../controllers/review.controller.js";

const router = Router();

// Public
router.get("/:id/reviews", getServiceReviews);

export default router;