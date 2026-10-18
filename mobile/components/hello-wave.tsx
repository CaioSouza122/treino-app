import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import Animated from "react-native-reanimated";
import { brand } from "@/constants/brand";

export function HelloWave() {
  return (
    <Animated.View style={{ marginTop: -2 }}>
      <MaterialIcons name="waving-hand" size={24} color={brand.blueLight} />
    </Animated.View>
  );
}

