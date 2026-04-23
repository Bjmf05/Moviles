import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import { InputText } from "../../components/InputText";
import { Toast } from "../../components/Toast";
import { register } from "../../lib/auth";

const { width, height } = Dimensions.get("window");

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
      .min(6, "La contrasena debe tener al menos 6 caracteres."),
    confirm: z.string().min(1, "Confirma tu contrasena."),
    birthdate: z
      .string()
      .min(1, "Selecciona tu fecha de nacimiento.")
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "La fecha no es valida.",
      ),
    country: z.string().min(1, "El pais es obligatorio."),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "Las contrasenas no coinciden.",
  });

// Componente de hoja flotante animada
const FloatingLeaf = ({
  delay,
  startX,
  duration,
  size,
  rotation,
  emoji,
}: {
  delay: number;
  startX: number;
  duration: number;
  size: number;
  rotation: number;
  emoji: string;
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
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
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
          toValue: startX + (Math.random() - 0.5) * 80,
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
      <Text style={{ fontSize: size * 0.8 }}>{emoji}</Text>
    </Animated.View>
  );
};

// Logo animado con pulso
const PulsingLogo = () => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.logoContainer, { transform: [{ scale }] }]}>
      <View style={styles.logoGlow}>
        <Text style={styles.logoEmoji}>🌱</Text>
      </View>
    </Animated.View>
  );
};

// Botón animado
const AnimatedButton = ({
  onPress,
  loading,
  children,
}: {
  onPress: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

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
      >
        <LinearGradient
          colors={["#2d6a4f", "#40916c", "#2d6a4f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btn}
        >
          <Text style={styles.btnText}>{children}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempDay, setTempDay] = useState(1);
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
  }, []);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const getDaysInMonth = (year: number, month: number) =>
    new Date(year, month + 1, 0).getDate();

  const getMonthStartOffset = (year: number, month: number) => {
    const dayOfWeek = new Date(year, month, 1).getDay();
    return dayOfWeek;
  };

  const monthLabels = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const years = Array.from({ length: 151 }, (_, i) => 2025 - i);
  const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

  const getDisplayDate = (value?: string) => {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return formatDate(parsed);
  };

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
        return "La contrasena es muy debil. Usa al menos 6 caracteres.";
      case "auth/network-request-failed":
        return "Sin conexion. Revisa tu internet e intenta de nuevo.";
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
      setTimeout(() => {
        router.replace("../(tabs)/");
      }, 800);
    } catch (e: any) {
      showToast(getRegisterErrorMessage(e), "error");
    } finally {
      setLoading(false);
    }
  };

  // Generar hojas flotantes con diferentes emojis
  const leafEmojis = ["🍃", "🌿", "🌱", "☘️", "🍀"];
  const leaves = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    delay: i * 2000,
    startX: Math.random() * width,
    duration: 10000 + Math.random() * 5000,
    size: 18 + Math.random() * 16,
    rotation: 360 + Math.random() * 720,
    emoji: leafEmojis[i % leafEmojis.length],
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
                <Text style={styles.welcomeText}>Unete a Plant</Text>
                <Text style={styles.subtitleText}>
                  Identifica plantas y crea tu jardin virtual
                </Text>

                <InputText
                  control={control}
                  name="name"
                  label="Nombre completo"
                  icon="👤"
                  placeholder="Tu nombre"
                />
                <InputText
                  control={control}
                  name="email"
                  label="Correo electronico"
                  icon="📧"
                  placeholder="correo@ejemplo.com"
                  inputProps={{
                    keyboardType: "email-address",
                    autoCapitalize: "none",
                  }}
                />
                <InputText
                  control={control}
                  name="password"
                  label="Contrasena"
                  icon="🔐"
                  placeholder="Minimo 6 caracteres"
                  secureTextEntry
                />
                <InputText
                  control={control}
                  name="confirm"
                  label="Confirmar contrasena"
                  icon="🔐"
                  placeholder="Repite la contrasena"
                  secureTextEntry
                />
                <Controller
                  control={control}
                  name="birthdate"
                  render={({
                    field: { onChange, value },
                    fieldState: { error },
                  }) => (
                    <>
                      <Text style={styles.dateLabel}>Fecha de nacimiento</Text>
                      <TouchableOpacity
                        style={styles.dateInput}
                        onPress={() => {
                          const baseDate = value
                            ? new Date(value)
                            : new Date(2000, 0, 1);
                          const safeDate = Number.isNaN(baseDate.getTime())
                            ? new Date(2000, 0, 1)
                            : baseDate;
                          setTempYear(safeDate.getFullYear());
                          setTempMonth(safeDate.getMonth());
                          setTempDay(safeDate.getDate());
                          setShowDatePicker(true);
                        }}
                      >
                        <Text style={styles.dateIcon}>📅</Text>
                        <Text
                          style={
                            value ? styles.dateText : styles.datePlaceholder
                          }
                        >
                          {value
                            ? getDisplayDate(value)
                            : "Selecciona una fecha"}
                        </Text>
                      </TouchableOpacity>
                      {error?.message ? (
                        <Text style={styles.dateError}>{error.message}</Text>
                      ) : null}
                      {showDatePicker && (
                        <Modal
                          transparent
                          animationType="fade"
                          visible={showDatePicker}
                          onRequestClose={() => setShowDatePicker(false)}
                        >
                          <View style={styles.modalBackdrop}>
                            <BlurView
                              intensity={90}
                              tint="light"
                              style={styles.modalSheet}
                            >
                              <Text style={styles.modalTitle}>
                                Selecciona tu fecha de nacimiento
                              </Text>
                              <View style={styles.pickerRow}>
                                <Picker
                                  style={styles.picker}
                                  selectedValue={tempMonth}
                                  onValueChange={(nextMonth) => {
                                    const maxDay = getDaysInMonth(
                                      tempYear,
                                      nextMonth,
                                    );
                                    setTempMonth(nextMonth);
                                    setTempDay((current) =>
                                      current > maxDay ? maxDay : current,
                                    );
                                  }}
                                >
                                  {monthLabels.map((label, index) => (
                                    <Picker.Item
                                      key={label}
                                      label={label}
                                      value={index}
                                    />
                                  ))}
                                </Picker>
                                <Picker
                                  style={styles.picker}
                                  selectedValue={tempYear}
                                  onValueChange={(nextYear) => {
                                    const maxDay = getDaysInMonth(
                                      nextYear,
                                      tempMonth,
                                    );
                                    setTempYear(nextYear);
                                    setTempDay((current) =>
                                      current > maxDay ? maxDay : current,
                                    );
                                  }}
                                >
                                  {years.map((year) => (
                                    <Picker.Item
                                      key={year}
                                      label={`${year}`}
                                      value={year}
                                    />
                                  ))}
                                </Picker>
                              </View>
                              <View style={styles.calendarHeader}>
                                {weekDays.map((day, index) => (
                                  <Text
                                    key={`${day}-${index}`}
                                    style={styles.calendarHeaderText}
                                  >
                                    {day}
                                  </Text>
                                ))}
                              </View>
                              <View style={styles.calendarGrid}>
                                {Array.from({
                                  length:
                                    getMonthStartOffset(tempYear, tempMonth) +
                                    getDaysInMonth(tempYear, tempMonth),
                                }).map((_, index) => {
                                  const offset = getMonthStartOffset(
                                    tempYear,
                                    tempMonth,
                                  );
                                  const dayNumber = index - offset + 1;
                                  if (dayNumber < 1) {
                                    return (
                                      <View
                                        key={`empty-${index}`}
                                        style={styles.dayCell}
                                      />
                                    );
                                  }

                                  const isSelected = dayNumber === tempDay;

                                  return (
                                    <TouchableOpacity
                                      key={dayNumber}
                                      style={[
                                        styles.dayCell,
                                        isSelected && styles.dayCellSelected,
                                      ]}
                                      onPress={() => setTempDay(dayNumber)}
                                    >
                                      <Text
                                        style={[
                                          styles.dayText,
                                          isSelected && styles.dayTextSelected,
                                        ]}
                                      >
                                        {dayNumber}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                              <View style={styles.modalActions}>
                                <TouchableOpacity
                                  style={styles.modalBtn}
                                  onPress={() => setShowDatePicker(false)}
                                >
                                  <Text style={styles.modalBtnText}>
                                    Cancelar
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={[
                                    styles.modalBtn,
                                    styles.modalBtnPrimary,
                                  ]}
                                  onPress={() => {
                                    const newDate = new Date(
                                      tempYear,
                                      tempMonth,
                                      tempDay,
                                    );
                                    onChange(newDate.toISOString());
                                    setShowDatePicker(false);
                                  }}
                                >
                                  <Text
                                    style={[
                                      styles.modalBtnText,
                                      styles.modalBtnTextPrimary,
                                    ]}
                                  >
                                    Confirmar
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </BlurView>
                          </View>
                        </Modal>
                      )}
                    </>
                  )}
                />
                <InputText
                  control={control}
                  name="country"
                  label="Pais"
                  icon="🌎"
                  placeholder="Ej. Costa Rica"
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
  leaf: {
    position: "absolute",
    zIndex: 1,
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
  logoContainer: {
    marginBottom: 6,
  },
  logoGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  logoEmoji: {
    fontSize: 32,
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
  dateLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  dateInput: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dateIcon: {
    fontSize: 18,
  },
  dateText: {
    fontSize: 15,
    color: "#1b4332",
  },
  datePlaceholder: {
    fontSize: 15,
    color: "#aaa",
  },
  dateError: {
    fontSize: 12,
    color: "#e63946",
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "rgba(247, 255, 244, 0.95)",
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
  },
  picker: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 6,
  },
  calendarHeaderText: {
    width: "14.285%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#40916c",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  dayCell: {
    width: "14.285%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "rgba(240, 247, 244, 0.8)",
  },
  dayCellSelected: {
    backgroundColor: "#2d6a4f",
  },
  dayText: {
    fontSize: 14,
    color: "#1b4332",
    fontWeight: "600",
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "800",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 12,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: "rgba(240, 247, 244, 0.9)",
  },
  modalBtnPrimary: {
    backgroundColor: "#2d6a4f",
  },
  modalBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2d6a4f",
  },
  modalBtnTextPrimary: {
    color: "#fff",
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  btn: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.5,
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
