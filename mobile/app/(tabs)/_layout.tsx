import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand } from "@/constants/brand";

const tabs = [
  { name: "index", title: "Início", icon: "home-filled" },
  { name: "chat", title: "Chat", icon: "smart-toy" },
  { name: "plans", title: "Treinos", icon: "fitness-center" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: brand.blueLight, tabBarInactiveTintColor: brand.muted, tabBarStyle: [styles.tabBar, { height: 58 + bottom, paddingBottom: bottom }], tabBarLabelStyle: styles.label }}>
    {tabs.map((tab) => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color, focused }) => <View style={[styles.icon, focused && styles.iconActive]}><MaterialIcons name={tab.icon} color={color} size={22} /></View> }} />)}
  </Tabs>;
}

const styles = StyleSheet.create({ tabBar: { backgroundColor: "#0C0F15", borderTopColor: brand.border, paddingTop: 7 }, label: { fontSize: 11, fontWeight: "700" }, icon: { alignItems: "center", height: 28, justifyContent: "center", width: 38 }, iconActive: { backgroundColor: brand.blueSoft, borderRadius: 10 } });
