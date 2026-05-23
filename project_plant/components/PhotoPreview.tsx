import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PhotoPreviewProps {
  visible: boolean;
  uri: string;
  mode?: "confirm" | "view";
  onConfirm?: () => void;
  onRetake?: () => void;
  onClose: () => void;
}

export default function PhotoPreview({
  visible,
  uri,
  mode = "confirm",
  onConfirm,
  onRetake,
  onClose,
}: PhotoPreviewProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.previewModal}>
        <Image source={{ uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          {mode === "confirm" ? (
            <>
              <TouchableOpacity
                style={[styles.previewBtn, styles.previewBtnSecondary]}
                onPress={onRetake}
              >
                <Text style={styles.previewBtnTextSecondary}>Repetir</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.previewBtn, styles.previewBtnPrimary]}
                onPress={onConfirm}
              >
                <Text style={styles.previewBtnTextPrimary}>Usar foto</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.previewBtn, styles.previewBtnSecondary, { flex: 0, paddingHorizontal: 40 }]}
              onPress={onClose}
            >
              <Text style={styles.previewBtnTextSecondary}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: "center",
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
});
