import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const POPULAR_PLANTS = [
  { id: "1", emoji: "🌵", name: "Cactus", sci: "Cactaceae", tag: "Resistente" },
  {
    id: "2",
    emoji: "🪴",
    name: "Pothos",
    sci: "Epipremnum aureum",
    tag: "Fácil de cuidar",
  },
  { id: "3", emoji: "🌹", name: "Rosa", sci: "Rosa", tag: "Ornamental" },
  {
    id: "4",
    emoji: "🌿",
    name: "Helecho",
    sci: "Polypodiopsida",
    tag: "Interior",
  },
  {
    id: "5",
    emoji: "🌻",
    name: "Girasol",
    sci: "Helianthus annuus",
    tag: "Exterior",
  },
  {
    id: "6",
    emoji: "🌱",
    name: "Albahaca",
    sci: "Ocimum basilicum",
    tag: "Aromática",
  },
  {
    id: "7",
    emoji: "🍃",
    name: "Monstera",
    sci: "Monstera deliciosa",
    tag: "Tendencia",
  },
  {
    id: "8",
    emoji: "🌸",
    name: "Orquídea",
    sci: "Orchidaceae",
    tag: "Delicada",
  },
];

export default function Explore() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Explorar</Text>
      <Text style={styles.subtitle}>Plantas populares</Text>
      <FlatList
        data={POPULAR_PLANTS}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sci}>{item.sci}</Text>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          </TouchableOpacity>
        )}
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
  },
  subtitle: {
    fontSize: 14,
    color: "#52796f",
    paddingHorizontal: 20,
    marginBottom: 4,
    marginTop: 4,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emoji: { fontSize: 44, marginBottom: 8 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
  },
  sci: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#74c69d",
    textAlign: "center",
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#d8f3dc",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  tagText: { fontSize: 11, color: "#2d6a4f", fontWeight: "600" },
});
