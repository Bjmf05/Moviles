import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import AnimatedButton from "../AnimatedButton";

interface Props {
  placeholder: string;
  onSend: (text: string) => void;
}

export default function ChatComposer({ placeholder, onSend }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        multiline
        maxLength={1000}
        returnKeyType="default"
      />
      <View style={styles.sendWrap}>
        <AnimatedButton onPress={handleSend} loading={false}>
          Enviar
        </AnimatedButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#d8f3dc",
    backgroundColor: "#fff",
    gap: 8,
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
