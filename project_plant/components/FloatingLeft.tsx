import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const { height } = Dimensions.get("window");

export type FloatingLeafProps = {
  delay: number;
  startX: number;
  duration: number;
  size: number;
  rotation?: number;
  emoji?: string;
  style?: StyleProp<ViewStyle>;
};

function FloatingLeaf({
  delay,
  startX,
  duration,
  size,
  rotation = 360,
  emoji = "🍃",
  style,
}: FloatingLeafProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelled = false;

    const animate = () => {
      if (cancelled) return;

      translateY.setValue(-100);
      translateX.setValue(startX);
      rotate.setValue(0);
      opacity.setValue(0);

      animRef.current = Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 100,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: Math.max(0, duration - 2000),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateX, {
          toValue: startX + (Math.random() - 0.5) * 100,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: rotation,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);

      animRef.current.start(() => {
        if (!cancelled) animate();
      });
    };

    const timeout = setTimeout(animate, delay);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      animRef.current?.stop();
    };
  }, [
    delay,
    duration,
    rotation,
    startX,
    opacity,
    rotate,
    translateX,
    translateY,
  ]);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 360],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.leaf,
        style,
        {
          width: size,
          height: size,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.8 }}>{emoji}</Text>
    </Animated.View>
  );
}

export { FloatingLeaf };
export default FloatingLeaf;

const styles = StyleSheet.create({
  leaf: {
    position: "absolute",
    zIndex: 1,
  },
});
