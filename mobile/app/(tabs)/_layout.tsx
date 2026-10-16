import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";

const tabs = [
  { name: "index", title: "Início", icon: "home-filled" },
  { name: "chat", title: "Coach", icon: "chat-bubble-outline" },
  { name: "plans", title: "Treinos", icon: "format-list-bulleted" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 8 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.text,
        tabBarInactiveTintColor: brand.dim,
        tabBarStyle: [styles.tabBar, { height: 62 + bottom, paddingBottom: bottom, paddingTop: 6 }],
        tabBarLabelStyle: styles.label,
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color }) => <MaterialIcons name={tab.icon} color={color} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: brand.background,
    borderTopColor: brand.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: 11, fontWeight: "500" },
});
