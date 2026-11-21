import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { verifyTechnician } from "../middleware/roles.js";
import {
  createService,
  deleteService,
  getMyServices,
  getServiceById,
  getServices,
  toggleAvailability,
  updateService,
} from "../controllers/service.controller.js";

const router = Router();

// Public
router.get("/", getServices);

// "/mine" ke "/:id" er AGE rakhte hobe, na hole "mine" ke id dhore nibe
router.get("/mine", verifyToken, verifyTechnician, getMyServices);

router.get("/:id", getServiceById);

// Technician only
router.post("/", verifyToken, verifyTechnician, createService);
router.patch("/:id/availability", verifyToken, verifyTechnician, toggleAvailability);
router.patch("/:id", verifyToken, verifyTechnician, updateService);
router.delete("/:id", verifyToken, verifyTechnician, deleteService);

export default router;