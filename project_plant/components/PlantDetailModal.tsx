import { LinearGradient } from "expo-linear-gradient";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Plant } from "../lib/api";

interface Props {
  visible: boolean;
  plant: Plant | null;
  onClose: () => void;
}

export default function PlantDetailModal({ visible, plant, onClose }: Props) {
  if (!plant) return null;

  const formatFullDate = (isoDate: string) =>
    new Date(isoDate).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
          style={styles.gradient}
        />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {plant.imageUri ? (
            <Image source={{ uri: plant.imageUri }} style={styles.image} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderEmoji}>🌿</Text>
            </View>
          )}

          {/* Owner info */}
          {plant.ownerName ? (
            <View style={styles.ownerRow}>
              {plant.ownerPhoto ? (
                <Image
                  source={{ uri: plant.ownerPhoto }}
                  style={styles.ownerPhoto}
                />
              ) : (
                <View style={styles.ownerPhotoPlaceholder}>
                  <Text style={styles.ownerPhotoPlaceholderText}>
                    {plant.ownerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text style={styles.ownerName}>{plant.ownerName}</Text>
            </View>
          ) : null}

          <View style={styles.header}>
            <Text style={styles.title}>{plant.nombreComun}</Text>
            <Text style={styles.scientific}>{plant.nombreCientifico}</Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.description}>{plant.descripcion}</Text>
          </View>

          <Text style={styles.sectionTitle}>🌱 Cuidados</Text>

          <View style={styles.careCard}>
            {(
              [
                ["💧", "Riego", plant.cuidados.riego],
                ["☀️", "Luz", plant.cuidados.luz],
                ["🌡️", "Temperatura", plant.cuidados.temperatura],
              ] as const
            ).map(([icon, label, val]) => (
              <View key={label} style={styles.careRow}>
                <Text style={styles.careIcon}>{icon}</Text>
                <View style={styles.careInfo}>
                  <Text style={styles.careLabel}>{label}</Text>
                  <Text style={styles.careValue}>{val}</Text>
                </View>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.toxBox,
              plant.toxicidad.esToxica ? styles.toxic : styles.safe,
            ]}
          >
            <Text style={styles.toxTitle}>
              {plant.toxicidad.esToxica ? "⚠️ Tóxica" : "✅ No tóxica"}
            </Text>
            <Text style={styles.toxDetail}>{plant.toxicidad.detalle}</Text>
          </View>

          {plant.notes ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📝 Notas</Text>
              <Text style={styles.notesText}>{plant.notes}</Text>
            </View>
          ) : null}

          <Text style={styles.dateText}>
            Guardada el {formatFullDate(plant.savedAt)}
          </Text>

          <Pressable style={styles.closeBtn} onPress={onClose}>
            <LinearGradient
              colors={["#2d6a4f", "#40916c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.closeBtnGradient}
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
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
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: "#d8f3dc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 10,
  },
  ownerPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ownerPhotoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerPhotoPlaceholderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  ownerName: {
    fontSize: 14,
    color: "#52796f",
    fontWeight: "600",
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1b4332",
  },
  scientific: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#74c69d",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2d6a4f",
    marginBottom: 10,
  },
  careCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  careRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  careIcon: {
    fontSize: 22,
    marginTop: 2,
  },
  careInfo: {
    flex: 1,
  },
  careLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  careValue: {
    fontSize: 14,
    color: "#333",
  },
  toxBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  safe: {
    backgroundColor: "#d8f3dc",
  },
  toxic: {
    backgroundColor: "#ffe5e5",
  },
  toxTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginBottom: 4,
  },
  toxDetail: {
    fontSize: 13,
    color: "#555",
  },
  notesText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 22,
  },
  dateText: {
    fontSize: 12,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 16,
  },
  closeBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  closeBtnGradient: {
    padding: 18,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
