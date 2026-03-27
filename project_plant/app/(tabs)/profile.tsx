import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getUserProfile, logout, updateUserProfile } from "../../lib/auth";

const { width, height } = Dimensions.get("window");

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
  }, []);

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
  }, []);

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
  const [form, setForm] = useState({ name: "", birthdate: "", country: "" });

  // Animaciones
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;

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
  }, [user]);

  const load = async () => {
    if (!user) return;
    const data = await getUserProfile(user.uid);
    setProfile(data);
    setForm({
      name: data?.name ?? "",
      birthdate: data?.birthdate ?? "",
      country: data?.country ?? "",
    });
  };

  const handleSave = async () => {
    if (!user) return;
    await updateUserProfile(user.uid, form);
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
                  {[
                    { label: "Nombre", key: "name", icon: "👤" },
                    {
                      label: "Fecha de nacimiento",
                      key: "birthdate",
                      icon: "🎂",
                    },
                    { label: "Pais", key: "country", icon: "🌍" },
                  ].map((field) => (
                    <View key={field.key} style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>
                        {field.icon} {field.label}
                      </Text>
                      <TextInput
                        style={styles.input}
                        value={form[field.key as keyof typeof form]}
                        onChangeText={(v) =>
                          setForm((f) => ({ ...f, [field.key]: v }))
                        }
                        placeholder={`Ingresa tu ${field.label.toLowerCase()}`}
                        placeholderTextColor="#999"
                      />
                    </View>
                  ))}
                  <View style={styles.buttonGroup}>
                    <AnimatedButton
                      onPress={handleSave}
                      label="Guardar cambios"
                      variant="primary"
                    />
                    <AnimatedButton
                      onPress={() => setEditing(false)}
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
                      value={profile?.birthdate}
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
