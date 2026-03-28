import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { identificarPlanta, PlantInfo } from "../../lib/plantService";
import { savePlant, uploadPlantImage } from "../../lib/plants";

export default function CameraScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [nombrePersonal, setNombrePersonal] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getNetworkMessage = () =>
    "Sin conexión. Revisa tu internet e intenta de nuevo.";

  const getAnalyzeErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("network")) return getNetworkMessage();
    if (message.toLowerCase().includes("plant.id")) {
      return "No se pudo identificar la planta. Intenta con otra foto.";
    }
    return "No se pudo analizar la imagen. Intenta de nuevo.";
  };

  const getSaveErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("network")) return getNetworkMessage();
    if (message.toLowerCase().includes("storage")) {
      return "No se pudo subir la foto. Intenta de nuevo.";
    }
    return "No se pudo guardar la planta. Intenta de nuevo.";
  };

  const handleCancel = () => {
    setImage(null);
    setResult(null);
    setNotes("");
    setSaved(false);
    setSaving(false);
    setLoading(false);
  };

  const pickImage = async (source: "camera" | "gallery") => {
    let res;
    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted")
        return showToast("Se necesita permiso de cámara", "warning");
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
      const { base64 } = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      const plantInfo = await identificarPlanta(base64!);
      setResult(plantInfo);
    } catch (e) {
      console.error(e);
      showToast(getAnalyzeErrorMessage(e), "error");
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
      showToast("Planta agregada a tu jardín", "success");
    } catch (e) {
      console.error(e);
      showToast(getSaveErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
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
              {(
                [
                  ["💧", "Riego", result.cuidados.riego],
                  ["☀️", "Luz", result.cuidados.luz],
                  ["🌡️", "Temperatura", result.cuidados.temperatura],
                ] as const
              ).map(([icon, label, val]) => (
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

              {!saving && (image || loading || result) && (
                <TouchableOpacity
                  style={[styles.saveBtn, styles.btnCancelAction]}
                  onPress={handleCancel}
                >
                  <Text style={styles.saveBtnText}>✖️ Cancelar</Text>
                </TouchableOpacity>
              )}
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
  btnCancel: { backgroundColor: "#adb5bd" },
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
  btnCancelAction: { backgroundColor: "#adb5bd", marginTop: 10 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
