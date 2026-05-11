import { Router } from "express";
import * as uploadsController from "../controllers/uploads.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.post("/", authMiddleware, uploadsController.uploadMiddleware, uploadsController.uploadImage);
router.post("/base64", authMiddleware, uploadsController.uploadImageBase64);

export default router;