import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { register } from "../../lib/auth";

// ✅ Field fuera del componente principal
function Field({
  label,
  value,
  onChangeText,
  inputProps,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  inputProps?: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        {...inputProps}
      />
    </View>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    birthdate: "",
    country: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    const { name, email, password, confirm, birthdate, country } = form;
    if (!name || !email || !password || !birthdate || !country)
      return Alert.alert("Completa todos los campos");
    if (password !== confirm)
      return Alert.alert("Las contraseñas no coinciden");
    if (password.length < 6)
      return Alert.alert("La contraseña debe tener al menos 6 caracteres");
    setLoading(true);
    try {
      await register(email, password, name, birthdate, country);
      router.replace("../(tabs)/");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 28, paddingTop: 60 }}
      >
        <Text style={styles.logo}>🌿 PlantID</Text>
        <Text style={styles.title}>Crear cuenta</Text>

        <Field
          label="Nombre completo"
          value={form.name}
          onChangeText={set("name")}
          inputProps={{ placeholder: "Tu nombre" }}
        />
        <Field
          label="Correo electrónico"
          value={form.email}
          onChangeText={set("email")}
          inputProps={{
            placeholder: "correo@ejemplo.com",
            keyboardType: "email-address",
            autoCapitalize: "none",
          }}
        />
        <Field
          label="Contraseña"
          value={form.password}
          onChangeText={set("password")}
          inputProps={{
            placeholder: "Mínimo 6 caracteres",
            secureTextEntry: true,
          }}
        />
        <Field
          label="Confirmar contraseña"
          value={form.confirm}
          onChangeText={set("confirm")}
          inputProps={{
            placeholder: "Repite la contraseña",
            secureTextEntry: true,
          }}
        />
        <Field
          label="Fecha de nacimiento"
          value={form.birthdate}
          onChangeText={set("birthdate")}
          inputProps={{ placeholder: "DD/MM/AAAA" }}
        />
        <Field
          label="País"
          value={form.country}
          onChangeText={set("country")}
          inputProps={{ placeholder: "Ej. Costa Rica" }}
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "Creando cuenta..." : "Registrarse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            ¿Ya tienes cuenta?{" "}
            <Text style={styles.linkBold}>Inicia sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  logo: { fontSize: 36, textAlign: "center", marginBottom: 4 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 28,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#52796f", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
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
  link: { textAlign: "center", color: "#52796f", fontSize: 14 },
  linkBold: { fontWeight: "700", color: "#2d6a4f" },
});
