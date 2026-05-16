import { Router } from "express";
import * as uploadsController from "../controllers/uploads.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateUploadBase64,
  handleValidationErrors,
} from "../middleware/validators.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  uploadsController.uploadMiddleware,
  uploadsController.uploadImage,
);
router.post(
  "/base64",
  validateUploadBase64,
  handleValidationErrors,
  authMiddleware,
  uploadsController.uploadImageBase64,
);

export default router;
