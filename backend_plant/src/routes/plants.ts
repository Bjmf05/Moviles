import { Router } from "express";
import * as plantsController from "../controllers/plants.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/", authMiddleware, plantsController.createPlant);
router.get("/", authMiddleware, plantsController.getPlants);
router.get("/:id", authMiddleware, plantsController.getPlant);
router.put("/:id", authMiddleware, plantsController.updatePlant);
router.delete("/:id", authMiddleware, plantsController.deletePlant);

export default router;