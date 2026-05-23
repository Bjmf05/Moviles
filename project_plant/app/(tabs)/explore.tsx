import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PlantDetailModal from "../../components/PlantDetailModal";
import { api, Plant } from "../../lib/api";

const { width } = Dimensions.get("window");

interface FilterChip {
  key: string;
  label: string;
  icon: string;
  type: "luz" | "riego" | "toxica";
  value: string;
}

const FILTERS: FilterChip[] = [
  { key: "sol", label: "Pleno sol", icon: "☀️", type: "luz", value: "sol" },
  { key: "sombra", label: "Sombra", icon: "🌥️", type: "luz", value: "sombra" },
  { key: "semisombra", label: "Semisombra", icon: "🌤️", type: "luz", value: "semisombra" },
  { key: "riego-frecuente", label: "Riego frecuente", icon: "💧", type: "riego", value: "frecuente" },
  { key: "riego-moderado", label: "Riego moderado", icon: "💧", type: "riego", value: "moderado" },
  { key: "riego-escaso", label: "Riego escaso", icon: "💧", type: "riego", value: "escaso" },
  { key: "toxica-si", label: "Tóxica", icon: "⚠️", type: "toxica", value: "true" },
  { key: "toxica-no", label: "No tóxica", icon: "✅", type: "toxica", value: "false" },
];

interface ActiveFilter {
  type: string;
  value: string;
}

const PlantCard = ({
  item,
  index,
  onPress,
}: {
  item: Plant;
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
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.cardPlaceholderEmoji}>🌿</Text>
          </View>
        )}
        <Text style={styles.plantName}>{item.nombreComun}</Text>
        <Text style={styles.plantSci}>{item.nombreCientifico}</Text>
        {item.ownerName ? (
          <View style={styles.ownerBadge}>
            {item.ownerPhoto ? (
              <Image
                source={{ uri: item.ownerPhoto }}
                style={styles.ownerBadgePhoto}
              />
            ) : (
              <View style={styles.ownerBadgeInitial}>
                <Text style={styles.ownerBadgeInitialText}>
                  {item.ownerName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.ownerBadgeText} numberOfLines={1}>
              {item.ownerName}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

const FilterChip = ({
  item,
  isActive,
  onPress,
  index: chipIndex,
}: {
  item: FilterChip;
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
      delay: chipIndex * 60,
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
        <Animated.View style={[styles.filterChip, { backgroundColor }]}>
          <Text style={styles.filterChipIcon}>{item.icon}</Text>
          <Animated.Text style={[styles.filterChipText, { color: textColor }]}>
            {item.label}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

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
        placeholder="Buscar plantas por nombre..."
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
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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

  const buildParams = useCallback(
    (cursorVal?: string | null) => {
      const params: {
        cursor?: string;
        limit?: number;
        search?: string;
        luz?: string;
        riego?: string;
        toxica?: string;
      } = { limit: 20 };

      if (cursorVal) params.cursor = cursorVal;
      if (search) params.search = search;

      for (const f of activeFilters) {
        if (f.type === "luz") params.luz = f.value;
        else if (f.type === "riego") params.riego = f.value;
        else if (f.type === "toxica") params.toxica = f.value;
      }

      return params;
    },
    [search, activeFilters],
  );

  const fetchPlants = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = buildParams(null);
        const result = await api.plants.explore(params);
        setPlants(result.plants);
        setHasMore(result.hasMore);
        setCursor(result.nextCursor);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "No se pudieron cargar las plantas",
        );
        setPlants([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [buildParams],
  );

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = buildParams(cursor);
      const result = await api.plants.explore(params);
      setPlants((prev) => [...prev, ...result.plants]);
      setHasMore(result.hasMore);
      setCursor(result.nextCursor);
    } catch {
      // ignore load more errors
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor, buildParams]);

  useEffect(() => {
    fetchPlants();
  }, [fetchPlants]);

  const handleRefresh = () => fetchPlants(true);

  const toggleFilter = (filter: FilterChip) => {
    setActiveFilters((prev) => {
      const existing = prev.find(
        (f) => f.type === filter.type && f.value === filter.value,
      );
      if (existing) {
        return prev.filter(
          (f) => !(f.type === filter.type && f.value === filter.value),
        );
      }
      // Remove other filters of same type
      return [...prev.filter((f) => f.type !== filter.type), { type: filter.type, value: filter.value }];
    });
  };

  const isFilterActive = (filter: FilterChip) =>
    activeFilters.some(
      (f) => f.type === filter.type && f.value === filter.value,
    );

  const handlePlantPress = (plant: Plant) => {
    setSelectedPlant(plant);
    setShowDetail(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#f0f7f4", "#e8f5e9", "#f0f7f4"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

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
        <Text style={styles.subtitle}>
          Descubre plantas de la comunidad
        </Text>
      </Animated.View>

      <View style={styles.searchWrapper}>
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <FilterChip
            item={item}
            isActive={isFilterActive(item)}
            onPress={() => toggleFilter(item)}
            index={index}
          />
        )}
      />

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2d6a4f" />
          <Text style={styles.loadingText}>Cargando plantas...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => fetchPlants()}>
            <Text style={styles.retryBtnText}>Intentar de nuevo</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#2d6a4f" />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>
                No se encontraron plantas públicas
              </Text>
              <Text style={styles.emptySubtext}>
                Intenta cambiar los filtros o la búsqueda
              </Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <PlantCard
              item={item}
              index={index}
              onPress={() => handlePlantPress(item)}
            />
          )}
        />
      )}

      <PlantDetailModal
        visible={showDetail}
        plant={selectedPlant}
        onClose={() => {
          setShowDetail(false);
          setSelectedPlant(null);
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
    marginBottom: 12,
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
  filtersContainer: {
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  filterChipIcon: {
    fontSize: 13,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 15,
    color: "#74c69d",
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: "#e63946",
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#2d6a4f",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
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
    padding: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardImagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 14,
    backgroundColor: "#d8f3dc",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardPlaceholderEmoji: {
    fontSize: 40,
  },
  plantName: {
    fontSize: 15,
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
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 4,
    backgroundColor: "#f0f7f4",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ownerBadgePhoto: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  ownerBadgeInitial: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerBadgeInitialText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  ownerBadgeText: {
    fontSize: 11,
    color: "#52796f",
    fontWeight: "600",
    maxWidth: 80,
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
    color: "#52796f",
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 13,
    color: "#74c69d",
    textAlign: "center",
    marginTop: 6,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
