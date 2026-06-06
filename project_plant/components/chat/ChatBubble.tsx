import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { ChatMessage, MessageSeenInfo } from "../../lib/chat/types";
import { formatHour } from "../../lib/chat/utils";

interface Props {
  message: ChatMessage;
  isOwn: boolean;
  readStatus?: MessageSeenInfo[];
}

export default function ChatBubble({ message, isOwn, readStatus }: Props) {
  const [ttlRemaining, setTtlRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!message.ttl || !message.expires_at) return;

    const update = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(message.expires_at!).getTime() - Date.now()) / 1000),
      );
      setTtlRemaining(remaining);
      if (remaining > 0) return true;
      return false;
    };

    if (!update()) return;
    const interval = setInterval(() => {
      if (!update()) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [message.ttl, message.expires_at]);

  const hasContent = message.content.length > 0;

  const renderReadStatus = () => {
    if (!isOwn || !message.allow_read_receipt) return null;
    if (!readStatus || readStatus.length === 0) {
      return <Text style={[styles.readStatus, styles.readStatusPending]}>✓</Text>;
    }
    return (
      <Text style={[styles.readStatus, styles.readStatusSeen]}>
        ✓✓ {readStatus.length > 1 ? `(${readStatus.length})` : ""}
      </Text>
    );
  };

  const renderTtl = () => {
    if (ttlRemaining === null) return null;
    const mins = Math.floor(ttlRemaining / 60);
    const secs = ttlRemaining % 60;
    const label = mins > 0 ? `${mins}m` : `${secs}s`;
    return (
      <View style={styles.ttlBadge}>
        <Text style={styles.ttlText}>⏳ {label}</Text>
      </View>
    );
  };

  const renderMedia = () => {
    if (!message.media) return null;
    const { url, resource_type } = message.media;
    if (resource_type === "image") {
      return (
        <Image
          source={{ uri: url }}
          style={[styles.mediaImage, hasContent && styles.mediaImageWithMargin]}
          resizeMode="cover"
        />
      );
    }
    return (
      <View style={styles.mediaFile}>
        <Text style={styles.mediaFileIcon}>📎</Text>
        <Text style={styles.mediaFileName} numberOfLines={1}>
          {message.media.original_filename}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        <Text style={styles.sender}>{message.sender_nickname}</Text>
      )}
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {renderMedia()}
        {hasContent && (
          <Text style={[styles.content, isOwn && styles.contentOwn]}>
            {message.content}
          </Text>
        )}
        <View style={styles.footer}>
          {renderTtl()}
          {renderReadStatus()}
          <Text style={[styles.time, isOwn && styles.timeOwn]}>
            {formatHour(message.timestamp)}
          </Text>
        </View>
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
    overflow: "hidden",
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
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 4,
  },
  time: {
    fontSize: 10,
    color: "#aaa",
  },
  timeOwn: {
    color: "rgba(255,255,255,0.7)",
  },
  readStatus: {
    fontSize: 10,
    fontWeight: "600",
  },
  readStatusPending: {
    color: "rgba(255,255,255,0.4)",
  },
  readStatusSeen: {
    color: "#74c69d",
  },
  ttlBadge: {
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ttlText: {
    fontSize: 9,
    color: "#fff",
    fontWeight: "600",
  },
  mediaImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  mediaImageWithMargin: {
    marginBottom: 8,
  },
  mediaFile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.08)",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  mediaFileIcon: {
    fontSize: 20,
  },
  mediaFileName: {
    fontSize: 12,
    color: "#52796f",
    flex: 1,
  },
});
