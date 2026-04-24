const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

export type PlantInfo = {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
};

export async function identificarPlanta(base64: string): Promise<PlantInfo> {
  const response = await fetch(`${API_URL}/api/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64 }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("BFF error:", err);
    throw new Error(`Error BFF: ${response.status}`);
  }

  return response.json() as Promise<PlantInfo>;
}
