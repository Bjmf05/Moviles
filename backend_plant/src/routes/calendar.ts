import { Router } from "express";
import { getCalendarMonth } from "../controllers/calendar.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.get("/", authMiddleware, getCalendarMonth);

export default router;
