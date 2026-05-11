import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Animated,
  Easing,
  FlatList,
  Image,
  Modal,
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
import { usePlants } from "../../lib/plants";
import { resolveLocalImageMap } from "../../lib/localCache";

const plantSchema = z.object({
  nombreComun: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  nombreCientifico: z.string().min(2, "Requerido"),
  descripcion: z
    .string()
    .min(10, "La descripcion debe tener al menos 10 caracteres"),
  notes: z.string().optional(),
  "cuidados.riego": z.string().min(1, "Requerido"),
  "cuidados.luz": z.string().min(1, "Requerido"),
  "cuidados.temperatura": z.string().min(1, "Requerido"),
});

type PlantForm = z.infer<typeof plantSchema>;

// Componente de estadistica animada
const StatCard = ({
  value,
  label,
  color,
  delay,
}: {
  value: number;
  label: string;
  color: string;
  delay: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(numberAnim, {
      toValue: value,
      duration: 800,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    numberAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => numberAnim.removeAllListeners();
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={[styles.statNumber, { color }]}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// Tarjeta de planta animada
const PlantCard = ({
  item,
  index,
  onPress,
  onDelete,
  localUri,
}: {
  item: SavedPlant;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  localUri?: string;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.plantCard}
      >
        <Image source={{ uri: localUri || item.imageUri }} style={styles.plantImage} />
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{item.nombreComun}</Text>
          <Text style={styles.plantScientific}>{item.nombreCientifico}</Text>
          <Text style={styles.plantDate}>
            {new Date(item.savedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          {item.notes ? (
            <View style={styles.notesPreview}>
              <Text style={styles.notesPreviewText} numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
};

// Estado vacio animado
const EmptyState = () => {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.emptyIcon,
          {
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        🌿
      </Animated.Text>
      <Text style={styles.emptyTitle}>Tu jardin esta vacio</Text>
      <Text style={styles.emptySubtitle}>
        Identifica una planta para empezar tu coleccion
      </Text>
    </Animated.View>
  );
};

export default function Garden() {
  const { user } = useAuth();
  const { getUserPlants, deletePlant: removePlant } = usePlants();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [selected, setSelected] = useState<SavedPlant | null>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [localImages, setLocalImages] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  // Animaciones
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const getGardenErrorMessage = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : "";
    const normalized = message.toLowerCase();
    if (
      normalized.includes("unauthorized") ||
      normalized.includes("invalid token")
    ) {
      return "Tu sesión no es válida para este backend. Cierra sesión e inicia nuevamente.";
    }
    if (message.toLowerCase().includes("network")) {
      return "Sin conexión. Revisa tu internet e intenta de nuevo.";
    }
    return fallback;
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PlantForm>({
    resolver: zodResolver(plantSchema),
  });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const result = await getUserPlants();
      setPlants(result.plants);
      setIsOffline(result.fromCache);
    } catch (error) {
      setPlants([]);
      setIsOffline(false);
      showToast(
        getGardenErrorMessage(
          error,
          "No se pudo cargar tu jardín. Intenta de nuevo.",
        ),
        "error",
      );
    }
  }, [user, getUserPlants]);

  useEffect(() => {
    if (user) load();

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
    ]).start();
  }, [load, user]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    if (plants.length === 0) {
      setLocalImages({});
      return;
    }
    resolveLocalImageMap(plants).then(setLocalImages);
  }, [plants]);

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    if (!id) return;
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
    try {
      await removePlant(id);
      load();
      showToast("Planta eliminada");
    } catch (error) {
      showToast(
        getGardenErrorMessage(
          error,
          "No se pudo eliminar la planta. Intenta de nuevo.",
        ),
        "error",
      );
    }
  };

  const onSubmitEdit = async (data: PlantForm) => {
    if (!selected?.id) return;
    try {
      await updateDoc(doc(db, "plants", selected.id), {
        nombreComun: data.nombreComun,
        nombreCientifico: data.nombreCientifico,
        descripcion: data.descripcion,
        notes: data.notes ?? "",
        cuidados: {
          riego: data["cuidados.riego"],
          luz: data["cuidados.luz"],
          temperatura: data["cuidados.temperatura"],
        },
      });
      showToast("Planta actualizada correctamente");
      setSelected(null);
      load();
    } catch (error) {
      showToast(
        getGardenErrorMessage(
          error,
          "No se pudo actualizar la planta. Intenta de nuevo.",
        ),
        "error",
      );
    }
  };

  const stats = {
    total: plants.length,
    toxic: plants.filter((p) => p.toxicidad.esToxica).length,
  };

  const formatFullDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente */}
      <LinearGradient
        colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Circulos decorativos */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFade,
            transform: [{ translateY: headerSlide }],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>Mi Jardin</Text>
          <Pressable style={styles.calendarBtn} onPress={() => router.push("/calendar")}>
            <Text style={styles.calendarBtnText}>📅</Text>
          </Pressable>
        </View>
        <Text style={styles.subtitle}>Tu coleccion de plantas</Text>
      </Animated.View>

      {/* Estadisticas */}
      <View style={styles.statsRow}>
        <StatCard
          value={stats.total}
          label="Plantas"
          color="#2d6a4f"
          delay={0}
        />
        <StatCard
          value={stats.total - stats.toxic}
          label="No toxicas"
          color="#40916c"
          delay={100}
        />
        <StatCard
          value={stats.toxic}
          label="Toxicas"
          color="#e63946"
          delay={200}
        />
      </View>

      {/* Indicador offline */}
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>
            Modo offline — mostrando datos guardados
          </Text>
        </View>
      )}

      {/* Lista de plantas o estado vacio */}
      {plants.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(i) => i.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <PlantCard
              item={item}
              index={index}
              localUri={localImages[item.id]}
              onPress={() => {
                setSelected(item);
                setIsEditingDetail(false);
                reset({
                  nombreComun: item.nombreComun,
                  nombreCientifico: item.nombreCientifico,
                  descripcion: item.descripcion,
                  notes: item.notes,
                  "cuidados.riego": item.cuidados.riego,
                  "cuidados.luz": item.cuidados.luz,
                  "cuidados.temperatura": item.cuidados.temperatura,
                });
              }}
              onDelete={() => handleDelete(item.id!)}
            />
          )}
        />
      )}

      {/* Modal de edicion */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setIsEditingDetail(false);
          setSelected(null);
        }}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
            style={styles.gradient}
          />
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            {selected && (
              <>
                <Image
                  source={{ uri: localImages[selected.id] || selected.imageUri }}
                  style={styles.modalImage}
                />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {isEditingDetail ? "Editar planta" : "Detalle de planta"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {isEditingDetail
                      ? "Actualiza la informacion de tu planta"
                      : "Informacion completa guardada en tu jardin"}
                  </Text>
                </View>

                {isEditingDetail ? (
                  <View style={styles.formContainer}>
                    <InputText
                      control={control}
                      name="nombreComun"
                      label="Nombre comun"
                      icon="🌿"
                      placeholder="Ej. Rosa"
                    />
                    <InputText
                      control={control}
                      name="nombreCientifico"
                      label="Nombre cientifico"
                      icon="🔬"
                      placeholder="Ej. Rosa canina"
                    />
                    <InputText
                      control={control}
                      name="descripcion"
                      label="Descripcion"
                      icon="📄"
                      placeholder="Descripcion de la planta..."
                      inputProps={{ multiline: true, numberOfLines: 3 }}
                    />
                    <InputText
                      control={control}
                      name="cuidados.riego"
                      label="Riego"
                      icon="💧"
                      placeholder="Ej. Cada 3 dias"
                    />
                    <InputText
                      control={control}
                      name="cuidados.luz"
                      label="Luz"
                      icon="☀️"
                      placeholder="Ej. Luz indirecta"
                    />
                    <InputText
                      control={control}
                      name="cuidados.temperatura"
                      label="Temperatura"
                      icon="🌡️"
                      placeholder="Ej. 15°C – 30°C"
                    />
                    <InputText
                      control={control}
                      name="notes"
                      label="Mis notas"
                      icon="📝"
                      placeholder="Notas personales..."
                      inputProps={{ multiline: true, numberOfLines: 2 }}
                    />

                    <Pressable
                      style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                      onPress={handleSubmit(onSubmitEdit)}
                      disabled={isSubmitting}
                    >
                      <LinearGradient
                        colors={["#2d6a4f", "#40916c"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveBtnGradient}
                      >
                        <Text style={styles.saveBtnText}>
                          {isSubmitting ? "Guardando..." : "Guardar cambios"}
                        </Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => setIsEditingDetail(false)}
                    >
                      <Text style={styles.cancelBtnText}>
                        Volver al detalle
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.detailContainer}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nombre comun</Text>
                      <Text style={styles.detailValue}>
                        {selected.nombreComun}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Nombre cientifico</Text>
                      <Text style={styles.detailValue}>
                        {selected.nombreCientifico}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Descripcion</Text>
                      <Text style={styles.detailValue}>
                        {selected.descripcion}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Riego</Text>
                      <Text style={styles.detailValue}>
                        {selected.cuidados.riego}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Luz</Text>
                      <Text style={styles.detailValue}>
                        {selected.cuidados.luz}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Temperatura</Text>
                      <Text style={styles.detailValue}>
                        {selected.cuidados.temperatura}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Toxicidad</Text>
                      <Text style={styles.detailValue}>
                        {selected.toxicidad.esToxica ? "Toxica" : "No toxica"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Detalle toxicidad</Text>
                      <Text style={styles.detailValue}>
                        {selected.toxicidad.detalle}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>
                        {selected.notes || "Sin notas"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Fecha de guardado</Text>
                      <Text style={styles.detailValue}>
                        {formatFullDate(selected.savedAt)}
                      </Text>
                    </View>

                    <Pressable
                      style={styles.editBtn}
                      onPress={() => setIsEditingDetail(true)}
                    >
                      <LinearGradient
                        colors={["#2d6a4f", "#40916c"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.saveBtnGradient}
                      >
                        <Text style={styles.saveBtnText}>Editar</Text>
                      </LinearGradient>
                    </Pressable>

                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => {
                        setIsEditingDetail(false);
                        setSelected(null);
                      }}
                    >
                      <Text style={styles.cancelBtnText}>Cerrar</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <Modal
        transparent
        animationType="fade"
        visible={showDeleteConfirm}
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <LinearGradient
              colors={["#e8f5e9", "#d8f3dc"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmHeader}
            >
              <Text style={styles.confirmTitle}>Eliminar planta</Text>
            </LinearGradient>
            <Text style={styles.confirmMessage}>
              Esta planta se quitara de tu jardin. Continuar?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnNeutral]}
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setPendingDeleteId(null);
                }}
              >
                <Text style={styles.confirmBtnTextNeutral}>Conservar</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmBtn, styles.confirmBtnDanger]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmBtnTextDanger}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorCircle1: {
    position: "absolute",
    top: -50,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(45, 106, 79, 0.06)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: 150,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(116, 198, 157, 0.08)",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    marginBottom: 20,
    zIndex: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  calendarBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  calendarBtnText: {
    fontSize: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1b4332",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#52796f",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
    zIndex: 2,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#74c69d",
    fontWeight: "600",
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  plantImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  plantInfo: {
    flex: 1,
    marginLeft: 14,
  },
  plantName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1b4332",
  },
  plantScientific: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#74c69d",
    marginTop: 2,
  },
  plantDate: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  notesPreview: {
    backgroundColor: "#f0f7f4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  notesPreviewText: {
    fontSize: 11,
    color: "#52796f",
  },
  deleteBtn: {
    padding: 10,
  },
  deleteIcon: {
    fontSize: 18,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#74c69d",
    textAlign: "center",
    lineHeight: 22,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f0f7f4",
  },
  modalContent: {
    padding: 24,
    paddingBottom: 40,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalHeader: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1b4332",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#52796f",
    marginTop: 4,
  },
  formContainer: {
    gap: 4,
  },
  detailContainer: {
    gap: 12,
  },
  detailRow: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  detailLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
    color: "#52796f",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#1b4332",
    lineHeight: 21,
  },
  saveBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    padding: 18,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  editBtn: {
    marginTop: 12,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelBtn: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#d8f3dc",
    marginTop: 10,
  },
  cancelBtnText: {
    color: "#52796f",
    fontWeight: "600",
    fontSize: 15,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    padding: 24,
  },
  confirmCard: {
    borderRadius: 22,
    backgroundColor: "#fff",
    overflow: "hidden",
    shadowColor: "#1b4332",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  confirmHeader: {
    paddingVertical: 12,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b4332",
  },
  confirmMessage: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    fontSize: 14,
    color: "#52796f",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmBtnNeutral: {
    backgroundColor: "#f0f7f4",
    borderWidth: 1.5,
    borderColor: "#d8f3dc",
  },
  confirmBtnDanger: {
    backgroundColor: "#ffe5e5",
    borderWidth: 1.5,
    borderColor: "#e63946",
  },
  confirmBtnTextNeutral: {
    color: "#2d6a4f",
    fontWeight: "700",
  },
  confirmBtnTextDanger: {
    color: "#e63946",
  },
  offlineBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ffeeba",
    zIndex: 2,
  },
  offlineBannerText: {
    fontSize: 13,
    color: "#856404",
    fontWeight: "600",
    textAlign: "center",
  },
});
