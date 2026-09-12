import Animated from "react-native-reanimated";

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: 28,
        lineHeight: 32,
        marginTop: -6,
      }}
    >
      👋
    </Animated.Text>
  );
}
