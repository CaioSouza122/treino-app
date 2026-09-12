import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { brand } from "@/constants/brand";
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
      <Text style={[styles.label, variant !== "primary" && styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: "center", borderRadius: 16, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 56, paddingHorizontal: 20 },
  primary: { backgroundColor: brand.blue },
  secondary: { backgroundColor: brand.surface, borderColor: brand.blue, borderWidth: 1 },
  ghost: { backgroundColor: "transparent" },
  label: { color: brand.text, fontSize: 16, fontWeight: "800" },
  secondaryLabel: { color: brand.blueLight },
  pressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  disabled: { opacity: 0.45 },
});
