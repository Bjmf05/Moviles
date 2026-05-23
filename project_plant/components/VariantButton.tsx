import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface VariantButtonProps {
  onPress: () => void;
  label: string;
  variant?: "primary" | "secondary" | "danger";
  icon?: string;
}

export default function VariantButton({
  onPress,
  label,
  variant = "primary",
  icon,
}: VariantButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
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

  const getButtonStyle = () => {
    switch (variant) {
      case "danger":
        return styles.dangerBtn;
      case "secondary":
        return styles.secondaryBtn;
      default:
        return null;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case "danger":
        return styles.dangerBtnText;
      case "secondary":
        return styles.secondaryBtnText;
      default:
        return styles.primaryBtnText;
    }
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {variant === "primary" ? (
          <LinearGradient
            colors={["#2d6a4f", "#40916c"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            {icon && <Text style={styles.btnIcon}>{icon}</Text>}
            <Text style={getTextStyle()}>{label}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.btnBase, getButtonStyle()]}>
            {icon && <Text style={styles.btnIcon}>{icon}</Text>}
            <Text style={getTextStyle()}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#2d6a4f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: "#f0f7f4",
    borderWidth: 2,
    borderColor: "#d8f3dc",
  },
  dangerBtn: {
    backgroundColor: "#ffe5e5",
  },
  btnBase: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  btnIcon: {
    fontSize: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  secondaryBtnText: {
    color: "#2d6a4f",
    fontWeight: "700",
    fontSize: 15,
  },
  dangerBtnText: {
    color: "#e63946",
    fontWeight: "700",
    fontSize: 15,
  },
});
