import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TimelineEntry } from "../lib/api";
import { formatFullDate } from "../lib/dateUtils";

interface GrowthTimelineProps {
  entries: TimelineEntry[];
  loading: boolean;
  localImages?: Record<string, string>;
  onAddPhoto: () => void;
  onDelete?: (entryId: string) => void;
}

export default function GrowthTimeline({
  entries,
  loading,
  localImages,
  onAddPhoto,
}: GrowthTimelineProps) {
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📷 Timeline de crecimiento</Text>
        <ActivityIndicator size="small" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📷 Timeline de crecimiento</Text>
        <Pressable style={styles.addBtn} onPress={onAddPhoto}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>
            Aún no hay fotos de progreso. ¡Agrega la primera!
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
        >
          {entries.map((entry) => (
            <View key={entry.id} style={styles.card}>
              <Image
                source={{ uri: localImages?.[entry.id] || entry.imageUrl }}
                style={styles.image}
              />
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>
                  {formatFullDate(entry.capturedAt)}
                </Text>
                {entry.caption ? (
                  <Text style={styles.cardCaption} numberOfLines={2}>
                    {entry.caption}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b4332",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2d6a4f",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 24,
  },
  scroll: {
    marginLeft: -4,
  },
  card: {
    width: 160,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: "cover",
  },
  cardFooter: {
    padding: 10,
  },
  cardDate: {
    fontSize: 11,
    color: "#74c69d",
    fontWeight: "600",
  },
  cardCaption: {
    fontSize: 13,
    color: "#1b4332",
    marginTop: 4,
    lineHeight: 17,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#f0f7f4",
    borderRadius: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#52796f",
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
