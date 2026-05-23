import { zodResolver } from "@hookform/resolvers/zod";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import FloatingLeavesLayer from "@/components/FloatingLeavesLayer";
import AnimatedButton from "@/components/AnimatedButton";
import PulsingLogo from "@/components/PulsingLogo";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";
import { InputText } from "../../components/InputText";
import { Toast } from "../../components/Toast";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { useAuth } from "../../context/AuthContext";
import { AuthUser } from "../../lib/api";
import ForgotPasswordModal from "@/components/ForgotPasswordModal";

const { height } = Dimensions.get("window");

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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  const { login, setAuthState } = useAuth();

  const onGoogleSuccess = async (result: { user: AuthUser; token: string }) => {
    await setAuthState(result.user, result.token);
    router.replace("/(tabs)");
  };

  const { authGoogle, request } = useGoogleAuth(onGoogleSuccess);
  const { control, handleSubmit, getValues } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getLoginErrorMessage = (error: any) => {
    const message = error?.message as string | undefined;
    if (message) {
      const lower = message.toLowerCase();
      if (lower.includes("invalid credentials")) {
        return "Correo o contraseña incorrectos.";
      }
      if (lower.includes("network") || lower.includes("fetch")) {
        return "Sin conexion. Revisa tu internet e intenta de nuevo.";
      }
      if (lower.includes("too many requests")) {
        return "Demasiados intentos. Intenta de nuevo mas tarde.";
      }
    }
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
      router.replace("/(tabs)");
    } catch (error: any) {
      showToast(getLoginErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={["#d8f3dc", "#b7e4c7", "#95d5b2", "#74c69d"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Hojas flotantes */}
      <FloatingLeavesLayer count={6} />

      {/* Formas decorativas */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />
      <View style={styles.decorCircle3} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        {/* Header con logo animado */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <PulsingLogo />
          <Text style={styles.appName}>Plant</Text>
          <Text style={styles.tagline}>Descubre el mundo vegetal</Text>
        </Animated.View>

        {/* Card del formulario con blur */}
        <Animated.View
          style={[
            styles.formCard,
            {
              opacity: formFade,
              transform: [{ translateY: formSlide }],
            },
          ]}
        >
          <BlurView intensity={80} tint="light" style={styles.blurContainer}>
            <View style={styles.formInner}>
              <Text style={styles.welcomeText}>¡Bienvenido de nuevo!</Text>
              <Text style={styles.subtitleText}>
                Inicia sesión para identificar plantas
              </Text>

              <View style={styles.inputContainer}>
                <InputText
                  control={control}
                  name="email"
                  label="Correo electrónico"
                  icon="📧"
                  placeholder="correo@ejemplo.com"
                  inputProps={{
                    keyboardType: "email-address",
                    autoCapitalize: "none",
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <InputText
                  control={control}
                  name="password"
                  label="Contraseña"
                  icon="🔐"
                  placeholder="Tu contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </View>

              <Pressable
                style={styles.forgotPassword}
                onPress={() => setShowForgotModal(true)}
              >
                <Text style={styles.forgotPasswordText}>
                  ¿Olvidaste tu contraseña?
                </Text>
              </Pressable>

              <AnimatedButton
                onPress={handleSubmit(handleLogin)}
                loading={loading}
              >
                {loading ? "Identificando..." : "🌱 Iniciar sesión"}
              </AnimatedButton>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <View style={styles.dividerTextContainer}>
                  <Text style={styles.dividerText}>o continúa con</Text>
                </View>
                <View style={styles.dividerLine} />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.googleBtn,
                  pressed && styles.googleBtnPressed,
                ]}
                onPress={authGoogle}
                disabled={!request}
              >
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleBtnText}>Google</Text>
              </Pressable>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                <Pressable onPress={() => router.push("/(auth)/register")}>
                  <Text style={styles.registerLink}>Regístrate</Text>
                </Pressable>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Footer decorativo */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>🌿 🌸 🌺 🍀 🌻</Text>
        </View>
      </KeyboardAvoidingView>

      <ForgotPasswordModal
        visible={showForgotModal}
        email={getValues("email")}
        onClose={() => setShowForgotModal(false)}
        onSuccess={(msg) => showToast(msg, "success")}
        onError={(msg) => showToast(msg, "error")}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </View>
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
  decorCircle1: {
    position: "absolute",
    top: -100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(45, 106, 79, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: 100,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(64, 145, 108, 0.15)",
  },
  decorCircle3: {
    position: "absolute",
    top: height * 0.3,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(116, 198, 157, 0.2)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    zIndex: 2,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1b4332",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: "#40916c",
    marginTop: 4,
    fontStyle: "italic",
  },
  formCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  formInner: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: "#40916c",
    fontSize: 13,
    fontWeight: "600",
  },
  btn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnGradient: {
    padding: 18,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#b7e4c7",
  },
  dividerTextContainer: {
    paddingHorizontal: 16,
  },
  dividerText: {
    color: "#52796f",
    fontSize: 13,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "#d8f3dc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnPressed: {
    backgroundColor: "#f0f7f4",
    transform: [{ scale: 0.98 }],
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4285F4",
    marginRight: 10,
  },
  googleBtnText: {
    color: "#1b4332",
    fontWeight: "600",
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  registerText: {
    color: "#52796f",
    fontSize: 14,
  },
  registerLink: {
    color: "#2d6a4f",
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
  },
  footerText: {
    fontSize: 24,
    letterSpacing: 8,
  },
});
