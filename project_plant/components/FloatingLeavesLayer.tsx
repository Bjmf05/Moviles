import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { FloatingLeaf } from "./FloatingLeft"; // o el nombre real del archivo

type Props = {
  count?: number;
  emojis?: string[];
  delayStep?: number;
  minDuration?: number;
  durationJitter?: number;
  minSize?: number;
  sizeJitter?: number;
};

export default function FloatingLeavesLayer({
  count = 6,
  emojis = ["🍃", "🌿", "🌱", "☘️", "🍀"],
  delayStep = 2000,
  minDuration = 10000,
  durationJitter = 5000,
  minSize = 18,
  sizeJitter = 16,
}: Props) {
  const { width } = useWindowDimensions();

  const leaves = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        delay: i * delayStep,
        startX: Math.random() * width,
        duration: minDuration + Math.random() * durationJitter,
        size: minSize + Math.random() * sizeJitter,
        rotation: 360 + Math.random() * 720,
        emoji: emojis[i % emojis.length],
      })),
    [
      count,
      delayStep,
      durationJitter,
      emojis,
      minDuration,
      minSize,
      sizeJitter,
      width,
    ],
  );

  return (
    <>
      {leaves.map((leaf) => (
        <FloatingLeaf key={leaf.id} {...leaf} />
      ))}
    </>
  );
}
