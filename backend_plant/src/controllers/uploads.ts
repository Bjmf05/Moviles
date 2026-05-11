import { Request, Response } from "express";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { getConfig } from "../config/index.js";
import { uploadUserImage } from "../services/supabase.js";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10485760 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export const uploadMiddleware = upload.single("image");

export async function uploadImage(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "No file provided" });
      return;
    }

    const filename = `${req.file.originalname}`;
    const imageUrl = await uploadUserImage(uid, req.file.buffer, filename);

    res.json({
      url: imageUrl,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
}

export async function uploadImageBase64(req: Request, res: Response): Promise<void> {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { image, filename } = req.body;

    if (!image) {
      res.status(400).json({ error: "No image data provided" });
      return;
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const name = filename || `${uuid()}.jpg`;

    const imageUrl = await uploadUserImage(uid, buffer, name);

    res.json({
      url: imageUrl,
      filename: name,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
}