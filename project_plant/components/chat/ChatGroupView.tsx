import { useEffect, useRef } from "react";
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

export default function ChatGroupView() {
  const {
    currentUser,
    onlineUsers,
    groupMessages,
    messageReadStatus,
    connectionState,
    reconnectProgress,
    sendGroupMessage,
    uploadAndSendMedia,
    navigateTo,
  } = useChat();

  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useChatKeyboard();

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, [groupMessages.length]);

  return (
    <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
      <ChatHeader
        title="Grupo de Moviles"
        subtitle={`${onlineUsers.length} usuarios conectados`}
        showBack
        onBack={() => navigateTo("inbox")}
        connectionState={connectionState}
        reconnectProgress={reconnectProgress}
      />

      {groupMessages.length === 0 ? (
        <Pressable style={styles.empty} onPress={() => Keyboard.dismiss()}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No hay mensajes aun</Text>
          <Text style={styles.emptySub}>
            Se el primero en enviar un mensaje al grupo.
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
          <Text style={styles.dayLabel}>Hoy</Text>
          {groupMessages.map((msg) => (
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
        placeholder="Escribe un mensaje al grupo..."
        onSend={sendGroupMessage}
        onSendMedia={(fileUri, fileName, mimeType) =>
          uploadAndSendMedia(fileUri, fileName, mimeType, "group")
        }
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
