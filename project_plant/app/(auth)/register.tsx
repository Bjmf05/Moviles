import { zodResolver } from "@hookform/resolvers/zod";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import FloatingLeavesLayer from "../../components/FloatingLeavesLayer";
import AnimatedButton from "@/components/AnimatedButton";
import PulsingLogo from "../../components/PulsingLogo";
import { DatePickerField } from "../../components/DatePickerField";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";
import { InputText } from "../../components/InputText";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";

type RegisterForm = {
  name: string;
  email: string;
  password: string;
  confirm: string;
  birthdate: string;
  country: string;
};

const registerSchema = z
  .object({
    name: z.string().min(1, "El nombre es obligatorio."),
    email: z.string().email("El correo no tiene un formato valido."),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres."),
    confirm: z.string().min(1, "Confirma tu contraseña."),
    birthdate: z
      .string()
      .min(1, "Selecciona tu fecha de nacimiento.")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "La fecha no es valida.",
      ),
    country: z.string().min(1, "El país es obligatorio."),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Las contraseñas no coinciden.",
  });

export default function Register() {
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
  const { register } = useAuth();
  // Animaciones de entrada
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const formFade = useRef(new Animated.Value(0)).current;
  const formSlide = useRef(new Animated.Value(20)).current;

  const { control, handleSubmit } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirm: "",
      birthdate: "",
      country: "",
    },
  });

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(formFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(formSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, slideAnim, formFade, formSlide]);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getRegisterErrorMessage = (error: any) => {
    const code = error?.code as string | undefined;
    switch (code) {
      case "auth/email-already-in-use":
        return "Ese correo ya esta registrado. Prueba iniciar sesion.";
      case "auth/invalid-email":
        return "El correo no tiene un formato valido.";
      case "auth/weak-password":
        return "La contraseña es muy débil. Usa al menos 6 caracteres.";
      case "auth/network-request-failed":
        return "Sin conexión. Revisa tu internet e intenta de nuevo.";
      default:
        return "No se pudo crear la cuenta. Intenta de nuevo.";
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true);
    try {
      await register(
        data.email,
        data.password,
        data.name,
        data.birthdate,
        data.country,
      );
      showToast("Cuenta creada correctamente.", "success");
    } catch (e: any) {
      showToast(getRegisterErrorMessage(e), "error");
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
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
            <Text style={styles.tagline}>Crea tu cuenta</Text>
          </Animated.View>

          {/* Formulario */}
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
                <Text style={styles.welcomeText}>Únete a Plant</Text>
                <Text style={styles.subtitleText}>
                  Identifica plantas y crea tu jardín virtual
                </Text>

                <InputText
                  control={control}
                  name="name"
                  label="Nombre completo"
                  icon="👤"
                  placeholder="Tu nombre"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                <InputText
                  control={control}
                  name="email"
                  label="Correo electrónico"
                  icon="📧"
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <InputText
                  control={control}
                  name="password"
                  label="Contraseña"
                  icon="🔐"
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <InputText
                  control={control}
                  name="confirm"
                  label="Confirmar contraseña"
                  icon="🔐"
                  placeholder="Repite la contraseña"
                  secureTextEntry
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                <Controller
                  control={control}
                  name="birthdate"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <DatePickerField
                      label="Fecha de nacimiento"
                      value={value}
                      onChange={onChange}
                      error={error?.message}
                    />
                  )}
                />
                <InputText
                  control={control}
                  name="country"
                  label="País"
                  icon="🌎"
                  placeholder="Ej. Costa Rica"
                  autoCapitalize="words"
                  returnKeyType="done"
                />

                <View style={styles.buttonContainer}>
                  <AnimatedButton
                    onPress={handleSubmit(handleRegister)}
                    loading={loading}
                  >
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                  </AnimatedButton>
                </View>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>Ya tienes cuenta? </Text>
                  <Pressable onPress={() => router.back()}>
                    <Text style={styles.loginLink}>Inicia sesion</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer decorativo */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>🌿 🌸 🌺 🍀 🌻</Text>
          </View>
        </ScrollView>
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
  decorCircle1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(45, 106, 79, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: 150,
    left: -70,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(64, 145, 108, 0.12)",
  },
  keyboardView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b4332",
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 14,
    color: "#40916c",
    marginTop: 2,
    fontStyle: "italic",
  },
  formCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  blurContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  formInner: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.75)",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: "#52796f",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "#52796f",
    fontSize: 14,
  },
  loginLink: {
    color: "#2d6a4f",
    fontWeight: "700",
    fontSize: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 20,
    letterSpacing: 8,
  },
});
