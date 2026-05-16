import { ErrorRequestHandler } from "express";
import multer from "multer";
export const multerErrorHandler: ErrorRequestHandler = (
  err,
  req,
  res,
  next,
) => {
  if (err instanceof multer.MulterError) {
    console.warn(`Multer error: ${err.code} - ${err.message}`);

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(413).json({
          error: "File too large",
          code: "MULTER_LIMIT_FILE_SIZE",
          message: "El archivo es muy grande. Tamaño máximo: 10MB.",
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          error: "Unexpected file field",
          code: "MULTER_LIMIT_UNEXPECTED_FILE",
          message: "Nombre de campo de archivo no esperado.",
        });

      default:
        return res.status(400).json({
          error: "Upload error",
          code: `MULTER_${err.code}`,
          message: err.message,
        });
    }
  }

  if (err instanceof Error && err.message === "Invalid file type") {
    return res.status(400).json({
      error: "Invalid file type",
      code: "INVALID_FILE_TYPE",
      message:
        "Tipo de archivo no permitido. Solo se aceptan JPEG, PNG y WebP.",
    });
  }

  next(err);
};
