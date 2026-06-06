import { Modal, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useChat } from "../../context/ChatContext";
import ChatJoinView from "./ChatJoinView";
import ChatInbox from "./ChatInbox";
import ChatGroupView from "./ChatGroupView";
import ChatDMView from "./ChatDMView";

function ChatContent() {
  const { currentUser, isLoadingSession, activeView } = useChat();

  if (isLoadingSession) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return <ChatJoinView onJoined={() => {}} />;
  }

  if (activeView === "group") return <ChatGroupView />;

  if (typeof activeView === "object" && "dm" in activeView) {
    return (
      <ChatDMView
        userId={activeView.dm.userId}
        nickname={activeView.dm.nickname}
      />
    );
  }

  return <ChatInbox />;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ChatModal({ visible, onClose }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d"]}
          style={styles.gradient}
        />
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        {visible ? <ChatContent /> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#d8f3dc",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  circle1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(45,106,79,0.08)",
  },
  circle2: {
    position: "absolute",
    bottom: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(64,145,108,0.06)",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#52796f",
  },
});
