import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

interface ForgotPasswordModalProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export default function ForgotPasswordModal({
  visible,
  email,
  onClose,
  onSuccess,
  onError,
}: ForgotPasswordModalProps) {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email) {
      onError("Ingresa tu correo electronico primero.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      onClose();
      onSuccess("Correo de restablecimiento enviado.");
    } catch (error: any) {
      const code = error?.code;
      if (code === "auth/user-not-found") {
        onError("No existe una cuenta con ese correo.");
      } else if (code === "auth/invalid-email") {
        onError("El correo no tiene un formato valido.");
      } else if (code === "auth/too-many-requests") {
        onError("Demasiados intentos. Intenta de nuevo mas tarde.");
      } else {
        onError("No se pudo enviar el correo. Intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <BlurView intensity={90} tint="light" style={styles.card}>
          <Text style={styles.title}>Restablecer contraseña</Text>
          <Text style={styles.description}>
            Recibirás un enlace para restablecer tu contraseña en:
          </Text>
          <View style={styles.emailBox}>
            <Text style={styles.emailIcon}>📧</Text>
            <Text style={styles.emailText}>
              {email || "correo@ejemplo.com"}
            </Text>
          </View>
          <Pressable
            style={[styles.sendBtn, loading && { opacity: 0.7 }]}
            onPress={handleSend}
            disabled={loading}
          >
            <LinearGradient
              colors={["#2d6a4f", "#40916c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Enviar enlace</Text>
              )}
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </Pressable>
        </BlurView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 22,
    padding: 24,
    overflow: "hidden",
    backgroundColor: "rgba(247, 255, 244, 0.92)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  emailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7f4",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
  },
  emailIcon: {
    fontSize: 20,
  },
  emailText: {
    fontSize: 15,
    color: "#1b4332",
    fontWeight: "600",
    flex: 1,
  },
  sendBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnGradient: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 16,
    padding: 14,
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
