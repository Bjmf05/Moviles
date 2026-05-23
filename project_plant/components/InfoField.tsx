import { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface InfoFieldProps {
  icon: string;
  label: string;
  value?: string;
  delay: number;
}

export default function InfoField({
  icon,
  label,
  value,
  delay,
}: InfoFieldProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.field,
        {
          opacity: fadeAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.fieldIconBg}>
        <Text style={styles.fieldIcon}>{icon}</Text>
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value ?? "—"}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  fieldIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#d8f3dc",
    justifyContent: "center",
    alignItems: "center",
  },
  fieldIcon: {
    fontSize: 20,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1b4332",
    fontWeight: "600",
    marginTop: 2,
  },
});
