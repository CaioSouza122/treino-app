import { ChakraPetch_600SemiBold, ChakraPetch_700Bold, useFonts } from "@expo-google-fonts/chakra-petch";
import { Stack, useRootNavigationState, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";
import { carregarPreferencias } from "@/lib/preferences";
import { getToken } from "@/lib/session";
import { acordarServidores } from "@/lib/workouts-api";

void SplashScreen.preventAutoHideAsync();
void carregarPreferencias();
// Os servidores do Render acordam enquanto o usuário faz login e navega até o Coach IA
acordarServidores();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ ChakraPetch_600SemiBold, ChakraPetch_700Bold });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  useGuardaDeRotas();

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ backgroundColor: brand.background, flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, animation: "fade", contentStyle: { backgroundColor: brand.background } }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="workout-detail" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="settings" options={{ animation: "slide_from_right" }} />
          <Stack.Screen name="profile" options={{ animation: "fade", contentStyle: { backgroundColor: "transparent" }, presentation: "transparentModal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Sem sessão, qualquer tela além do login volta para /login. /dev/* só existe em desenvolvimento. */
function useGuardaDeRotas() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const telaDeLogin = segments[0] === "login";
  // Antes do navegador montar (o layout espera as fontes), router.replace é ignorado
  const navegacaoPronta = !!useRootNavigationState()?.key;

  useEffect(() => {
    if (!navegacaoPronta) return;
    if (segments[0] === "dev" && !__DEV__) {
      router.replace("/");
      return;
    }
    if (telaDeLogin) return;
    getToken()
      .then((token) => {
        if (!token) router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [navegacaoPronta, router, segments, telaDeLogin]);
}
