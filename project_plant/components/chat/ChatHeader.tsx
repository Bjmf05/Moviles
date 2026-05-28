import { Pressable, StyleSheet, Text, View } from "react-native";

interface Props {
  title: string;
  subtitle: string;
  showBack?: boolean;
  showLeave?: boolean;
  onBack?: () => void;
  onLeave?: () => void;
}

export default function ChatHeader({
  title,
  subtitle,
  showBack,
  showLeave,
  onBack,
  onLeave,
}: Props) {
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
      {showLeave && onLeave && (
        <Pressable style={styles.leaveBtn} onPress={onLeave}>
          <Text style={styles.leaveText}>Salir</Text>
        </Pressable>
      )}
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
});
