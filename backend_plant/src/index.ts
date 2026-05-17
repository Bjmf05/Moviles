import dotenv from "dotenv";
import express from "express";
import "dotenv/config";
dotenv.config();

import { getConfig } from "./config/index.js";
import identifyRouter from "./routes/identify.js";
import translateRouter from "./routes/translate.js";
import usersRouter from "./routes/users.js";
import plantsRouter from "./routes/plants.js";
import uploadsRouter from "./routes/uploads.js";
import calendarRouter from "./routes/calendar.js";
import { initFirebase } from "./services/firebase.js";
import { initSupabase } from "./services/supabase.js";
import { pinoHttp } from "pino-http";
import { logger } from "./utils/logger.js";
import helmet from "helmet";
import {
  genericLimiter,
  identifyLimiter,
  authLimiter,
  translateLimiter,
  uploadLimiter,
} from "./middleware/rateLimiter.js";
import { multerErrorHandler } from "./middleware/multerErrorHandler.js";

getConfig();

const app = express();
const PORT = process.env.PORT ?? 3000;
app.use(pinoHttp({ logger }));

app.use(express.json({ limit: "10mb" }));
app.use(helmet());

// Rutas
app.use(genericLimiter);
app.use("/api/identify", identifyRouter, identifyLimiter);
app.use("/api/translate", translateRouter, translateLimiter);
app.use("/api/auth", usersRouter, authLimiter);
app.use("/api/plants", plantsRouter);
app.use("/api/images", uploadsRouter, uploadLimiter);
app.use("/api/calendar", calendarRouter);

// Health check para Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(multerErrorHandler);

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error(err, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  },
);

async function start() {
  try {
    await initFirebase();
    await initSupabase();
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
}

start();
