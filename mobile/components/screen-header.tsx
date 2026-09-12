import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";

type ScreenHeaderProps = { title: string; subtitle?: string; right?: React.ReactNode };

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" onPress={() => { haptic.light(); router.back(); }} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <MaterialIcons name="arrow-back" size={25} color={brand.text} />
      </Pressable>
      <View style={styles.titleArea}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={styles.back} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: 12, minHeight: 52 },
  back: { alignItems: "center", height: 42, justifyContent: "center", width: 42 },
  titleArea: { flex: 1 },
  title: { color: brand.text, fontSize: 19, fontWeight: "800" },
  subtitle: { color: brand.muted, fontSize: 13, marginTop: 2 },
  pressed: { opacity: 0.65 },
});
