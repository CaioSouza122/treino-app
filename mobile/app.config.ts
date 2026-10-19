import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "HIPERTROF.IA",
  slug: "hipertrof-ia-app",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "hipertrofia",
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.app.hipertrofiaapp",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#050607",
      foregroundImage: "./assets/images/android-icon-foreground.png",
    },
    package: "com.app.hipertrofiaapp",
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#050607",
        dark: {
          backgroundColor: "#050607",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  // Projeto no EAS (expo.dev) usado para gerar o APK/AAB — não é segredo
  owner: "caio_00",
  extra: {
    eas: { projectId: "346a60ab-faf6-4e9c-abb4-16d5ef0b743d" },
  },
};

export default config;
