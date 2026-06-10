import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatUser } from "../../lib/chat/types";

interface Props {
  user: ChatUser;
  onPress: () => void;
}

export default function ChatUserItem({ user, onPress }: Props) {
  const initial = user.nickname.charAt(0).toUpperCase();

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nickname}>{user.nickname}</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: user.is_online ? "#2d6a4f" : "#aaa" },
            ]}
          />
          <Text style={styles.status}>
            {user.is_online ? "En linea" : "Desconectado"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  nickname: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1b4332",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  status: {
    fontSize: 12,
    color: "#aaa",
  },
});
