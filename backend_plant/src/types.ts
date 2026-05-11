export type PlantInfo = {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
};
