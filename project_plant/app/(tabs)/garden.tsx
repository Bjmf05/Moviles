import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  deletePlant,
  getUserPlants,
  SavedPlant,
  updatePlantNotes,
} from "../../lib/plants";

export default function Garden() {
  const { user } = useAuth();
  const [plants, setPlants] = useState<SavedPlant[]>([]);
  const [selected, setSelected] = useState<SavedPlant | null>(null);
  const [notes, setNotes] = useState("");

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

  const handleSaveNotes = async () => {
    if (!selected?.id) return;
    await updatePlantNotes(selected.id, notes);
    setSelected(null);
    load();
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
              <Text style={styles.modalName}>{selected.nombreComun}</Text>
              <Text style={styles.modalSci}>{selected.nombreCientifico}</Text>
              <Text style={styles.modalDesc}>{selected.descripcion}</Text>
              <Text style={styles.modalSection}>📝 Mis notas</Text>
              <TextInput
                style={styles.notesInput}
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="Escribe tus notas..."
              />
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveNotes}
              >
                <Text style={styles.saveBtnText}>Guardar notas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSelected(null)}
              >
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Modal>
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
  modalName: { fontSize: 26, fontWeight: "800", color: "#1b4332" },
  modalSci: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#74c69d",
    marginBottom: 8,
  },
  modalDesc: { fontSize: 14, color: "#555", lineHeight: 22, marginBottom: 16 },
  modalSection: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d6a4f",
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  saveBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d8f3dc",
  },
  closeBtnText: { color: "#52796f", fontWeight: "600", fontSize: 15 },
});
