import { Router, Request, Response } from "express";
import { PlantInfo } from "../types.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Traducciones locales para condiciones de luz comunes (evita una llamada extra a MyMemory)
const LUZ_MAP: Record<string, string> = {
  "full sunlight": "Pleno sol",
  "full sun": "Pleno sol",
  "direct sun": "Sol directo",
  "bright sun": "Sol brillante",
  "partial shade": "Semisombra",
  "partial sun": "Semisombra",
  "partial sunlight": "Semisombra",
  "full shade": "Sombra total",
  "indirect light": "Luz indirecta",
  "bright indirect light": "Luz indirecta brillante",
  "low light": "Poca luz",
  "medium light": "Luz media",
  "bright light": "Luz brillante",
  "low to bright indirect light": "Luz indirecta de baja a brillante",
};

const traducirLuz = (luz: string): string =>
  LUZ_MAP[luz?.toLowerCase()] ?? luz ?? "Luz indirecta";

// Traduce texto usando MyMemory (desde el servidor, con email para mayor cuota)
const traducir = async (texto: string): Promise<string> => {
  if (!texto || texto === "Sin descripción disponible.") return texto;
  try {
    const email = process.env.MYMEMORY_EMAIL;
    const emailParam = email ? `&de=${encodeURIComponent(email)}` : "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=en|es${emailParam}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      responseStatus: number;
      responseData?: { translatedText?: string };
    };
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText;
    }
    return texto;
  } catch {
    return texto;
  }
};

// POST /api/identify
// Body: { base64: string }  (imagen JPEG en base64, sin prefijo data:)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { base64 } = req.body as { base64?: string };

  if (!base64 || typeof base64 !== "string" || base64.trim() === "") {
    res.status(400).json({ error: "El campo 'base64' es requerido" });
    return;
  }

  const apiKey = process.env.PLANT_ID_API_KEY;
  if (!apiKey) {
    res
      .status(500)
      .json({ error: "PLANT_ID_API_KEY no configurada en el servidor" });
    return;
  }

  const upstream = await fetch(
    "https://api.plant.id/v3/identification?classification_level=species&details=common_names,description,watering,best_light_condition,toxicity",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": apiKey,
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64}`],
      }),
    },
  );

  if (!upstream.ok) {
    const errText = await upstream.text();
    logger.error("Plant.id API error: %s - %s", upstream.status, errText);
    res.status(502).json({ error: `Error Plant.id: ${upstream.status}` });
    return;
  }

  const data = (await upstream.json()) as {
    result?: {
      is_plant?: { binary?: boolean };
      classification?: {
        suggestions?: Array<{
          name: string;
          details?: {
            common_names?: string[];
            description?: { value?: string };
            toxicity?: string;
            best_light_condition?: string;
            watering?: { max?: number };
          };
        }>;
      };
    };
  };

  // No es una planta
  const isPlant = data.result?.is_plant?.binary;
  if (!isPlant) {
    const result: PlantInfo = {
      nombreComun: "No es una planta",
      nombreCientifico: "",
      descripcion: "No se detectó ninguna planta en la imagen.",
      cuidados: { riego: "—", luz: "—", temperatura: "—" },
      toxicidad: { esToxica: false, detalle: "—" },
    };
    res.json(result);
    return;
  }

  const best = data.result!.classification!.suggestions![0];
  const commonNameRaw = best.details?.common_names?.[0] ?? best.name;
  const descriptionRaw =
    best.details?.description?.value ?? "Sin descripción disponible.";
  const toxicRaw = best.details?.toxicity ?? null;
  const lightRaw = best.details?.best_light_condition ?? "";
  const wateringMax = best.details?.watering?.max;

  const luzBasica = traducirLuz(lightRaw);
  const luzPromesa =
    lightRaw && luzBasica === lightRaw
      ? traducir(lightRaw)
      : Promise.resolve(luzBasica);

  const [descripcion, toxicTraducido, luzTraducida] = await Promise.all([
    traducir(descriptionRaw.slice(0, 300)),
    toxicRaw ? traducir(toxicRaw) : Promise.resolve(null),
    luzPromesa,
  ]);

  const result: PlantInfo = {
    nombreComun: commonNameRaw,
    nombreCientifico: best.name,
    descripcion: descripcion + (descriptionRaw.length > 300 ? "..." : ""),
    cuidados: {
      riego: wateringMax ? `Cada ${wateringMax} días` : "Riego moderado",
      luz: luzTraducida || "Luz indirecta",
      temperatura: "15°C – 30°C",
    },
    toxicidad: {
      esToxica: !!toxicRaw,
      detalle: toxicTraducido ?? "Sin información de toxicidad.",
    },
  };

  res.json(result);
});

export default router;
