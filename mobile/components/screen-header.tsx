import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { brand, fonts } from "@/constants/brand";
import { haptic } from "@/lib/haptics";

type ScreenHeaderProps = { title: string; subtitle?: string; right?: React.ReactNode };

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
        onPress={() => { haptic.light(); router.back(); }}
        style={({ pressed }) => [styles.side, pressed && styles.pressed]}
      >
        <MaterialIcons name="arrow-back" size={24} color={brand.text} />
      </Pressable>
      <View style={styles.titleArea}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ?? <View style={styles.side} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", flexDirection: "row", gap: 8, minHeight: 52 },
  side: { alignItems: "center", height: 40, justifyContent: "center", width: 40 },
  titleArea: { alignItems: "center", flex: 1 },
  title: { color: brand.text, fontFamily: fonts.semibold, fontSize: 16 },
  subtitle: { color: brand.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 1 },
  pressed: { opacity: 0.6 },
});
