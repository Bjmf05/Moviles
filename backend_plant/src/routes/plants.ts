import { Router } from "express";
import * as plantsController from "../controllers/plants.js";
import * as wateringsController from "../controllers/waterings.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/", authMiddleware, plantsController.createPlant);
router.get("/", authMiddleware, plantsController.getPlants);
router.get("/:id", authMiddleware, plantsController.getPlant);
router.put("/:id", authMiddleware, plantsController.updatePlant);
router.delete("/:id", authMiddleware, plantsController.deletePlant);

router.post("/:id/water", authMiddleware, wateringsController.markWatered);
router.put("/:id/schedule", authMiddleware, wateringsController.editSchedule);

export default router;