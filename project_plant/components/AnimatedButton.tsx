import { useEffect, useRef } from "react";
import { Animated, Easing, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export type AnimatedButtonProps = {
  onPress: () => void;
  loading?: boolean;
  style?: any;
  textStyle?: any;
  children: React.ReactNode;
};

export default function AnimatedButton({
  onPress,
  loading,
  children,
  style,
  textStyle,
}: AnimatedButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [shimmer]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loading}
        style={[styles.btn, style]}
      >
        <LinearGradient
          colors={["#2d6a4f", "#40916c", "#2d6a4f"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.btnGradient}
        >
          <Text style={[styles.btnText, textStyle]}>{children}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  btn: {
    borderRadius: 16,
    overflow: "hidden",
  },

  btnGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    borderRadius: 16,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
