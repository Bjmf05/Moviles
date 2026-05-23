import { Router } from "express";
import * as timelineController from "../controllers/timeline.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateTimelineEntry,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = Router();

router.get("/:id/timeline", authMiddleware, timelineController.getTimeline);
router.post(
  "/:id/timeline",
  authMiddleware,
  validateTimelineEntry,
  handleValidationErrors,
  timelineController.addTimelineEntry,
);
router.delete(
  "/:id/timeline/:entryId",
  authMiddleware,
  timelineController.deleteTimelineEntry,
);

export default router;
