import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { brand, font } from "@/constants/brand";

const tabs = [
  { name: "index", title: "Hoje", icon: "bolt" },
  { name: "chat", title: "IA", icon: "auto-awesome" },
  { name: "plans", title: "Treinos", icon: "fitness-center" },
] as const;

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 10);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: brand.background },
        tabBarActiveTintColor: brand.lime,
        tabBarInactiveTintColor: brand.dim,
        tabBarStyle: [styles.tabBar, { height: 54 + bottom, paddingBottom: bottom }],
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
              <View style={styles.iconWrap}>
                <View style={[styles.indicator, focused && styles.indicatorOn]} />
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
  tabBar: { backgroundColor: brand.background, borderTopColor: brand.border, borderTopWidth: 1, paddingTop: 6 },
  label: { fontFamily: font.displayMedium, fontSize: 9.5, letterSpacing: 1.4, textTransform: "uppercase" },
  iconWrap: { alignItems: "center", height: 30, justifyContent: "flex-end", width: 38 },
  indicator: { backgroundColor: "transparent", borderRadius: 1, height: 2, position: "absolute", top: -7, width: 18 },
  indicatorOn: { backgroundColor: brand.lime },
});
