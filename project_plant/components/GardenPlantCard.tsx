import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SavedPlant } from "../lib/plants";

interface GardenPlantCardProps {
  item: SavedPlant;
  index: number;
  onPress: () => void;
  onDelete: () => void;
  localUri?: string;
}

export default function GardenPlantCard({
  item,
  index,
  onPress,
  onDelete,
  localUri,
}: GardenPlantCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.plantCard}
      >
        <Image
          source={{ uri: localUri || item.imageUri }}
          style={styles.plantImage}
        />
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{item.nombreComun}</Text>
          <Text style={styles.plantScientific}>{item.nombreCientifico}</Text>
          <Text style={styles.plantDate}>
            {new Date(item.savedAt).toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
          {item.notes ? (
            <View style={styles.notesPreview}>
              <Text style={styles.notesPreviewText} numberOfLines={1}>
                {item.notes}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteIcon}>🗑️</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  plantCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  plantImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  plantInfo: {
    flex: 1,
    marginLeft: 14,
  },
  plantName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1b4332",
  },
  plantScientific: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#74c69d",
    marginTop: 2,
  },
  plantDate: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 4,
  },
  notesPreview: {
    backgroundColor: "#f0f7f4",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  notesPreviewText: {
    fontSize: 11,
    color: "#52796f",
  },
  deleteBtn: {
    padding: 10,
  },
  deleteIcon: {
    fontSize: 18,
  },
});
