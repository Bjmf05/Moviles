import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

/**
 * Middleware que devuelve 400 si hay errores de validación
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: errors.array().map((err) => ({
        field: err.type === "field" ? err.path : "unknown",
        message: err.msg,
      })),
    });
    return;
  }
  next();
};

/**
 * Validadores para autenticación
 */
export const validateCreateUser = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "El nombre solo puede contener letras, espacios, apóstrofes y guiones",
    ),
  body("email")
    .trim()
    .isEmail()
    .withMessage("El correo no es válido")
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage("El correo no puede exceder 255 caracteres"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .isLength({ max: 128 })
    .withMessage("La contraseña no puede exceder 128 caracteres"),
  body("birthdate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de nacimiento no es válida"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El país debe tener entre 2 y 100 caracteres"),
];

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("El correo no es válido")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("La contraseña es obligatoria"),
];

export const validateUpdateProfile = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El nombre debe tener entre 2 y 100 caracteres")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage(
      "El nombre solo puede contener letras, espacios, apóstrofes y guiones",
    ),
  body("birthdate")
    .optional()
    .isISO8601()
    .withMessage("La fecha de nacimiento no es válida"),
  body("country")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("El país debe tener entre 2 y 100 caracteres"),
];

/**
 * Validadores para plantas
 */
export const validateCreatePlant = [
  body("nombreComun")
    .trim()
    .notEmpty()
    .withMessage("El nombre común es obligatorio")
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre común debe tener entre 2 y 200 caracteres")
    .escape(), // Escapar caracteres HTML
  body("nombreCientifico")
    .optional()
    .trim()
    .isLength({ max: 300 })
    .withMessage("El nombre científico no puede exceder 300 caracteres")
    .escape(),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede exceder 2000 caracteres")
    .escape(),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Las notas no pueden exceder 2000 caracteres")
    .escape(),
  body("cuidados")
    .optional()
    .isObject()
    .withMessage("Los cuidados deben ser un objeto"),
  body("cuidados.riego")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Instrucciones de riego no pueden exceder 500 caracteres")
    .escape(),
  body("cuidados.luz")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Instrucciones de luz no pueden exceder 500 caracteres")
    .escape(),
  body("cuidados.temperatura")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage(
      "Instrucciones de temperatura no pueden exceder 500 caracteres",
    )
    .escape(),
  body("toxicidad")
    .optional()
    .isObject()
    .withMessage("Toxicidad debe ser un objeto"),
  body("toxicidad.esToxica")
    .optional()
    .isBoolean()
    .withMessage("esToxica debe ser booleano"),
  body("toxicidad.detalle")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Detalle de toxicidad no puede exceder 500 caracteres")
    .escape(),
  body("imageUri")
    .optional()
    .isURL()
    .withMessage("imageUri debe ser una URL válida"),
];

export const validateUpdatePlant = [
  body("nombreComun")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("El nombre común debe tener entre 2 y 200 caracteres")
    .escape(),
  body("descripcion")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La descripción no puede exceder 2000 caracteres")
    .escape(),
  body("notes")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Las notas no pueden exceder 2000 caracteres")
    .escape(),
];

/**
 * Validadores para uploads
 */
export const validateUploadBase64 = [
  body("image")
    .notEmpty()
    .withMessage("La imagen es obligatoria")
    .isBase64()
    .withMessage("La imagen no es base64 válida"),
  body("filename")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("El nombre del archivo debe tener entre 1 y 255 caracteres")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage("El nombre del archivo contiene caracteres inválidos"),
];

/**
 * Validadores para riego
 */
export const validateCreateWatering = [
  body("frequencyDays")
    .isInt({ min: 1, max: 365 })
    .withMessage("Frecuencia debe ser entre 1 y 365 días"),
  body("nextWateringDate")
    .optional()
    .isISO8601()
    .withMessage("nextWateringDate no es válida"),
];
