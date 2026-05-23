import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import FloatingLeavesLayer from "@/components/FloatingLeavesLayer";
import QuickStats from "@/components/QuickStats";

const { width, height } = Dimensions.get("window");

// Tarjeta animada con efecto press
const AnimatedCard = ({
  onPress,
  children,
  style,
  gradient,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  gradient?: boolean;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], ...style }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {gradient ? (
          <LinearGradient
            colors={["#2d6a4f", "#40916c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {children}
          </LinearGradient>
        ) : (
          children
        )}
      </Pressable>
    </Animated.View>
  );
};

// Tip del dia con animacion
const DailyTip = () => {
  const tips = [
    { icon: "💧", tip: "Riega tus plantas por la manana para evitar hongos" },
    { icon: "☀️", tip: "La luz indirecta es ideal para la mayoria de plantas" },
    { icon: "🌡️", tip: "Evita cambios bruscos de temperatura en tus plantas" },
    {
      icon: "🪴",
      tip: "Rota tus plantas cada semana para un crecimiento uniforme",
    },
    {
      icon: "🌿",
      tip: "Limpia las hojas regularmente para mejor fotosintesis",
    },
  ];

  const todayTip = tips[new Date().getDay() % tips.length];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      delay: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.tipContainer, { opacity: fadeAnim }]}>
      <View style={styles.tipHeader}>
        <Text style={styles.tipIcon}>{todayTip.icon}</Text>
        <Text style={styles.tipLabel}>Tip del dia</Text>
      </View>
      <Text style={styles.tipText}>{todayTip.tip}</Text>
    </Animated.View>
  );
};

export default function Home() {
  const { user } = useAuth();
  const name = user?.name?.split(" ")[0] ?? "Explorador";

  // Animaciones de entrada
  const greetingFade = useRef(new Animated.Value(0)).current;
  const greetingSlide = useRef(new Animated.Value(-20)).current;
  const heroFade = useRef(new Animated.Value(0)).current;
  const heroScale = useRef(new Animated.Value(0.95)).current;
  const cardsFade = useRef(new Animated.Value(0)).current;
  const cardsSlide = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(greetingFade, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(greetingSlide, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(heroFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(heroScale, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(cardsFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(cardsSlide, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Fondo con gradiente suave */}
      <LinearGradient
        colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Hojas flotantes sutiles */}
      <FloatingLeavesLayer count={6} />

      {/* Circulos decorativos */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Saludo animado */}
        <Animated.View
          style={[
            styles.greetingContainer,
            {
              opacity: greetingFade,
              transform: [{ translateY: greetingSlide }],
            },
          ]}
        >
          <Text style={styles.greeting}>Hola, {name}</Text>
          <Text style={styles.subtitle}>
            Que planta quieres identificar hoy?
          </Text>
        </Animated.View>

        {/* Hero card - Identificar planta */}
        <Animated.View
          style={{
            opacity: heroFade,
            transform: [{ scale: heroScale }],
          }}
        >
          <AnimatedCard onPress={() => router.push("/(tabs)/camera")} gradient>
            <View style={styles.heroIconContainer}>
              <Text style={styles.heroIcon}>📷</Text>
            </View>
            <Text style={styles.heroTitle}>Identificar planta</Text>
            <Text style={styles.heroSubtitle}>
              Toma una foto o elige de tu galeria
            </Text>
            <View style={styles.heroArrow}>
              <Text style={styles.heroArrowText}>→</Text>
            </View>
          </AnimatedCard>
        </Animated.View>

        {/* Cards secundarias */}
        <Animated.View
          style={[
            styles.cardsRow,
            {
              opacity: cardsFade,
              transform: [{ translateY: cardsSlide }],
            },
          ]}
        >
          <AnimatedCard
            onPress={() => router.push("/(tabs)/garden")}
            style={styles.cardWrapper}
          >
            <View style={styles.card}>
              <View style={styles.cardIconBg}>
                <Text style={styles.cardIcon}>🌱</Text>
              </View>
              <Text style={styles.cardTitle}>Mi Jardin</Text>
              <Text style={styles.cardSubtitle}>Ver mis plantas</Text>
            </View>
          </AnimatedCard>

          <AnimatedCard
            onPress={() => router.push("/(tabs)/explore")}
            style={styles.cardWrapper}
          >
            <View style={styles.card}>
              <View style={[styles.cardIconBg, { backgroundColor: "#fff3e0" }]}>
                <Text style={styles.cardIcon}>🔍</Text>
              </View>
              <Text style={styles.cardTitle}>Explorar</Text>
              <Text style={styles.cardSubtitle}>Plantas populares</Text>
            </View>
          </AnimatedCard>
        </Animated.View>

        {/* Tip del dia */}
        <DailyTip />

        {/* Estadisticas rapidas */}
        <QuickStats />
      </ScrollView>
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
    top: -60,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(45, 106, 79, 0.06)",
  },
  decorCircle2: {
    position: "absolute",
    top: height * 0.4,
    left: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(116, 198, 157, 0.08)",
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 100,
  },
  greetingContainer: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1b4332",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#52796f",
    marginTop: 4,
  },
  heroCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 20,
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 32,
  },
  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  heroSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
  },
  heroArrow: {
    position: "absolute",
    right: 24,
    top: "50%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroArrowText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 20,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#d8f3dc",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 28,
  },
  cardTitle: {
    fontWeight: "700",
    color: "#1b4332",
    fontSize: 16,
  },
  cardSubtitle: {
    color: "#74c69d",
    fontSize: 13,
    marginTop: 2,
  },
  tipContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#40916c",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 20,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#40916c",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 15,
    color: "#1b4332",
    lineHeight: 22,
  },
});
