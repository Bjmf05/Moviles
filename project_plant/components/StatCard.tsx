import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
} from "react-native";

interface StatCardProps {
  value: number;
  label: string;
  color: string;
  delay: number;
}

export default function StatCard({ value, label, color, delay }: StatCardProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(numberAnim, {
      toValue: value,
      duration: 800,
      delay,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();

    numberAnim.addListener(({ value: v }) => {
      setDisplayValue(Math.round(v));
    });

    return () => numberAnim.removeAllListeners();
  }, [value]);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={[styles.statNumber, { color }]}>{displayValue}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    color: "#74c69d",
    fontWeight: "600",
    marginTop: 4,
  },
});
