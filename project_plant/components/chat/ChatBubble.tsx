import { StyleSheet, Text, View } from "react-native";
import { ChatMessage } from "../../lib/chat/types";
import { formatHour } from "../../lib/chat/utils";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
}

export default function ChatBubble({ message, isOwn }: Props) {
  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        <Text style={styles.sender}>{message.sender_nickname}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.content, isOwn && styles.contentOwn]}>
          {message.content}
        </Text>
        <Text style={[styles.time, isOwn && styles.timeOwn]}>
          {formatHour(message.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 8,
    alignItems: "flex-start",
    maxWidth: "82%",
    alignSelf: "flex-start",
  },
  rowOwn: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  sender: {
    fontSize: 12,
    fontWeight: "600",
    color: "#52796f",
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOther: {
    backgroundColor: "#f0f7f4",
    borderBottomLeftRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleOwn: {
    backgroundColor: "#2d6a4f",
    borderBottomRightRadius: 8,
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  content: {
    fontSize: 15,
    color: "#1b4332",
    lineHeight: 20,
  },
  contentOwn: {
    color: "#fff",
  },
  time: {
    fontSize: 10,
    color: "#aaa",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
});
