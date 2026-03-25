import { router } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  const name = user?.displayName?.split(" ")[0] ?? "Explorador";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Hola, {name} 👋</Text>
      <Text style={styles.subtitle}>¿Qué planta quieres identificar hoy?</Text>

      <TouchableOpacity
        style={styles.heroBtn}
        onPress={() => router.push("/(tabs)/camera")}
      >
        <Text style={styles.heroBtnIcon}>📷</Text>
        <Text style={styles.heroBtnTitle}>Identificar planta</Text>
        <Text style={styles.heroBtnSub}>
          Toma una foto o elige de tu galería
        </Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/garden")}
        >
          <Text style={styles.cardIcon}>🌱</Text>
          <Text style={styles.cardTitle}>Mi Jardín</Text>
          <Text style={styles.cardSub}>Ver mis plantas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/(tabs)/explore")}
        >
          <Text style={styles.cardIcon}>🔍</Text>
          <Text style={styles.cardTitle}>Explorar</Text>
          <Text style={styles.cardSub}>Plantas populares</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f7f4" },
  content: { padding: 24, paddingTop: 64 },
  greeting: { fontSize: 28, fontWeight: "800", color: "#1b4332" },
  subtitle: { fontSize: 15, color: "#52796f", marginBottom: 28, marginTop: 4 },
  heroBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  heroBtnIcon: { fontSize: 48, marginBottom: 8 },
  heroBtnTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  heroBtnSub: { color: "#95d5b2", fontSize: 13, marginTop: 4 },
  row: { flexDirection: "row", gap: 12 },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: { fontSize: 32, marginBottom: 8 },
  cardTitle: { fontWeight: "700", color: "#1b4332", fontSize: 15 },
  cardSub: { color: "#74c69d", fontSize: 12, marginTop: 2 },
});
