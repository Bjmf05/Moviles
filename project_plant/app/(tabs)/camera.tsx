import { CameraView } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { useCamera } from "../../hooks/useCamera";
import { identificarPlanta, PlantInfo } from "../../lib/plantService";
import { usePlants } from "../../lib/plants";

export default function CameraScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { savePlant, uploadImage } = usePlants();
  const initializedRef = useRef(false);
  const {
    cameraRef,
    requestCameraPermission,
    takePhoto,
    facing,
    flashMode,
    toggleFacing,
    toggleFlash,
  } = useCamera({ requestOnMount: false });

  const [image, setImage] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(true);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showPlantModal, setShowPlantModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlantInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
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

  const resetCaptureFlow = () => {
    setImage(null);
    setCapturedPhoto(null);
    setResult(null);
    setNotes("");
    setSaving(false);
    setLoading(false);
    setShowPhotoPreview(false);
    setShowPlantModal(false);
    setShowCamera(true);
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initCamera = async () => {
      const granted = await requestCameraPermission();
      if (!granted) {
        showToast("Se necesita permiso de cámara", "warning");
        setShowCamera(false);
        return;
      }
      setShowCamera(true);
    };
    initCamera();
  }, [requestCameraPermission]);

  const handleCapture = async () => {
    const photo = await takePhoto({ quality: 0.7 });
    if (!photo) return;
    setCapturedPhoto(photo.uri);
    setShowPhotoPreview(true);
    setShowCamera(false);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Se necesita permiso de galería", "warning");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (res.canceled) return;
    setCapturedPhoto(res.assets[0].uri);
    setShowPhotoPreview(true);
    setShowCamera(false);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setShowPhotoPreview(false);
    setShowCamera(true);
  };

  const handleConfirmPhoto = async () => {
    if (!capturedPhoto) return;
    setImage(capturedPhoto);
    setLoading(true);
    setShowPhotoPreview(false);
    await analyzeImage(capturedPhoto);
  };

  const analyzeImage = async (uri: string) => {
    setLoading(true);
    setResult(null);
    try {
      const { base64 } = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { base64: true, format: ImageManipulator.SaveFormat.JPEG },
      );
      const plantInfo = await identificarPlanta(base64!);
      setResult(plantInfo);
      setShowPlantModal(true);
    } catch (e) {
      console.error(e);
      showToast(getAnalyzeErrorMessage(e), "error");
      resetCaptureFlow();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result || !image || !user) return;
    setSaving(true);
    try {
      const imageUrl = await uploadImage(image);
      await savePlant({
        ...result,
        imageUri: imageUrl,
        notes,
      });
      showToast("Planta agregada a tu jardín", "success");
      setShowPlantModal(false);
      resetCaptureFlow();
      router.push("/(tabs)/garden");
    } catch (e) {
      console.error(e);
      showToast(getSaveErrorMessage(e), "error");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!result && result.nombreComun !== "No es una planta";

  return (
    <View style={styles.container}>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      {showCamera ? (
        <View style={styles.cameraModal}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            flash={flashMode}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.65)", "rgba(0,0,0,0)"]}
            style={styles.cameraOverlayTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
            style={styles.cameraOverlayBottom}
            pointerEvents="none"
          />

          <View style={styles.cameraTopBar}>
            <Text style={styles.cameraTitle}>Identificar planta</Text>
            <Pressable onPress={toggleFlash}>
              <Text
                style={[
                  styles.cameraIconText,
                  flashMode !== "off" && styles.cameraIconActive,
                ]}
              >
                ⚡
              </Text>
            </Pressable>
          </View>

          <View style={styles.cameraBottomBar}>
            <Pressable onPress={toggleFacing}>
              <Text style={styles.cameraIconText}>🔄</Text>
            </Pressable>
            <Pressable onPress={handleCapture} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable onPress={handlePickFromGallery}>
              <Text style={styles.cameraIconText}>🖼️</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <Modal
        visible={showPhotoPreview}
        animationType="fade"
        onRequestClose={handleRetakePhoto}
      >
        <View style={styles.previewModal}>
          <Image source={{ uri: capturedPhoto ?? "" }} style={styles.preview} />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnSecondary]}
              onPress={handleRetakePhoto}
            >
              <Text style={styles.previewBtnTextSecondary}>Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnPrimary]}
              onPress={handleConfirmPhoto}
            >
              <Text style={styles.previewBtnTextPrimary}>Usar foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPlantModal}
        animationType="slide"
        onRequestClose={resetCaptureFlow}
      >
        <ScrollView
          style={styles.modalContainer}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.title}>Datos de la planta</Text>

          {image && <Image source={{ uri: image }} style={styles.image} />}

          {result ? (
            <View style={styles.card}>
              {result.nombreComun === "No es una planta" ? (
                <>
                  <Text style={styles.noPlant}>
                    🤔 No se detectó ninguna planta
                  </Text>
                  <TouchableOpacity
                    style={[styles.saveBtn, styles.btnCancelAction]}
                    onPress={resetCaptureFlow}
                  >
                    <Text style={styles.saveBtnText}>Volver a cámara</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.plantName}>{result.nombreComun}</Text>
                  <Text style={styles.scientific}>
                    {result.nombreCientifico}
                  </Text>
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
                    <Text style={styles.toxDetail}>
                      {result.toxicidad.detalle}
                    </Text>
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
                    style={[
                      styles.saveBtn,
                      (!canSave || saving) && styles.saveBtnDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={!canSave || saving}
                  >
                    <Text style={styles.saveBtnText}>
                      {saving ? "⏳ Guardando..." : "💾 Guardar en Mi Jardín"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, styles.btnCancelAction]}
                    onPress={resetCaptureFlow}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>Volver a cámara</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null}
        </ScrollView>
      </Modal>

      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.analysisLoadingBackdrop}>
          <View style={styles.analysisLoadingCard}>
            <ActivityIndicator size="large" color="#2d6a4f" />
            <Text style={styles.analysisLoadingTitle}>Analizando imagen</Text>
            <Text style={styles.analysisLoadingDescription}>
              Estamos identificando tu planta...
            </Text>
          </View>
        </View>
      </Modal>

      {!loading && !showCamera && !showPhotoPreview && !showPlantModal && (
        <TouchableOpacity
          style={styles.fallbackBtn}
          onPress={async () => {
            const granted = await requestCameraPermission();
            if (granted) setShowCamera(true);
          }}
        >
          <Text style={styles.fallbackBtnText}>Abrir cámara</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  modalContainer: { flex: 1, backgroundColor: "#f0f7f4" },
  content: { padding: 24, paddingTop: 64, alignItems: "center" },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    marginBottom: 24,
    alignSelf: "flex-start",
  },
  cameraModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraTopBar: {
    position: "absolute",
    top: 56,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  cameraBottomBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraIconText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  cameraIconActive: {
    color: "#ffd166",
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  cameraOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  cameraOverlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  previewModal: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
  },
  preview: {
    width: "100%",
    height: "70%",
    resizeMode: "contain",
  },
  previewActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  previewBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  previewBtnPrimary: {
    backgroundColor: "#2d6a4f",
  },
  previewBtnSecondary: {
    backgroundColor: "#f0f7f4",
  },
  previewBtnTextPrimary: {
    color: "#fff",
    fontWeight: "700",
  },
  previewBtnTextSecondary: {
    color: "#1b4332",
    fontWeight: "700",
  },
  image: { width: "100%", height: 220, borderRadius: 20, marginBottom: 20 },
  loadingText: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
  saveBtnDisabled: { opacity: 0.7 },
  btnCancelAction: { backgroundColor: "#adb5bd", marginTop: 10 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  fallbackBtn: {
    position: "absolute",
    alignSelf: "center",
    bottom: 120,
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  fallbackBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  analysisLoadingBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  analysisLoadingCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  analysisLoadingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b4332",
  },
  analysisLoadingDescription: {
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    lineHeight: 20,
  },
});
