import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import InputText from "../../components/InputText";
import Toast from "../../components/Toast";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { login } from "../../lib/auth";

type LoginForm = {
  email: string;
  password: string;
};

const loginSchema = z.object({
  email: z.string().email("El correo no tiene un formato valido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });
  const { authGoogle, request } = useGoogleAuth();
  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getLoginErrorMessage = (error: any) => {
    const code = error?.code as string | undefined;
    switch (code) {
      case "auth/user-not-found":
        return "No existe una cuenta con ese correo.";
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/invalid-email":
        return "El correo no tiene un formato valido.";
      case "auth/too-many-requests":
        return "Demasiados intentos. Intenta de nuevo mas tarde.";
      case "auth/network-request-failed":
        return "Sin conexion. Revisa tu internet e intenta de nuevo.";
      default:
        return "No se pudo iniciar sesion. Intenta de nuevo.";
    }
  };

  const handleLogin = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      router.replace("../(tabs)/");
    } catch (error: any) {
      showToast(getLoginErrorMessage(error), "error");
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

      <InputText
        control={control}
        name="email"
        label="Correo electrónico"
        icon="✉️"
        placeholder="correo@ejemplo.com"
        inputProps={{ keyboardType: "email-address", autoCapitalize: "none" }}
      />
      <InputText
        control={control}
        name="password"
        label="Contraseña"
        icon="🔒"
        placeholder="Tu contraseña"
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.btn}
        onPress={handleSubmit(handleLogin)}
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

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
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
