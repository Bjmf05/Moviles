import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChatMessage } from "../../lib/chat/types";
import { formatHour } from "../../lib/chat/utils";

interface Props {
  title: string;
  subtitle: string;
  lastMessage?: ChatMessage;
  isGroup?: boolean;
  onlineCount?: number;
  onPress: () => void;
}

export default function ConversationItem({
  title,
  subtitle,
  lastMessage,
  isGroup,
  onlineCount,
  onPress,
}: Props) {
  const initial = title.charAt(0).toUpperCase();

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {isGroup ? "👥" : initial}
        </Text>
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{title}</Text>
          {lastMessage && (
            <Text style={styles.time}>
              {formatHour(lastMessage.timestamp)}
            </Text>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {isGroup && onlineCount !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{onlineCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#d8f3dc",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
  },
  time: {
    fontSize: 11,
    color: "#aaa",
  },
  preview: {
    fontSize: 13,
    color: "#52796f",
    marginTop: 2,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#d8f3dc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2d6a4f",
  },
});
