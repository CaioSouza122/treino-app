import { ReactNode } from "react";
import Animated, { FadeInDown, ReduceMotion } from "react-native-reanimated";

type EntranceProps = { children: ReactNode; delay?: number };

export function Entrance({ children, delay = 0 }: EntranceProps) {
  return <Animated.View entering={FadeInDown.delay(delay).duration(240).reduceMotion(ReduceMotion.System)}>{children}</Animated.View>;
}
