import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout-detail" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="profile" options={{ animation: "fade", contentStyle: { backgroundColor: "transparent" }, presentation: "transparentModal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
