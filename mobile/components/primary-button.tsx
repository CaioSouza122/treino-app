import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { brand, font, radius } from "@/constants/brand";
import { haptic } from "@/lib/haptics";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  style?: ViewStyle;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, icon, variant = "primary", style, disabled = false }: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => { haptic.light(); onPress(); }}
      style={({ pressed }) => [styles.base, styles[variant], style, disabled && styles.disabled, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[styles.label, variant === "primary" ? styles.primaryLabel : styles.otherLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", borderRadius: radius.md, flexDirection: "row", gap: 10, justifyContent: "center", minHeight: 54, paddingHorizontal: 20 },
  primary: { backgroundColor: brand.lime },
  secondary: { backgroundColor: "transparent", borderColor: brand.borderStrong, borderWidth: 1 },
  ghost: { backgroundColor: "transparent" },
  label: { fontFamily: font.display, fontSize: 14, letterSpacing: 1.2, textTransform: "uppercase" },
  primaryLabel: { color: brand.onLime },
  otherLabel: { color: brand.text },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.4 },
});
