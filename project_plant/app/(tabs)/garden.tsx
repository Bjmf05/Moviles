import { zodResolver } from "@hookform/resolvers/zod";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Animated,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";
import { Toast } from "../../components/Toast";
import StatCard from "@/components/StatCard";
import PlantCard from "@/components/GardenPlantCard";
import EmptyState from "@/components/GardenEmptyState";
import PlantEditModal from "@/components/PlantEditModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { SavedPlant, usePlants } from "../../lib/plants";
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

export default function Garden() {
  const { user, token } = useAuth();
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
    if (!selected?.id || !token) return;
    try {
      await api.plants.update(token, selected.id, {
        nombreComun: data.nombreComun,
        nombreCientifico: data.nombreCientifico,
        descripcion: data.descripcion,
        notes: data.notes ?? "",
        isPublic: selected.isPublic,
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
          <Pressable
            style={styles.calendarBtn}
            onPress={() => router.push("/calendar")}
          >
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

      {/* Modal de edicion / detalle */}
      <PlantEditModal
        visible={!!selected}
        plant={selected}
        isEditing={isEditingDetail}
        isSubmitting={isSubmitting}
        localImageUri={localImages[selected?.id ?? ""]}
        control={control}
        onSave={handleSubmit(onSubmitEdit)}
        onClose={() => {
          setIsEditingDetail(false);
          setSelected(null);
        }}
        onToggleEditing={() => setIsEditingDetail(!isEditingDetail)}
        onTogglePublic={() => {
          if (!selected) return;
          setSelected({ ...selected, isPublic: !selected.isPublic });
        }}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />

      <ConfirmDialog
        gradientHeader
        visible={showDeleteConfirm}
        title="Eliminar planta"
        message="Esta planta se quitara de tu jardin. Continuar?"
        confirmLabel="Eliminar"
        cancelLabel="Conservar"
        confirmDanger
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setPendingDeleteId(null);
        }}
      />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
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
