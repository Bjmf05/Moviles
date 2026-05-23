import { LinearGradient } from "expo-linear-gradient";
import { Control } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { InputText } from "./InputText";
import { SavedPlant } from "../lib/plants";
import { formatFullDate } from "../lib/dateUtils";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { useTimeline } from "../lib/timeline";
import { cacheAllTimelineImages, resolveLocalTimelineImageMap } from "../lib/localCache";
import GrowthTimeline from "./GrowthTimeline";
import AddTimelinePhoto from "./AddTimelinePhoto";

type PlantEditFields = {
  nombreComun: string;
  nombreCientifico: string;
  descripcion: string;
  notes?: string;
  "cuidados.riego": string;
  "cuidados.luz": string;
  "cuidados.temperatura": string;
};

interface PlantEditModalProps {
  visible: boolean;
  plant: SavedPlant | null;
  isEditing: boolean;
  isSubmitting: boolean;
  localImageUri?: string;
  control: Control<PlantEditFields>;
  onSave: () => void;
  onClose: () => void;
  onToggleEditing: () => void;
  onTogglePublic: () => void;
}

export default function PlantEditModal({
  visible,
  plant,
  isEditing,
  isSubmitting,
  localImageUri,
  control,
  onSave,
  onClose,
  onToggleEditing,
  onTogglePublic,
}: PlantEditModalProps) {
  const { token } = useAuth();
  const { entries, loading, addEntry } = useTimeline(plant?.id ?? "");
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timelineImages, setTimelineImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (entries.length === 0) {
      setTimelineImages({});
      return;
    }
    cacheAllTimelineImages(entries);
    resolveLocalTimelineImageMap(entries).then(setTimelineImages);
  }, [entries]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      mediaTypes: ["images"],
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      mediaTypes: ["images"],
    });
    if (!result.canceled && result.assets[0]) {
      setPreviewUri(result.assets[0].uri);
    }
  };

  const handleRetakePhoto = () => {
    setPreviewUri(null);
  };

  const handleSavePhoto = async (caption: string) => {
    if (!token || !previewUri || !plant) return;
    setUploading(true);
    try {
      const imageUrl = await api.images.upload(token, previewUri);
      await addEntry({
        imageUrl,
        caption: caption || "",
        capturedAt: new Date().toISOString().split("T")[0],
      });
      setShowAddPhoto(false);
      setPreviewUri(null);
    } catch {
      // error silently handled
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
          style={styles.gradient}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {plant && (
            <>
              <Image
                source={{
                  uri: localImageUri || plant.imageUri,
                }}
                style={styles.modalImage}
              />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {isEditing ? "Editar planta" : "Detalle de planta"}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {isEditing
                    ? "Actualiza la informacion de tu planta"
                    : "Informacion completa guardada en tu jardin"}
                </Text>
              </View>

              {isEditing ? (
                <View style={styles.formContainer}>
                  <InputText
                    control={control}
                    name="nombreComun"
                    label="Nombre comun"
                    icon="🌿"
                    placeholder="Ej. Rosa"
                    autoCapitalize="sentences"
                    returnKeyType="next"
                  />
                  <InputText
                    control={control}
                    name="nombreCientifico"
                    label="Nombre cientifico"
                    icon="🔬"
                    placeholder="Ej. Rosa canina"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                  <InputText
                    control={control}
                    name="descripcion"
                    label="Descripcion"
                    icon="📄"
                    placeholder="Descripcion de la planta..."
                    inputProps={{ multiline: true, numberOfLines: 3 }}
                  />
                  <InputText
                    control={control}
                    name="cuidados.riego"
                    label="Riego"
                    icon="💧"
                    placeholder="Ej. Cada 3 dias"
                  />
                  <InputText
                    control={control}
                    name="cuidados.luz"
                    label="Luz"
                    icon="☀️"
                    placeholder="Ej. Luz indirecta"
                  />
                  <InputText
                    control={control}
                    name="cuidados.temperatura"
                    label="Temperatura"
                    icon="🌡️"
                    placeholder="Ej. 15°C – 30°C"
                  />
                  <InputText
                    control={control}
                    name="notes"
                    label="Mis notas"
                    icon="📝"
                    placeholder="Notas personales..."
                    inputProps={{ multiline: true, numberOfLines: 2 }}
                    autoCapitalize="sentences"
                    blurOnSubmit
                  />

                  <Pressable
                    style={styles.shareToggle}
                    onPress={onTogglePublic}
                  >
                    <Text style={styles.shareToggleIcon}>
                      {plant.isPublic ? "🌍" : "🔒"}
                    </Text>
                    <View style={styles.shareToggleInfo}>
                      <Text style={styles.shareToggleLabel}>
                        Compartir en Explorar
                      </Text>
                      <Text style={styles.shareToggleDesc}>
                        {plant.isPublic
                          ? "Tu planta sera visible para otros usuarios"
                          : "Solo tu podras ver esta planta"}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={onSave}
                    disabled={isSubmitting}
                  >
                    <LinearGradient
                      colors={["#2d6a4f", "#40916c"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      <Text style={styles.saveBtnText}>
                        {isSubmitting ? "Guardando..." : "Guardar cambios"}
                      </Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={styles.cancelBtn} onPress={onToggleEditing}>
                    <Text style={styles.cancelBtnText}>Volver al detalle</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.detailContainer}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nombre comun</Text>
                    <Text style={styles.detailValue}>{plant.nombreComun}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Nombre cientifico</Text>
                    <Text style={styles.detailValue}>
                      {plant.nombreCientifico}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Descripcion</Text>
                    <Text style={styles.detailValue}>{plant.descripcion}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Riego</Text>
                    <Text style={styles.detailValue}>
                      {plant.cuidados.riego}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Luz</Text>
                    <Text style={styles.detailValue}>{plant.cuidados.luz}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Temperatura</Text>
                    <Text style={styles.detailValue}>
                      {plant.cuidados.temperatura}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Toxicidad</Text>
                    <Text style={styles.detailValue}>
                      {plant.toxicidad.esToxica ? "Toxica" : "No toxica"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Detalle toxicidad</Text>
                    <Text style={styles.detailValue}>
                      {plant.toxicidad.detalle}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Notas</Text>
                    <Text style={styles.detailValue}>
                      {plant.notes || "Sin notas"}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha de guardado</Text>
                    <Text style={styles.detailValue}>
                      {formatFullDate(plant.savedAt)}
                    </Text>
                  </View>

                  <GrowthTimeline
                    entries={entries}
                    loading={loading}
                    localImages={timelineImages}
                    onAddPhoto={() => setShowAddPhoto(true)}
                  />

                  <Pressable style={styles.editBtn} onPress={onToggleEditing}>
                    <LinearGradient
                      colors={["#2d6a4f", "#40916c"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      <Text style={styles.saveBtnText}>Editar</Text>
                    </LinearGradient>
                  </Pressable>

                  <Pressable style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Cerrar</Text>
                  </Pressable>
                </View>
              )}
            </>
          )}
        </ScrollView>
        </KeyboardAvoidingView>

        <AddTimelinePhoto
          visible={showAddPhoto}
          uploading={uploading}
          previewUri={previewUri}
          onTakePhoto={handleTakePhoto}
          onPickPhoto={handlePickPhoto}
          onRetake={handleRetakePhoto}
          onSave={handleSavePhoto}
          onClose={() => {
            setShowAddPhoto(false);
            setPreviewUri(null);
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1b4332",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#52796f",
    marginTop: 4,
  },
  formContainer: {
    gap: 4,
  },
  detailContainer: {
    gap: 12,
  },
  detailRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#1b4332",
    lineHeight: 21,
  },
  shareToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    gap: 12,
  },
  shareToggleIcon: {
    fontSize: 24,
  },
  shareToggleInfo: {
    flex: 1,
  },
  shareToggleLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b4332",
  },
  shareToggleDesc: {
    fontSize: 12,
    color: "#74c69d",
    marginTop: 2,
  },
  saveBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    padding: 18,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  editBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d8f3dc",
    marginTop: 10,
  },
  cancelBtnText: {
    color: "#52796f",
    fontWeight: "600",
    fontSize: 15,
  },
});
