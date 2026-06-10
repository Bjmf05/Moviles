import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import AnimatedButton from "../AnimatedButton";

interface Props {
  onJoined: () => void;
}

export default function ChatJoinView({ onJoined }: Props) {
  const { joinChat } = useChat();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const email = user?.email ?? "";
  const nickname = email.split("@")[0] || email;

  const handleJoin = async () => {
    if (!nickname.trim()) {
      setError("No se pudo obtener un apodo de tu cuenta.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await joinChat(nickname.trim());
      onJoined();
    } catch (e: any) {
      setError(e?.message ?? "No se pudo conectar al chat.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.icon}>💬</Text>
        <Text style={styles.title}>Unete al chat</Text>
        <Text style={styles.subtitle}>
          Ingresaras al chat con tu apodo automatico.
        </Text>

        <Text style={styles.label}>📝 Apodo</Text>
        <View style={styles.nicknameBox}>
          <Text style={styles.nickname}>{nickname}</Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <AnimatedButton onPress={handleJoin} loading={loading}>
          Entrar al chat
        </AnimatedButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  icon: {
    fontSize: 40,
    textAlign: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  nicknameBox: {
    backgroundColor: "#f0f7f4",
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  nickname: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  error: {
    fontSize: 12,
    color: "#e63946",
    marginBottom: 12,
    marginTop: -8,
    marginLeft: 4,
  },
});
