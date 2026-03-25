import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { savePlant, uploadPlantImage } from "../../lib/plants";

const PLANT_ID_KEY = process.env.EXPO_PUBLIC_PLANT_ID_API_KEY || "";

type PlantInfo = {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  cuidados: { riego: string; luz: string; temperatura: string };
  toxicidad: { esToxica: boolean; detalle: string };
};

export default function CameraScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async (source: "camera" | "gallery") => {
    let res;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted")
        return Alert.alert("Se necesita permiso de cámara");
      res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    } else {
      res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    }
    if (!res.canceled) {
      const uri = res.assets[0].uri;
      setImage(uri);
      setResult(null);
      setSaved(false);
      setNotes("");
      analyzeImage(uri);
    }
  };

  const analyzeImage = async (uri: string) => {
    setLoading(true);
    try {
      // 1. Comprimir imagen
      const { base64 } = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );

      const plantResponse = await fetch(
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

      const rawText = await plantResponse.text();
      console.log("Plant.id response:", rawText);
      console.log("Status:", plantResponse.status);

      let plantData;
      try {
        plantData = JSON.parse(rawText);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
      // 3. Verificar si encontró una planta
      const isPlant = plantData.result?.is_plant?.binary;
      if (!isPlant) {
        setResult({
          nombreComun: "No es una planta",
          nombreCientifico: "",
          descripcion: "No se detectó ninguna planta en la imagen.",
          cuidados: { riego: "—", luz: "—", temperatura: "—" },
          toxicidad: { esToxica: false, detalle: "—" },
        });
        return;
      }

      // 4. Tomar el resultado más probable
      const best = plantData.result.classification.suggestions[0];
      const commonName = best.details?.common_names?.[0] ?? best.name;
      const description =
        best.details?.description?.value ?? "Sin descripción disponible.";
      const watering = best.details?.watering?.max
        ? `Cada ${best.details.watering.max} días`
        : "Moderado";
      const sunlight = best.details?.best_light_condition ?? "Luz indirecta";
      const tempMin = best.details?.best_watering ?? null;
      const toxic = best.details?.toxicity ?? null;

      setResult({
        nombreComun: commonName,
        nombreCientifico: best.name,
        descripcion: description.slice(0, 200) + "...",
        cuidados: {
          riego: watering,
          luz: sunlight,
          temperatura: "15°C – 30°C",
        },
        toxicidad: {
          esToxica: toxic ? true : false,
          detalle: toxic ?? "Sin información de toxicidad.",
        },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo analizar la imagen. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !image || !user) return;
    setSaving(true);
    try {
      const imageUrl = await uploadPlantImage(image, user.uid);
      await savePlant({
        userId: user.uid,
        ...result,
        imageUri: imageUrl,
        notes,
        savedAt: new Date().toISOString(),
      });
      setSaved(true);
      Alert.alert("✅ Guardado", "Planta agregada a tu jardín");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Identificar planta</Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => pickImage("camera")}
        >
          <Text style={styles.btnIcon}>📷</Text>
          <Text style={styles.btnText}>Cámara</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btn, styles.btnAlt]}
          onPress={() => pickImage("gallery")}
        >
          <Text style={styles.btnIcon}>🖼️</Text>
          <Text style={styles.btnText}>Galería</Text>
        </TouchableOpacity>
      </View>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2d6a4f" />
          <Text style={styles.loadingText}>Identificando planta...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.card}>
          {result.nombreComun === "No es una planta" ? (
            <Text style={styles.noPlant}>🤔 No se detectó ninguna planta</Text>
          ) : (
            <>
              <Text style={styles.plantName}>{result.nombreComun}</Text>
              <Text style={styles.scientific}>{result.nombreCientifico}</Text>
              <Text style={styles.description}>{result.descripcion}</Text>

              <Text style={styles.section}>🌱 Cuidados</Text>
              {[
                ["💧", "Riego", result.cuidados.riego],
                ["☀️", "Luz", result.cuidados.luz],
                ["🌡️", "Temperatura", result.cuidados.temperatura],
              ].map(([icon, label, val]) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{icon}</Text>
                  <View>
                    <Text style={styles.infoLabel}>{label}</Text>
                    <Text style={styles.infoValue}>{val}</Text>
                  </View>
                </View>
              ))}

              <View
                style={[
                  styles.toxBox,
                  result.toxicidad.esToxica ? styles.toxic : styles.safe,
                ]}
              >
                <Text style={styles.toxTitle}>
                  {result.toxicidad.esToxica ? "⚠️ Tóxica" : "✅ No tóxica"}
                </Text>
                <Text style={styles.toxDetail}>{result.toxicidad.detalle}</Text>
              </View>

              <Text style={styles.section}>📝 Mis notas</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Agrega notas sobre esta planta..."
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <TouchableOpacity
                style={[styles.saveBtn, saved && styles.savedBtn]}
                onPress={handleSave}
                disabled={saved || saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving
                    ? "⏳ Guardando..."
                    : saved
                      ? "✅ Guardado en Mi Jardín"
                      : "💾 Guardar en Mi Jardín"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  content: { padding: 24, paddingTop: 64, alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  buttons: { flexDirection: "row", gap: 12, marginBottom: 24 },
  btn: {
    backgroundColor: "#2d6a4f",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 120,
  },
  btnAlt: { backgroundColor: "#52796f" },
  btnIcon: { fontSize: 24, marginBottom: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  image: { width: "100%", height: 220, borderRadius: 20, marginBottom: 20 },
  loadingBox: { alignItems: "center", gap: 10, marginVertical: 20 },
  loadingText: { color: "#52796f", fontSize: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  noPlant: { fontSize: 18, color: "#666", textAlign: "center", padding: 20 },
  plantName: { fontSize: 26, fontWeight: "800", color: "#1b4332" },
  scientific: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#74c69d",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
    marginBottom: 16,
  },
  section: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d6a4f",
    marginBottom: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  infoIcon: { fontSize: 22, marginTop: 2 },
  infoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  infoValue: { fontSize: 14, color: "#333" },
  toxBox: { borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 8 },
  safe: { backgroundColor: "#d8f3dc" },
  toxic: { backgroundColor: "#ffe5e5" },
  toxTitle: { fontWeight: "700", fontSize: 15, marginBottom: 4 },
  toxDetail: { fontSize: 13, color: "#555" },
  notesInput: {
    backgroundColor: "#f0f7f4",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  savedBtn: { backgroundColor: "#74c69d" },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
