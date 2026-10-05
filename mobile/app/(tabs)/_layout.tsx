import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";

const tabs = [
  { name: "index", title: "Painel", icon: "dashboard" },
  { name: "chat", title: "Coach IA", icon: "psychology" },
  { name: "plans", title: "Biblioteca", icon: "view-list" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.blueGlow,
        tabBarInactiveTintColor: brand.dim,
        tabBarStyle: [
          styles.tabBar,
          { height: 60 + bottom, paddingBottom: bottom, paddingTop: 8 },
        ],
        tabBarLabelStyle: styles.label,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <MaterialIcons name={tab.icon} color={color} size={22} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0A0D14",
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 12,
    height: 32,
    justifyContent: "center",
    width: 44,
  },
  iconActive: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderColor: "rgba(0, 240, 255, 0.3)",
    borderWidth: 1,
  },
});

