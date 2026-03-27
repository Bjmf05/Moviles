import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { login } from "../../lib/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { authGoogle, request } = useGoogleAuth();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Completa todos los campos");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("../(tabs)/");
    } catch {
      Alert.alert("Error", "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.logo}>🌿 PlantID</Text>
      <Text style={styles.title}>Bienvenido de nuevo</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.btnText}>
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity
        style={styles.googleBtn}
        onPress={authGoogle}
        disabled={!request}
      >
        <Text style={styles.googleBtnText}>🔵 Continuar con Google</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>
          ¿No tienes cuenta? <Text style={styles.linkBold}>Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f4",
    justifyContent: "center",
    padding: 28,
  },
  logo: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  btn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#d8f3dc" },
  dividerText: { color: "#74c69d", fontSize: 13 },
  googleBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8f3dc",
    marginBottom: 20,
  },
  googleBtnText: { color: "#1b4332", fontWeight: "700", fontSize: 15 },
  link: { textAlign: "center", color: "#52796f", fontSize: 14 },
  linkBold: { fontWeight: "700", color: "#2d6a4f" },
});
