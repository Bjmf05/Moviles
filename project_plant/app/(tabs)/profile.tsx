import { useCamera } from "@/hooks/useCamera";
import { usePlants } from "@/lib/plants";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlurView } from "expo-blur";
import { CameraView } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Animated,
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
import { DatePickerField } from "../../components/DatePickerField";
import { InputText } from "../../components/InputText";
import { Toast } from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import InfoField from "@/components/InfoField";
import VariantButton from "@/components/VariantButton";
import PhotoPreview from "@/components/PhotoPreview";
import ConfirmDialog from "@/components/ConfirmDialog";
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
  country: z.string().min(1, "El país es obligatorio."),
});

export default function Profile() {
  const { user, token, logout } = useAuth();
  const { uploadImage } = usePlants();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

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
    if (!user || !token) return;
    try {
      const data = await api.auth.getProfile(token);
      setProfile(data);
      reset({
        name: data?.name || user.name || "",
        birthdate: data?.birthdate || "",
        country: data?.country || "",
      });
    } catch {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        birthdate: "",
        country: "",
      });
      reset({
        name: user.name || "",
        birthdate: "",
        country: "",
      });
    }
  }, [reset, user, token]);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

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
    if (!user || !token) return;
    try {
      await api.auth.updateProfile(token, data);
      setEditing(false);
      showToast("Perfil actualizado correctamente.");
      load();
    } catch {
      showToast("No se pudo guardar el perfil. Intenta de nuevo.", "error");
    }
  };
  const {
    cameraRef,
    requestCameraPermission,
    takePhoto,
    facing,
    flashMode,
    toggleFacing,
    toggleFlash,
  } = useCamera({ requestOnMount: false });

  const [showCamera, setShowCamera] = useState(false);

  const handlePhoto = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      showToast("Necesitas permitir el acceso a la cámara.", "warning");
      return;
    }
    setShowCamera(true);
  };

  const handleAvatarPress = () => {
    setShowCameraOptions(true);
  };

  const handleCapture = async () => {
    const photo = await takePhoto();
    if (!photo) return;
    setCapturedPhoto(photo.uri);
    setShowPhotoPreview(true);
    setShowCamera(false);
  };

  const handleConfirmPhoto = async () => {
    if (!user || !token || !capturedPhoto) return;
    try {
      const publicUrl = await uploadImage(capturedPhoto);
      await api.auth.updateProfile(token, { photoURL: publicUrl });
      showToast("Foto de perfil actualizada.");
      setShowPhotoPreview(false);
      setCapturedPhoto(null);
      load();
    } catch {
      showToast("No se pudo actualizar la foto. Intenta de nuevo.", "error");
    }
  };

  const handleRetakePhoto = () => {
    setShowPhotoPreview(false);
    setCapturedPhoto(null);
    setShowCamera(true);
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Necesitas permitir el acceso a la galería.", "warning");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (res.canceled) return;
    setCapturedPhoto(res.assets[0].uri);
    setShowPhotoPreview(true);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            onPress={handleAvatarPress}
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
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <Controller
                    control={control}
                    name="birthdate"
                    render={({ field: { onChange, value }, fieldState }) => (
                      <DatePickerField
                        label="Fecha de nacimiento"
                        value={value}
                        onChange={onChange}
                        error={fieldState.error?.message}
                        placeholder="Selecciona una fecha"
                      />
                    )}
                  />
                  <InputText
                    control={control}
                    name="country"
                    label="Pais"
                    icon="🌍"
                    placeholder="Ingresa tu pais"
                    autoCapitalize="words"
                    returnKeyType="done"
                  />
                  <View style={styles.buttonGroup}>
                    <VariantButton
                      onPress={handleSubmit(handleSave)}
                      label="Guardar cambios"
                      variant="primary"
                    />
                    <VariantButton
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
                  <VariantButton
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
          <VariantButton
            onPress={handleLogout}
            label="Cerrar sesion"
            variant="danger"
          />
        </Animated.View>

        {/* Version de la app */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Plant v1.0.0</Text>
          <Text style={styles.footerPlants}>🌿 🌸 🌺 🍀 🌻</Text>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => setShowCamera(false)}
      >
        <View style={styles.cameraModal}>
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={facing}
            flash={flashMode}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.65)", "rgba(0,0,0,0)"]}
            style={styles.cameraOverlayTop}
            pointerEvents="none"
          />
          <LinearGradient
            colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.65)"]}
            style={styles.cameraOverlayBottom}
            pointerEvents="none"
          />
          <View style={styles.cameraTopBar}>
            <Pressable onPress={() => setShowCamera(false)}>
              <Text style={styles.cameraIconText}>✕</Text>
            </Pressable>
            <Text style={styles.cameraTitle}>Foto de perfil</Text>
            <Pressable onPress={toggleFlash}>
              <Text
                style={[
                  styles.cameraIconText,
                  flashMode !== "off" && styles.cameraIconActive,
                ]}
              >
                ⚡
              </Text>
            </Pressable>
          </View>
          <View style={styles.cameraBottomBar}>
            <Pressable onPress={toggleFacing}>
              <Text style={styles.cameraIconText}>🔄</Text>
            </Pressable>
            <Pressable onPress={handleCapture} style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </Pressable>
            <Pressable onPress={handlePickFromGallery}>
              <Text style={styles.cameraIconText}>🖼️</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        transparent
        animationType="fade"
        visible={showCameraOptions}
        onRequestClose={() => setShowCameraOptions(false)}
      >
        <View style={styles.actionSheetBackdrop}>
          <BlurView intensity={80} tint="light" style={styles.actionSheet}>
            <Text style={styles.actionSheetTitle}>Foto de perfil</Text>
            {profile?.photoURL ? (
              <TouchableOpacity
                style={styles.actionSheetBtn}
                onPress={() => {
                  setShowCameraOptions(false);
                  setShowProfilePhoto(true);
                }}
              >
                <Text style={styles.actionSheetText}>Ver foto</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.actionSheetBtn}
              onPress={() => {
                setShowCameraOptions(false);
                handlePhoto();
              }}
            >
              <Text style={styles.actionSheetText}>Abrir cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionSheetBtn, styles.actionSheetBtnMuted]}
              onPress={() => setShowCameraOptions(false)}
            >
              <Text style={styles.actionSheetTextMuted}>Cancelar</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </Modal>
      <PhotoPreview
        mode="confirm"
        visible={showPhotoPreview}
        uri={capturedPhoto ?? ""}
        onConfirm={handleConfirmPhoto}
        onRetake={handleRetakePhoto}
        onClose={() => setShowPhotoPreview(false)}
      />
      <PhotoPreview
        mode="view"
        visible={showProfilePhoto}
        uri={profile?.photoURL ?? ""}
        onClose={() => setShowProfilePhoto(false)}
      />
      <ConfirmDialog
        blurCard
        visible={showLogoutConfirm}
        title="Hasta pronto"
        message="Tu jardin se queda a salvo. Quieres salir por ahora?"
        confirmLabel="Salir"
        cancelLabel="Quedarme"
        confirmDanger
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
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
  buttonGroup: {
    gap: 12,
    marginTop: 8,
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
  cameraModal: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraTopBar: {
    position: "absolute",
    top: 44,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cameraBottomBar: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  cameraIconActive: {
    color: "#ffd166",
  },
  shutterOuter: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#fff",
  },
  cameraOverlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  cameraOverlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 180,
  },
  actionSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "flex-end",
    padding: 16,
  },
  actionSheet: {
    borderRadius: 20,
    padding: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    gap: 12,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
  },
  actionSheetBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f0f7f4",
    alignItems: "center",
  },
  actionSheetBtnMuted: {
    backgroundColor: "#e9efec",
  },
  actionSheetText: {
    color: "#1b4332",
    fontWeight: "700",
  },
  actionSheetTextMuted: {
    color: "#52796f",
    fontWeight: "700",
  },
});
