import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatConnectionState } from "../../lib/chat/types";

interface Props {
  title: string;
  subtitle: string;
  showBack?: boolean;
  showLeave?: boolean;
  onBack?: () => void;
  onLeave?: () => void;
  connectionState?: ChatConnectionState;
  reconnectProgress?: string | null;
}

const STATUS_LABELS: Record<ChatConnectionState, string | null> = {
  idle: null,
  connecting: "Conectando...",
  connected: null,
  disconnected: "Sin conexion",
};

export default function ChatHeader({
  title,
  subtitle,
  showBack,
  showLeave,
  onBack,
  onLeave,
  connectionState,
  reconnectProgress,
}: Props) {
  const statusLabel = reconnectProgress ?? (connectionState ? STATUS_LABELS[connectionState] : null);
  const isError = !reconnectProgress && connectionState === "disconnected";

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {showBack && onBack && (
          <Pressable style={styles.iconBtn} onPress={onBack}>
            <Text style={styles.icon}>←</Text>
          </Pressable>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.right}>
        {statusLabel && (
          <View style={[styles.statusBadge, isError && styles.statusBadgeError]}>
            <View style={[styles.statusDot, isError ? styles.statusDotError : styles.statusDotConnecting]} />
            <Text style={[styles.statusText, isError && styles.statusTextError]}>
              {statusLabel}
            </Text>
          </View>
        )}
        {showLeave && onLeave && (
          <Pressable style={styles.leaveBtn} onPress={onLeave}>
            <Text style={styles.leaveText}>Salir</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#d8f3dc",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f7f4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 18,
    color: "#2d6a4f",
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
  },
  subtitle: {
    fontSize: 13,
    color: "#52796f",
    marginTop: 1,
  },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  leaveText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#52796f",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f7f4",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusBadgeError: {
    backgroundColor: "#ffe5e5",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotConnecting: {
    backgroundColor: "#f4a261",
  },
  statusDotError: {
    backgroundColor: "#e63946",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52796f",
  },
  statusTextError: {
    color: "#e63946",
  },
});
