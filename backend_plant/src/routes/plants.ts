import { Router } from "express";
import * as plantsController from "../controllers/plants.js";
import * as wateringsController from "../controllers/waterings.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateCreatePlant,
  validateUpdatePlant,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validateCreatePlant,
  handleValidationErrors,
  plantsController.createPlant,
);
router.get("/", authMiddleware, plantsController.getPlants);
router.get("/:id", authMiddleware, plantsController.getPlant);
router.put(
  "/:id",
  authMiddleware,
  validateUpdatePlant,
  handleValidationErrors,
  plantsController.updatePlant,
);
router.delete("/:id", authMiddleware, plantsController.deletePlant);

router.post("/:id/water", authMiddleware, wateringsController.markWatered);
router.put("/:id/schedule", authMiddleware, wateringsController.editSchedule);

export default router;
