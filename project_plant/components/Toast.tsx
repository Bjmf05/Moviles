import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

type ToastType = "success" | "error" | "warning";

type ToastProps = {
  visible: boolean;
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
};

function Toast({
  visible,
  message,
  type = "success",
  onClose,
  duration = 3000,
}: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        hide();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  if (!visible) return null;

  const colors: Record<
    ToastType,
    { bg: string; border: string; icon: string }
  > = {
    success: { bg: "#d8f3dc", border: "#2d6a4f", icon: "✅" },
    error: { bg: "#ffe5e5", border: "#e63946", icon: "❌" },
    warning: { bg: "#fff3cd", border: "#f4a261", icon: "⚠️" },
  };

  const c = colors[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity, backgroundColor: c.bg, borderLeftColor: c.border },
      ]}
    >
      <Text style={styles.icon}>{c.icon}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity onPress={hide} style={styles.closeBtn}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export { Toast };
export default Toast;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  icon: { fontSize: 18, marginRight: 10 },
  message: { flex: 1, fontSize: 14, color: "#1b4332", fontWeight: "600" },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 14, color: "#52796f", fontWeight: "700" },
});
