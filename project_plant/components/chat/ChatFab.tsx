import { Pressable, StyleSheet, Text } from "react-native";

interface Props {
  onPress: () => void;
}

export default function ChatFab({ onPress }: Props) {
  return (
    <Pressable style={styles.fab} onPress={onPress}>
      <Text style={styles.icon}>💬</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  icon: {
    fontSize: 26,
  },
});
