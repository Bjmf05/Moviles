import { zodResolver } from "@hookform/resolvers/zod";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
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
import InputText from "../../components/InputText";
import Toast from "../../components/Toast";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const { width, height } = Dimensions.get("window");

type LoginForm = {
  email: string;
  password: string;
};

const loginSchema = z.object({
  email: z.string().email("El correo no tiene un formato valido."),
  password: z.string().min(1, "La contraseña es obligatoria."),
});

// Componente de hoja flotante animada
const FloatingLeaf = ({
  delay,
  startX,
  duration,
  size,
  rotation,
}: {
  delay: number;
  startX: number;
  duration: number;
  size: number;
  rotation: number;
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(-100);
      translateX.setValue(startX);
      rotate.setValue(0);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: duration - 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 100,
          duration: duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotation,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    const timeout = setTimeout(animate, delay);
    return () => clearTimeout(timeout);
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          width: size,
          height: size,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.8 }}>🍃</Text>
    </Animated.View>
  );
};

// Componente de pulso para el logo
const PulsingLogo = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glow, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.logoContainer, { transform: [{ scale }] }]}>
      <View style={styles.logoGlow}>
        <Text style={styles.logoEmoji}>🌿</Text>
      </View>
    </Animated.View>
  );
};

// Botón animado
const AnimatedButton = ({
  onPress,
  loading,
  children,
  style,
  textStyle,
}: {
  onPress: () => void;
  loading?: boolean;
  children: React.ReactNode;
  style?: any;
  textStyle?: any;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[styles.btn, style]}
      >
        <LinearGradient
          colors={["#2d6a4f", "#40916c", "#2d6a4f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btnGradient}
        >
          <Text style={[styles.btnText, textStyle]}>{children}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

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

  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const formSlide = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;

  const { authGoogle, request } = useGoogleAuth();
  const { login } = useAuth();
  const { control, handleSubmit } = useForm<LoginForm>({
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

  // Generar hojas flotantes
  const leaves = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    delay: i * 1500,
    startX: Math.random() * width,
    duration: 8000 + Math.random() * 4000,
    size: 20 + Math.random() * 20,
    rotation: 360 + Math.random() * 720,
  }));

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
      {leaves.map((leaf) => (
        <FloatingLeaf key={leaf.id} {...leaf} />
      ))}

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
                />
              </View>

              <Pressable style={styles.forgotPassword}>
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
  leaf: {
    position: "absolute",
    zIndex: 1,
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
  logoContainer: {
    marginBottom: 8,
  },
  logoGlow: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 40,
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
