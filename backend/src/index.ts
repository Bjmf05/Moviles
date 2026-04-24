import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import identifyRouter from "./routes/identify";
import translateRouter from "./routes/translate";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rutas
app.use("/api/identify", identifyRouter);
app.use("/api/translate", translateRouter);

// Health check para Render
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🌿 Plant BFF corriendo en puerto ${PORT}`);
});
