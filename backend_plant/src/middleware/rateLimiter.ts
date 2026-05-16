import { rateLimit, ipKeyGenerator } from "express-rate-limit";

// Rate limiter genérico: 100 requests / 15 minutos
export const genericLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: "Demasiadas solicitudes, intenta de nuevo más tarde.",
  standardHeaders: true, // Devuelve info de rate limit en headers
  legacyHeaders: false,
});

// Rate limiter para identificación de plantas (más restrictivo)
// Plant.id es costoso en API
export const identifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 identificaciones por hora
  message:
    "Límite de identificaciones alcanzado. Intenta de nuevo en una hora.",
  keyGenerator: (req) => {
    if (req.user?.uid) {
      return `user-${req.user.uid}`;
    }
    return ipKeyGenerator(req.ip || "");
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para autenticación (muy restrictivo contra fuerza bruta)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos de login
  message: "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
  skipSuccessfulRequests: true, // No contar logins exitosos
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para traducción (moderado)
export const translateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 100,
  message: "Límite de traducciones alcanzado.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para uploads de imágenes
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 50, // 50 uploads por hora
  message: "Límite de uploads alcanzado.",
  standardHeaders: true,
  legacyHeaders: false,
});
