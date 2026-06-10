import { FlatList, StyleSheet, Text, View } from "react-native";
import { useChat } from "../../context/ChatContext";
import ConversationItem from "./ConversationItem";
import ChatHeader from "./ChatHeader";

export default function ChatInbox() {
  const {
    currentUser,
    onlineUsers,
    directMessages,
    groupMessages,
    connectionState,
    reconnectProgress,
    navigateTo,
    leaveChat,
  } = useChat();

  const lastGroupMsg =
    groupMessages.length > 0
      ? groupMessages[groupMessages.length - 1]
      : undefined;

  const dmUsers = onlineUsers.filter((u) => u.id !== currentUser?.id);

  const getLastDM = (userId: string) => {
    const msgs = directMessages[userId];
    return msgs && msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
  };

  const getDMSubtitle = (userId: string) => {
    const last = getLastDM(userId);
    return last ? last.content : "Sin mensajes";
  };

  const data = [
    { type: "group" as const },
    ...dmUsers.map((u) => ({ type: "user" as const, user: u })),
  ];

  return (
    <View style={styles.container}>
      <ChatHeader
        title="Chat"
        subtitle={`${onlineUsers.length} usuarios conectados`}
        showLeave
        onLeave={leaveChat}
        connectionState={connectionState}
        reconnectProgress={reconnectProgress}
      />

      <FlatList
        data={data}
        keyExtractor={(item) =>
          item.type === "group" ? "group" : item.user.id
        }
        contentContainerStyle={styles.list}
        ListFooterComponent={
          dmUsers.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyTitle}>No hay usuarios conectados</Text>
              <Text style={styles.emptySub}>
                Espera a que alguien mas se una al chat.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === "group") {
            return (
              <ConversationItem
                title="Grupo de Moviles"
                subtitle={
                  lastGroupMsg
                    ? lastGroupMsg.content
                    : "Sin mensajes aun"
                }
                lastMessage={lastGroupMsg}
                isGroup
                onlineCount={onlineUsers.length}
                onPress={() => navigateTo("group")}
              />
            );
          }
          return (
            <ConversationItem
              title={item.user.nickname}
              subtitle={getDMSubtitle(item.user.id)}
              lastMessage={getLastDM(item.user.id)}
              onPress={() =>
                navigateTo({
                  dm: {
                    userId: item.user.id,
                    nickname: item.user.nickname,
                  },
                })
              }
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  list: {
    paddingBottom: 20,
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
