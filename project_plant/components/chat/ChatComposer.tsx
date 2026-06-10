import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import AnimatedButton from "../AnimatedButton";

interface Props {
  placeholder: string;
  onSend: (text: string) => void;
  onSendMedia?: (fileUri: string, fileName: string, mimeType: string) => Promise<void>;
}

interface PendingMedia {
  uri: string;
  fileName: string;
  mimeType: string;
}

export default function ChatComposer({ placeholder, onSend, onSendMedia }: Props) {
  const [text, setText] = useState("");
  const [pendingMedia, setPendingMedia] = useState<PendingMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const sendingRef = useRef(false);

  const hasText = text.trim().length > 0;
  const hasMedia = pendingMedia !== null;
  const canSend = hasText || hasMedia;

  const handleSend = async () => {
    if (sendingRef.current) return;

    const trimmed = text.trim();
    if (!canSend) return;

    sendingRef.current = true;

    let mediaSent = false;
    if (hasMedia && onSendMedia) {
      setUploading(true);
      try {
        await onSendMedia(
          pendingMedia!.uri,
          pendingMedia!.fileName,
          pendingMedia!.mimeType,
        );
        mediaSent = true;
      } catch (e: any) {
        Alert.alert("Error", e?.message ?? "No se pudo enviar la imagen.");
        setUploading(false);
        sendingRef.current = false;
        return;
      }
      setUploading(false);
    }

    if (trimmed) {
      onSend(trimmed);
    } else if (!mediaSent) {
      // Nothing was actually sent — abort
      sendingRef.current = false;
      return;
    }

    setText("");
    setPendingMedia(null);
    sendingRef.current = false;
  };

  const handleAttach = async () => {
    if (!onSendMedia) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permiso denegado",
        "Se necesita acceso a la galería para enviar imágenes.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    setPendingMedia({
      uri: asset.uri,
      fileName: asset.fileName ?? asset.uri.split("/").pop() ?? "imagen.jpg",
      mimeType: asset.mimeType ?? "image/jpeg",
    });
  };

  const sendLabel = uploading
    ? "Subiendo..."
    : hasMedia && !hasText
      ? "Enviar 📷"
      : "Enviar";

  return (
    <View style={styles.container}>
      {pendingMedia && (
        <View style={styles.previewRow}>
          <Image source={{ uri: pendingMedia.uri }} style={styles.preview} />
          {uploading && (
            <View style={styles.uploadOverlay}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.uploadText}>Subiendo...</Text>
            </View>
          )}
          {!uploading && (
            <Pressable
              style={styles.removePreview}
              onPress={() => setPendingMedia(null)}
            >
              <Text style={styles.removePreviewText}>✕</Text>
            </Pressable>
          )}
        </View>
      )}
      <View style={styles.inputRow}>
        {onSendMedia && (
          <Pressable
            style={styles.attachBtn}
            onPress={handleAttach}
            disabled={uploading}
          >
            <Text style={styles.attachIcon}>📎</Text>
          </Pressable>
        )}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor="#aaa"
          multiline
          maxLength={700}
          returnKeyType="default"
          editable={!uploading}
        />
        <View style={styles.sendWrap}>
          <AnimatedButton
            onPress={handleSend}
            loading={uploading}
          >
            {sendLabel}
          </AnimatedButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: "#d8f3dc",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "#f0f7f4",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 60,
    height: 60,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  uploadText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "600",
  },
  removePreview: {
    marginLeft: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e63946",
    alignItems: "center",
    justifyContent: "center",
  },
  removePreviewText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7f4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  attachIcon: {
    fontSize: 18,
  },
  input: {
    flex: 1,
    backgroundColor: "#f0f7f4",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1b4332",
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  sendWrap: {
    minWidth: 80,
  },
});
