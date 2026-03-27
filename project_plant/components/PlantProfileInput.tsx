import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Option = { label: string; emoji: string; value: string };

type PlantProfileInputProps = {
  tipoPlanta: string;
  frecuenciaRiego: string;
  cantidadLuz: string;
  nivelCuidado: string;
  onChange: (field: string, value: string) => void;
};

const TIPOS: Option[] = [
  { label: "Interior", emoji: "🏠", value: "interior" },
  { label: "Exterior", emoji: "🌳", value: "exterior" },
  { label: "Acuática", emoji: "💧", value: "acuatica" },
  { label: "Suculenta", emoji: "🌵", value: "suculenta" },
];

const RIEGO: Option[] = [
  { label: "Diario", emoji: "💦", value: "diario" },
  { label: "Semanal", emoji: "🚿", value: "semanal" },
  { label: "Quincenal", emoji: "📅", value: "quincenal" },
  { label: "Mensual", emoji: "🗓️", value: "mensual" },
];

const LUZ: Option[] = [
  { label: "Pleno sol", emoji: "☀️", value: "pleno_sol" },
  { label: "Semisombra", emoji: "⛅", value: "semisombra" },
  { label: "Sombra", emoji: "🌑", value: "sombra" },
  { label: "Artificial", emoji: "💡", value: "artificial" },
];

const CUIDADO: Option[] = [
  { label: "Fácil", emoji: "😊", value: "facil" },
  { label: "Medio", emoji: "🤔", value: "medio" },
  { label: "Difícil", emoji: "😅", value: "dificil" },
  { label: "Experto", emoji: "🧑‍🌾", value: "experto" },
];

function OptionGroup({
  title,
  options,
  selected,
  field,
  onChange,
}: {
  title: string;
  options: Option[];
  selected: string;
  field: string;
  onChange: (field: string, value: string) => void;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.optionsRow}>
        {options.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onChange(field, opt.value)}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected && styles.optionLabelSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function PlantProfileInput({
  tipoPlanta,
  frecuenciaRiego,
  cantidadLuz,
  nivelCuidado,
  onChange,
}: PlantProfileInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌿 Perfil de la planta</Text>
      <OptionGroup
        title="Tipo"
        options={TIPOS}
        selected={tipoPlanta}
        field="tipoPlanta"
        onChange={onChange}
      />
      <OptionGroup
        title="Frecuencia de riego"
        options={RIEGO}
        selected={frecuenciaRiego}
        field="frecuenciaRiego"
        onChange={onChange}
      />
      <OptionGroup
        title="Cantidad de luz"
        options={LUZ}
        selected={cantidadLuz}
        field="cantidadLuz"
        onChange={onChange}
      />
      <OptionGroup
        title="Nivel de cuidado"
        options={CUIDADO}
        selected={nivelCuidado}
        field="nivelCuidado"
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", marginBottom: 16 },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b4332",
    marginBottom: 16,
  },
  group: { marginBottom: 18 },
  groupTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#d8f3dc",
    minWidth: 72,
  },
  optionSelected: { backgroundColor: "#2d6a4f", borderColor: "#2d6a4f" },
  optionEmoji: { fontSize: 22, marginBottom: 4 },
  optionLabel: { fontSize: 11, fontWeight: "600", color: "#52796f" },
  optionLabelSelected: { color: "#fff" },
});
