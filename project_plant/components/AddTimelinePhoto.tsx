import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

type Screen = "choose" | "preview" | "caption";

interface AddTimelinePhotoProps {
  visible: boolean;
  uploading: boolean;
  previewUri: string | null;
  onTakePhoto: () => void;
  onPickPhoto: () => void;
  onRetake: () => void;
  onSave: (caption: string) => void;
  onClose: () => void;
}

export default function AddTimelinePhoto({
  visible,
  uploading,
  previewUri,
  onTakePhoto,
  onPickPhoto,
  onRetake,
  onSave,
  onClose,
}: AddTimelinePhotoProps) {
  const [screen, setScreen] = useState<Screen>("choose");
  const [caption, setCaption] = useState("");
  const prevVisible = useRef(visible);

  // Cuando el modal se abre, reinicia a "choose"
  // Cuando previewUri cambia de null a un valor, avanza a "preview"
  useEffect(() => {
    if (visible && !prevVisible.current) {
      setScreen("choose");
      setCaption("");
    }
    prevVisible.current = visible;
  }, [visible]);

  useEffect(() => {
    if (previewUri && screen === "choose") {
      setScreen("preview");
    }
  }, [previewUri, screen]);

  const handleSave = () => {
    onSave(caption);
    setCaption("");
  };

  const handleClose = () => {
    setCaption("");
    setScreen("choose");
    onClose();
  };

  if (!visible) return null;

  return (
    <>
      {/* Pantalla de preview fullscreen (como camera.tsx) */}
      {screen === "preview" && (
        <View style={styles.previewModal}>
          <Image
            source={{ uri: previewUri ?? "" }}
            style={styles.previewImage}
          />
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnSecondary]}
              onPress={() => {
                onRetake();
                setScreen("choose");
              }}
            >
              <Text style={styles.previewBtnTextSecondary}>Repetir</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnPrimary]}
              onPress={() => setScreen("caption")}
            >
              <Text style={styles.previewBtnTextPrimary}>Usar foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Bottom sheet para elegir fuente o agregar caption */}
      {(screen === "choose" || screen === "caption") && (
        <Modal
          transparent
          animationType="slide"
          visible
          onRequestClose={handleClose}
        >
          <View style={styles.backdrop}>
            <BlurView intensity={90} tint="light" style={styles.card}>
              <Text style={styles.title}>
                {screen === "caption"
                  ? "Agregar nota"
                  : "Agregar foto de progreso"}
              </Text>

              {screen === "caption" ? (
                <>
                  <View style={styles.photoRow}>
                    <Image
                      source={{ uri: previewUri ?? "" }}
                      style={styles.thumbnail}
                    />
                    <View style={styles.photoRowInfo}>
                      <Text style={styles.photoRowLabel}>Foto lista</Text>
                      <Text style={styles.photoRowHint}>
                        Toca Guardar para añadirla al timeline
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.captionLabel}>✏️ Nota (opcional)</Text>
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Ej. Nueva hoja 🌱"
                    placeholderTextColor="#aaa"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    autoCapitalize="sentences"
                    maxLength={300}
                  />

                  <Pressable
                    style={[
                      styles.saveBtn,
                      uploading && { opacity: 0.7 },
                    ]}
                    onPress={handleSave}
                    disabled={uploading}
                  >
                    <LinearGradient
                      colors={["#2d6a4f", "#40916c"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.saveBtnGradient}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.saveBtnText}>Guardar foto</Text>
                      )}
                    </LinearGradient>
                  </Pressable>
                </>
              ) : (
                <View style={styles.chooseContainer}>
                  <Pressable style={styles.chooseBtn} onPress={onTakePhoto}>
                    <Text style={styles.chooseBtnIcon}>📷</Text>
                    <Text style={styles.chooseBtnText}>Tomar foto</Text>
                  </Pressable>
                  <Text style={styles.chooseOr}>o</Text>
                  <Pressable style={styles.chooseBtn} onPress={onPickPhoto}>
                    <Text style={styles.chooseBtnIcon}>🖼️</Text>
                    <Text style={styles.chooseBtnText}>Elegir de galería</Text>
                  </Pressable>
                </View>
              )}

              <Pressable style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
            </BlurView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  previewModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    zIndex: 100,
  },
  previewImage: {
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },
  card: {
    borderRadius: 22,
    padding: 24,
    overflow: "hidden",
    backgroundColor: "rgba(247, 255, 244, 0.92)",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 20,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7f4",
    borderRadius: 14,
    padding: 10,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  photoRowInfo: {
    flex: 1,
  },
  photoRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1b4332",
  },
  photoRowHint: {
    fontSize: 12,
    color: "#74c69d",
    marginTop: 2,
  },
  captionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  captionInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    color: "#1b4332",
    minHeight: 70,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  chooseContainer: {
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  chooseBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "#f0f7f4",
    borderWidth: 2,
    borderColor: "#d8f3dc",
    alignItems: "center",
  },
  chooseBtnIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  chooseBtnText: {
    color: "#1b4332",
    fontWeight: "700",
    fontSize: 15,
  },
  chooseOr: {
    color: "#52796f",
    fontSize: 13,
    fontWeight: "600",
  },
  cancelBtn: {
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelBtnText: {
    color: "#52796f",
    fontWeight: "600",
    fontSize: 15,
  },
});
