import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmDanger?: boolean;
  gradientHeader?: boolean;
  blurCard?: boolean;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmDanger,
  gradientHeader,
  blurCard,
}: ConfirmDialogProps) {
  const content = (
    <>
      {gradientHeader ? (
        <LinearGradient
          colors={["#e8f5e9", "#d8f3dc"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.confirmHeader}
        >
          <Text style={[styles.confirmTitle, { paddingTop: 0 }]}>{title}</Text>
        </LinearGradient>
      ) : (
        <Text style={[styles.confirmTitle, { paddingTop: 18 }]}>{title}</Text>
      )}
      <Text style={styles.confirmMessage}>{message}</Text>
      <View style={styles.confirmActions}>
        <Pressable
          style={[styles.confirmBtn, styles.confirmBtnNeutral]}
          onPress={onCancel}
        >
          <Text style={styles.confirmBtnTextNeutral}>{cancelLabel}</Text>
        </Pressable>
        <Pressable
          style={[
            styles.confirmBtn,
            confirmDanger ? styles.confirmBtnDanger : styles.confirmBtnNeutral,
          ]}
          onPress={onConfirm}
        >
          <Text
            style={
              confirmDanger
                ? styles.confirmBtnTextDanger
                : styles.confirmBtnTextNeutral
            }
          >
            {confirmLabel}
          </Text>
        </Pressable>
      </View>
    </>
  );

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.confirmBackdrop}>
        {blurCard ? (
          <BlurView intensity={90} tint="light" style={styles.confirmCard}>
            {content}
          </BlurView>
        ) : (
          <View style={styles.confirmCard}>{content}</View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    borderRadius: 22,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  confirmHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b4332",
    textAlign: "center",
  },
  confirmMessage: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnNeutral: {
    backgroundColor: "#f0f7f4",
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
  },
  confirmBtnDanger: {
    backgroundColor: "#ffe5e5",
    borderWidth: 1.5,
    borderColor: "#e63946",
  },
  confirmBtnTextNeutral: {
    color: "#2d6a4f",
    fontWeight: "700",
  },
  confirmBtnTextDanger: {
    color: "#e63946",
    fontWeight: "700",
  },
});
