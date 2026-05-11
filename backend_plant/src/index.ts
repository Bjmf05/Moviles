import cors from "cors";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

import { getConfig } from "./config/index.js";
import identifyRouter from "./routes/identify.js";
import translateRouter from "./routes/translate.js";
import usersRouter from "./routes/users.js";
import plantsRouter from "./routes/plants.js";
import uploadsRouter from "./routes/uploads.js";
import { initFirebase } from "./services/firebase.js";
import { initSupabase } from "./services/supabase.js";

getConfig();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rutas
app.use("/api/identify", identifyRouter);
app.use("/api/translate", translateRouter);
app.use("/api/auth", usersRouter);
app.use("/api/plants", plantsRouter);
app.use("/api/images", uploadsRouter);

// Health check para Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

async function start() {
  try {
    await initFirebase();
    await initSupabase();
    app.listen(PORT, () => {
      console.log(` Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
