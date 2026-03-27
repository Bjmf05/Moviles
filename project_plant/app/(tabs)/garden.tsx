import { zodResolver } from "@hookform/resolvers/zod";
import { doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";
import InputText from "../../components/InputText";
import Toast from "../../components/Toast";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import { deletePlant, getUserPlants, SavedPlant } from "../../lib/plants";

const plantSchema = z.object({
  nombreComun: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  nombreCientifico: z.string().min(2, "Requerido"),
  descripcion: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres"),
  notes: z.string().optional(),
  "cuidados.riego": z.string().min(1, "Requerido"),
  "cuidados.luz": z.string().min(1, "Requerido"),
  "cuidados.temperatura": z.string().min(1, "Requerido"),
});

type PlantForm = z.infer<typeof plantSchema>;

export default function Garden() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [selected, setSelected] = useState<SavedPlant | null>(null);
  const [, setNotes] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({
    visible: false,
    message: "",
    type: "success",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success",
  ) => {
    setToast({ visible: true, message, type });
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PlantForm>({
    resolver: zodResolver(plantSchema),
  });

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setPlants(await getUserPlants(user.uid));
  };

  const handleDelete = (id: string) => {
    Alert.alert("Eliminar", "¿Seguro que quieres eliminar esta planta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deletePlant(id);
          load();
        },
      },
    ]);
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
      showToast("✅ Planta actualizada correctamente");
      setSelected(null);
      load();
    } catch {
      showToast("No se pudo actualizar la planta", "error");
    }
  };

  const stats = {
    total: plants.length,
    toxic: plants.filter((p) => p.toxicidad.esToxica).length,
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Mi Jardín</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Plantas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total - stats.toxic}</Text>
          <Text style={styles.statLabel}>No tóxicas</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: "#e63946" }]}>
            {stats.toxic}
          </Text>
          <Text style={styles.statLabel}>Tóxicas</Text>
        </View>
      </View>

      {plants.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌿</Text>
          <Text style={styles.emptyText}>
            Aún no tienes plantas{"\n"}¡Identifica una para empezar!
          </Text>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(i) => i.id!}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => {
                setSelected(item);
                setNotes(item.notes);
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
            >
              <Image source={{ uri: item.imageUri }} style={styles.thumb} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.nombreComun}</Text>
                <Text style={styles.cardSci}>{item.nombreCientifico}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.savedAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
                {item.notes ? (
                  <Text style={styles.cardNotes} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(item.id!)}
                style={styles.deleteBtn}
              >
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ScrollView
          style={styles.modal}
          contentContainerStyle={{ padding: 24 }}
        >
          {selected && (
            <>
              <Image
                source={{ uri: selected.imageUri }}
                style={styles.modalImage}
              />
              <Text style={styles.modalName}>Editar planta</Text>

              <InputText
                control={control}
                name="nombreComun"
                label="Nombre común"
                icon="🌿"
                placeholder="Ej. Rosa"
              />
              <InputText
                control={control}
                name="nombreCientifico"
                label="Nombre científico"
                icon="🔬"
                placeholder="Ej. Rosa canina"
              />
              <InputText
                control={control}
                name="descripcion"
                label="Descripción"
                icon="📄"
                placeholder="Descripción de la planta..."
                inputProps={{ multiline: true, numberOfLines: 3 }}
              />
              <InputText
                control={control}
                name="cuidados.riego"
                label="Riego"
                icon="💧"
                placeholder="Ej. Cada 3 días"
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

              <TouchableOpacity
                style={[styles.saveBtn, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit(onSubmitEdit)}
                disabled={isSubmitting}
              >
                <Text style={styles.saveBtnText}>
                  {isSubmitting ? "⏳ Guardando..." : "💾 Guardar cambios"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.closeBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Modal>

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
  container: { flex: 1, backgroundColor: "#f0f7f4", paddingTop: 64 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statNum: { fontSize: 28, fontWeight: "800", color: "#2d6a4f" },
  statLabel: { fontSize: 12, color: "#74c69d", fontWeight: "600" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 64 },
  emptyText: {
    fontSize: 16,
    color: "#74c69d",
    textAlign: "center",
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  thumb: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: "700", color: "#1b4332" },
  cardSci: { fontSize: 13, fontStyle: "italic", color: "#74c69d" },
  cardDate: { fontSize: 12, color: "#aaa", marginTop: 2 },
  cardNotes: { fontSize: 12, color: "#52796f", marginTop: 4 },
  deleteBtn: { padding: 8 },
  modal: { flex: 1, backgroundColor: "#f0f7f4" },
  modalImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
  },
  modalName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1b4332",
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8f3dc",
    marginBottom: 12,
  },
  closeBtnText: { color: "#52796f", fontWeight: "600", fontSize: 15 },
});
