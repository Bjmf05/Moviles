import { zodResolver } from "@hookform/resolvers/zod";
import { Picker } from "@react-native-picker/picker";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import InputText from "../../components/InputText";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, logout, updateUserProfile } from "../../lib/auth";

type ProfileForm = {
  name: string;
  birthdate: string;
  country: string;
};

const profileSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  birthdate: z
    .string()
    .min(1, "Selecciona tu fecha de nacimiento.")
    .refine(
      (value) => !Number.isNaN(new Date(value).getTime()),
      "La fecha no es valida.",
    ),
  country: z.string().min(1, "El pais es obligatorio."),
});

// Avatar animado con efecto de halo
const AnimatedAvatar = ({
  photoURL,
  name,
  onPress,
}: {
  photoURL?: string;
  name?: string;
  onPress: () => void;
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.avatarContainer}>
        <Animated.View
          style={[
            styles.avatarHalo,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name?.[0] ?? "?"}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
};

// Campo de informacion animado
const InfoField = ({
  icon,
  label,
  value,
  delay,
}: {
  icon: string;
  label: string;
  value?: string;
  delay: number;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.field,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.fieldIconBg}>
        <Text style={styles.fieldIcon}>{icon}</Text>
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value ?? "—"}</Text>
      </View>
    </Animated.View>
  );
};

// Boton animado
const AnimatedButton = ({
  onPress,
  label,
  variant = "primary",
  icon,
}: {
  onPress: () => void;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const getButtonStyle = () => {
    switch (variant) {
      case "danger":
        return styles.dangerBtn;
      case "secondary":
        return styles.secondaryBtn;
      default:
        return null;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "danger":
        return styles.dangerBtnText;
      case "secondary":
        return styles.secondaryBtnText;
      default:
        return styles.primaryBtnText;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={["#2d6a4f", "#40916c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            {icon && <Text style={styles.btnIcon}>{icon}</Text>}
            <Text style={getTextStyle()}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.btnBase, getButtonStyle()]}>
            {icon && <Text style={styles.btnIcon}>{icon}</Text>}
            <Text style={getTextStyle()}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempYear, setTempYear] = useState(2000);
  const [tempMonth, setTempMonth] = useState(0);
  const [tempDay, setTempDay] = useState(1);

  const { control, handleSubmit, reset } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      birthdate: "",
      country: "",
    },
  });

  // Animaciones
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

  const load = useCallback(async () => {
    if (!user) return;
    const data = await getUserProfile(user.uid);
    setProfile(data);
    reset({
      name: data?.name ?? "",
      birthdate: data?.birthdate ?? "",
      country: data?.country ?? "",
    });
  }, [reset, user]);

  useEffect(() => {
    if (user) load();

    Animated.sequence([
      Animated.parallel([
        Animated.timing(headerFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(headerSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [cardFade, cardScale, headerFade, headerSlide, load, user]);

  const handleSave = async (data: ProfileForm) => {
    if (!user) return;
    await updateUserProfile(user.uid, data);
    setEditing(false);
    load();
  };

  const handlePhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!res.canceled && user) {
      await updateUserProfile(user.uid, { photoURL: res.assets[0].uri });
      load();
    }
  };

  const handleLogout = () => {
    Alert.alert("Cerrar sesion", "Seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Salir", style: "destructive", onPress: logout },
    ]);
  };

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

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={["#d8f3dc", "#b7e4c7", "#d8f3dc"]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.contentBg} />

      {/* Circulos decorativos */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con titulo */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFade,
              transform: [{ translateY: headerSlide }],
            },
          ]}
        >
          <Text style={styles.title}>Mi Perfil</Text>
        </Animated.View>

        {/* Avatar */}
        <Animated.View
          style={[
            styles.avatarSection,
            {
              opacity: headerFade,
            },
          ]}
        >
          <AnimatedAvatar
            photoURL={profile?.photoURL}
            name={profile?.name}
            onPress={handlePhoto}
          />
          <Text style={styles.userName}>{profile?.name ?? "Usuario"}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </Animated.View>

        {/* Card de informacion */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardFade,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <BlurView intensity={60} tint="light" style={styles.cardBlur}>
            <View style={styles.cardInner}>
              {editing ? (
                <>
                  <Text style={styles.cardTitle}>Editar perfil</Text>
                  <InputText
                    control={control}
                    name="name"
                    label="Nombre"
                    icon="👤"
                    placeholder="Ingresa tu nombre"
                  />
                  <Controller
                    control={control}
                    name="birthdate"
                    render={({ field: { onChange, value }, fieldState }) => (
                      <>
                        <Text style={styles.dateLabel}>
                          Fecha de nacimiento
                        </Text>
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
                        {fieldState.error?.message ? (
                          <Text style={styles.dateError}>
                            {fieldState.error.message}
                          </Text>
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
                                            isSelected &&
                                              styles.dayTextSelected,
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
                    icon="🌍"
                    placeholder="Ingresa tu pais"
                  />
                  <View style={styles.buttonGroup}>
                    <AnimatedButton
                      onPress={handleSubmit(handleSave)}
                      label="Guardar cambios"
                      variant="primary"
                    />
                    <AnimatedButton
                      onPress={() => {
                        reset({
                          name: profile?.name ?? "",
                          birthdate: profile?.birthdate ?? "",
                          country: profile?.country ?? "",
                        });
                        setEditing(false);
                      }}
                      label="Cancelar"
                      variant="secondary"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.cardTitle}>Informacion personal</Text>
                  <View style={styles.fieldsContainer}>
                    <InfoField
                      icon="👤"
                      label="Nombre"
                      value={profile?.name}
                      delay={0}
                    />
                    <InfoField
                      icon="📧"
                      label="Correo"
                      value={user?.email ?? ""}
                      delay={80}
                    />
                    <InfoField
                      icon="🎂"
                      label="Fecha de nacimiento"
                      value={getDisplayDate(profile?.birthdate)}
                      delay={160}
                    />
                    <InfoField
                      icon="🌍"
                      label="Pais"
                      value={profile?.country}
                      delay={240}
                    />
                  </View>
                  <AnimatedButton
                    onPress={() => setEditing(true)}
                    label="Editar perfil"
                    variant="secondary"
                    icon="✏️"
                  />
                </>
              )}
            </View>
          </BlurView>
        </Animated.View>

        {/* Boton de cerrar sesion */}
        <Animated.View
          style={[
            styles.logoutSection,
            {
              opacity: cardFade,
            },
          ]}
        >
          <AnimatedButton
            onPress={handleLogout}
            label="Cerrar sesion"
            variant="danger"
          />
        </Animated.View>

        {/* Version de la app */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>PlantID v1.0.0</Text>
          <Text style={styles.footerPlants}>🌿 🌸 🌺 🍀 🌻</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  contentBg: {
    position: "absolute",
    top: 240,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f0f7f4",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  decorCircle1: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(45, 106, 79, 0.1)",
  },
  decorCircle2: {
    position: "absolute",
    top: 100,
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(116, 198, 157, 0.15)",
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingTop: 64,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b4332",
    textAlign: "center",
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHalo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(45, 106, 79, 0.1)",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarInitial: {
    fontSize: 40,
    color: "#fff",
    fontWeight: "800",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraIconText: {
    fontSize: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b4332",
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: "#52796f",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  cardBlur: {
    borderRadius: 24,
    overflow: "hidden",
  },
  cardInner: {
    padding: 24,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 20,
  },
  fieldsContainer: {
    gap: 16,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 12,
    textAlign: "center",
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
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  fieldIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#d8f3dc",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldIcon: {
    fontSize: 20,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1b4332",
    fontWeight: "600",
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f0f7f4",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#d8f3dc",
    color: "#1b4332",
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: "#f0f7f4",
    borderWidth: 2,
    borderColor: "#d8f3dc",
  },
  dangerBtn: {
    backgroundColor: "#ffe5e5",
  },
  btnBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  btnIcon: {
    fontSize: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtnText: {
    color: "#2d6a4f",
    fontWeight: "700",
    fontSize: 15,
  },
  dangerBtnText: {
    color: "#e63946",
    fontWeight: "700",
    fontSize: 15,
  },
  logoutSection: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  versionContainer: {
    alignItems: "center",
    marginTop: 32,
    paddingBottom: 20,
  },
  versionText: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
  },
  footerPlants: {
    fontSize: 20,
    letterSpacing: 6,
  },
});
