import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

const POPULAR_PLANTS = [
  {
    id: "1",
    emoji: "🌵",
    name: "Cactus",
    sci: "Cactaceae",
    tag: "Resistente",
    color: "#fff3e0",
  },
  {
    id: "2",
    emoji: "🪴",
    name: "Pothos",
    sci: "Epipremnum aureum",
    tag: "Facil de cuidar",
    color: "#d8f3dc",
  },
  {
    id: "3",
    emoji: "🌹",
    name: "Rosa",
    sci: "Rosa",
    tag: "Ornamental",
    color: "#ffe4e6",
  },
  {
    id: "4",
    emoji: "🌿",
    name: "Helecho",
    sci: "Polypodiopsida",
    tag: "Interior",
    color: "#d8f3dc",
  },
  {
    id: "5",
    emoji: "🌻",
    name: "Girasol",
    sci: "Helianthus annuus",
    tag: "Exterior",
    color: "#fef9c3",
  },
  {
    id: "6",
    emoji: "🌱",
    name: "Albahaca",
    sci: "Ocimum basilicum",
    tag: "Aromatica",
    color: "#d8f3dc",
  },
  {
    id: "7",
    emoji: "🍃",
    name: "Monstera",
    sci: "Monstera deliciosa",
    tag: "Tendencia",
    color: "#dcfce7",
  },
  {
    id: "8",
    emoji: "🌸",
    name: "Orquidea",
    sci: "Orchidaceae",
    tag: "Delicada",
    color: "#fce7f3",
  },
];

const CATEGORIES = [
  { id: "all", label: "Todas", icon: "🌿" },
  { id: "interior", label: "Interior", icon: "🏠" },
  { id: "exterior", label: "Exterior", icon: "☀️" },
  { id: "aromaticas", label: "Aromaticas", icon: "🌸" },
  { id: "cactus", label: "Cactus", icon: "🌵" },
];

// Tarjeta de planta animada
const PlantCard = ({
  item,
  index,
  onPress,
}: {
  item: (typeof POPULAR_PLANTS)[0];
  index: number;
  onPress: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        delay: index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(pressScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { scale: pressScale }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        <View style={[styles.emojiContainer, { backgroundColor: item.color }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
        <Text style={styles.plantName}>{item.name}</Text>
        <Text style={styles.plantSci}>{item.sci}</Text>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Chip de categoria animado
const CategoryChip = ({
  item,
  isActive,
  onPress,
  index,
}: {
  item: (typeof CATEGORIES)[0];
  isActive: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isActive]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#fff", "#2d6a4f"],
  });

  const textColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#52796f", "#fff"],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onPress}>
        <Animated.View style={[styles.chip, { backgroundColor }]}>
          <Text style={styles.chipIcon}>{item.icon}</Text>
          <Animated.Text style={[styles.chipText, { color: textColor }]}>
            {item.label}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Barra de busqueda animada
const SearchBar = ({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (text: string) => void;
}) => {
  const focusAnim = useRef(new Animated.Value(0)).current;
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(focusAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(focusAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#d8f3dc", "#2d6a4f"],
  });

  return (
    <Animated.View style={[styles.searchContainer, { borderColor }]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar plantas..."
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>✕</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

export default function Explore() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Animaciones de entrada
  const headerFade = useRef(new Animated.Value(0)).current;
  const headerSlide = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
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
  }, []);

  const filteredPlants = POPULAR_PLANTS.filter((plant) => {
    const matchesSearch =
      plant.name.toLowerCase().includes(search.toLowerCase()) ||
      plant.sci.toLowerCase().includes(search.toLowerCase());

    if (activeCategory === "all") return matchesSearch;

    const categoryMap: { [key: string]: string[] } = {
      interior: ["Pothos", "Helecho", "Monstera"],
      exterior: ["Girasol", "Rosa"],
      aromaticas: ["Albahaca", "Orquidea"],
      cactus: ["Cactus"],
    };

    return matchesSearch && categoryMap[activeCategory]?.includes(plant.name);
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
        <Text style={styles.title}>Explorar</Text>
        <Text style={styles.subtitle}>Descubre plantas populares</Text>
      </Animated.View>

      {/* Barra de busqueda */}
      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Categorias */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <CategoryChip
            item={item}
            isActive={activeCategory === item.id}
            onPress={() => setActiveCategory(item.id)}
            index={index}
          />
        )}
      />

      {/* Grid de plantas */}
      <FlatList
        data={filteredPlants}
        keyExtractor={(i) => i.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No se encontraron plantas</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <PlantCard
            item={item}
            index={index}
            onPress={() => {
              // Navegar a detalle de planta
            }}
          />
        )}
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
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(45, 106, 79, 0.06)",
  },
  decorCircle2: {
    position: "absolute",
    bottom: 200,
    left: -50,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(116, 198, 157, 0.08)",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 64,
    marginBottom: 16,
    zIndex: 2,
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
  searchWrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
    zIndex: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1b4332",
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    fontSize: 14,
    color: "#999",
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 12,
  },
  cardWrapper: {
    flex: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emojiContainer: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 36,
  },
  plantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
    textAlign: "center",
  },
  plantSci: {
    fontSize: 11,
    fontStyle: "italic",
    color: "#74c69d",
    textAlign: "center",
    marginTop: 2,
  },
  tag: {
    backgroundColor: "#d8f3dc",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 10,
  },
  tagText: {
    fontSize: 11,
    color: "#2d6a4f",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#74c69d",
  },
});
