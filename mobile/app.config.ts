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
      backgroundColor: "#08090D",
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
        backgroundColor: "#08090D",
        dark: {
          backgroundColor: "#08090D",
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
};

export default config;
