import { useEffect, useMemo, useRef } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useChat } from "../../context/ChatContext";
import { useChatKeyboard } from "../../hooks/useChatKeyboard";
import ChatBubble from "./ChatBubble";
import ChatComposer from "./ChatComposer";
import ChatHeader from "./ChatHeader";

interface Props {
  userId: string;
  nickname: string;
}

export default function ChatDMView({ userId, nickname }: Props) {
  const {
    currentUser,
    directMessages,
    messageReadStatus,
    connectionState,
    reconnectProgress,
    sendDirectMessage,
    loadDirectMessages,
    uploadAndSendMedia,
    navigateTo,
  } = useChat();

  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useChatKeyboard();

  const messages = useMemo(() => directMessages[userId] || [], [directMessages, userId]);

  useEffect(() => {
    loadDirectMessages(userId);
  }, [userId]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [messages.length]);

  const handleSend = (content: string) => {
    sendDirectMessage(userId, content);
  };

  const handleSendMedia = (fileUri: string, fileName: string, mimeType: string) =>
    uploadAndSendMedia(fileUri, fileName, mimeType, "dm", userId);

  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
      <ChatHeader
        title={nickname}
        subtitle="Chat privado"
        showBack
        onBack={() => navigateTo("inbox")}
        connectionState={connectionState}
        reconnectProgress={reconnectProgress}
      />

      {messages.length === 0 ? (
        <Pressable style={styles.empty} onPress={() => Keyboard.dismiss()}>
          <Text style={styles.emptyIcon}>✉️</Text>
          <Text style={styles.emptyTitle}>No hay mensajes</Text>
          <Text style={styles.emptySub}>
            Envia un mensaje para iniciar la conversacion con {nickname}.
          </Text>
        </Pressable>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.dayLabel}>Conversacion</Text>
          {messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender_id === currentUser?.id}
              readStatus={msg.sender_id === currentUser?.id ? messageReadStatus[msg.id] : undefined}
            />
          ))}
        </ScrollView>
      )}

      <ChatComposer
        placeholder={`Escribe a ${nickname}...`}
        onSend={handleSend}
        onSendMedia={handleSendMedia}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#aaa",
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 16,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    lineHeight: 20,
  },
});
