const PLANT_ID_KEY = process.env.EXPO_PUBLIC_PLANT_ID_API_KEY || "";

export type PlantInfo = {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
};

// Traducciones de condiciones de luz
const traducirLuz = (luz: string): string => {
  const map: Record<string, string> = {
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
  return map[luz?.toLowerCase()] ?? luz ?? "Luz indirecta";
};

// Traduce texto usando MyMemory
const traducir = async (texto: string): Promise<string> => {
  if (!texto || texto === "Sin descripción disponible.") return texto;
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      texto,
    )}&langpair=en|es`;
    const res = await fetch(url);
    const data = await res.json();
    const traduccion = data.responseData?.translatedText;
    if (traduccion && data.responseStatus === 200) {
      return traduccion;
    }
    return texto;
  } catch (e) {
    console.error("❌ Error traduciendo:", e);
    return texto;
  }
};

export async function identificarPlanta(base64: string): Promise<PlantInfo> {
  const response = await fetch(
    "https://api.plant.id/v3/identification?classification_level=species&details=common_names,description,watering,best_light_condition,toxicity",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": PLANT_ID_KEY,
      },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64}`],
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Plant.id error:", err);
    throw new Error(`Error Plant.id: ${response.status}`);
  }

  const data = await response.json();

  // No es una planta
  const isPlant = data.result?.is_plant?.binary;
  if (!isPlant) {
    return {
      nombreComun: "No es una planta",
      nombreCientifico: "",
      descripcion: "No se detectó ninguna planta en la imagen.",
      cuidados: { riego: "—", luz: "—", temperatura: "—" },
      toxicidad: { esToxica: false, detalle: "—" },
    };
  }

  const best = data.result.classification.suggestions[0];

  // Datos en inglés
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

  // Traducir descripción y toxicidad
  const [descripcion, toxicTraducido, luzTraducida] = await Promise.all([
    traducir(descriptionRaw.slice(0, 300)),
    toxicRaw ? traducir(toxicRaw) : Promise.resolve(null),
    luzPromesa,
  ]);

  return {
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
}
