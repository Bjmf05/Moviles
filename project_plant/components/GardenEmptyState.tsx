import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
} from "react-native";

export default function GardenEmptyState() {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.emptyContainer,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <Animated.Text
        style={[
          styles.emptyIcon,
          {
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        🌿
      </Animated.Text>
      <Text style={styles.emptyTitle}>Tu jardin esta vacio</Text>
      <Text style={styles.emptySubtitle}>
        Identifica una planta para empezar tu coleccion
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1b4332",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#74c69d",
    textAlign: "center",
    lineHeight: 22,
  },
});
