import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { brand } from "@/constants/brand";
import { haptic } from "@/lib/haptics";

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "accent";
  style?: ViewStyle;
  disabled?: boolean;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  style,
  disabled = false,
}: PrimaryButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        style,
        disabled && styles.disabled,
      ]}
    >
      {icon}
      <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
    </Pressable>
  );
}

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: brand.accentPressed },
  secondary: { backgroundColor: brand.border },
  accent: { opacity: 0.8 },
  ghost: { opacity: 0.6 },
});

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: brand.accent },
  secondary: { backgroundColor: brand.surfaceElevated, borderColor: brand.border, borderWidth: 1 },
  accent: { backgroundColor: brand.accentSoft },
  ghost: { backgroundColor: "transparent" },
  label: { fontSize: 15, fontWeight: "600" },
  primaryLabel: { color: "#FFFFFF" },
  secondaryLabel: { color: brand.text },
  accentLabel: { color: brand.accentText },
  ghostLabel: { color: brand.accentText },
  disabled: { opacity: 0.45 },
});
