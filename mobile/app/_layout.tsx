import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
} from "@expo-google-fonts/barlow";
import {
  BigShouldersDisplay_800ExtraBold,
  BigShouldersDisplay_900Black,
} from "@expo-google-fonts/big-shoulders-display";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    BigShouldersDisplay_800ExtraBold,
    BigShouldersDisplay_900Black,
  });

  // Render nothing but the background until fonts are ready, so text never flashes in the system font.
  if (!fontsLoaded && !fontError) return <View style={{ backgroundColor: brand.background, flex: 1 }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: brand.background } }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout-detail" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="profile" options={{ animation: "slide_from_right" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
