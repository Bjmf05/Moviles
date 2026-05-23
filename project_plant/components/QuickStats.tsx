import { useCallback, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { usePlants } from "@/lib/plants";

export default function QuickStats() {
  const { token } = useAuth();
  const { getUserPlants } = usePlants();
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const animated = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!token) {
        setLoading(false);
        return;
      }
      let active = true;
      setLoading(true);
      getUserPlants()
        .then((result) => {
          if (!active) return;
          setPlants(result.plants);
          setLoading(false);
          if (!animated.current) {
            animated.current = true;
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 600,
              delay: 300,
              useNativeDriver: true,
            }).start();
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [token])
  );

  if (!token) return null;

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.title}>Resumen rápido</Text>
        <View style={styles.grid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, styles.skeleton]} />
          ))}
        </View>
      </View>
    );
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const total = plants.length;
  const toxic = plants.filter((p) => p.toxicidad.esToxica).length;
  const nonToxic = total - toxic;
  const needsWater = plants.filter((p) => {
    const s = (p as any).wateringSchedule;
    if (!s?.nextWateringDate) return false;
    return new Date(s.nextWateringDate) <= today;
  }).length;

  if (total === 0) {
    return (
      <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Resumen rápido</Text>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🪴</Text>
          <Text style={styles.emptyText}>Aún no tienes plantas</Text>
          <Pressable
            style={styles.emptyBtn}
            onPress={() => router.push("/(tabs)/camera")}
          >
            <Text style={styles.emptyBtnText}>Identificar primera planta</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  }

  const stats = [
    { icon: "🌱", label: "Total", value: total, color: "#2d6a4f", bg: "#d8f3dc" },
    { icon: "✅", label: "No tóxicas", value: nonToxic, color: "#40916c", bg: "#e8f5e9" },
    { icon: "⚠️", label: "Tóxicas", value: toxic, color: "#e63946", bg: "#fce4ec" },
    { icon: "💧", label: "Por regar", value: needsWater, color: "#1e88e5", bg: "#e3f2fd" },
  ];

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <Text style={styles.title}>Resumen rápido</Text>
      <View style={styles.grid}>
        {stats.map((s) => (
          <View key={s.label} style={styles.card}>
            <View style={[styles.iconBg, { backgroundColor: s.bg }]}>
              <Text style={styles.icon}>{s.icon}</Text>
            </View>
            <Text style={[styles.number, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  skeleton: {
    height: 110,
    opacity: 0.5,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
  },
  number: {
    fontSize: 28,
    fontWeight: "800",
  },
  label: {
    fontSize: 12,
    color: "#52796f",
    fontWeight: "600",
    marginTop: 2,
  },
  empty: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#52796f",
    fontWeight: "600",
    marginBottom: 16,
  },
  emptyBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
});
