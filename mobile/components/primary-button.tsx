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
        style,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {icon}
      <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 16,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: brand.blue,
    borderColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
  },
  secondary: {
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.borderHighlight,
    borderWidth: 1,
  },
  accent: {
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderColor: brand.blueGlow,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  label: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  primaryLabel: {
    color: brand.text,
  },
  secondaryLabel: {
    color: brand.text,
  },
  accentLabel: {
    color: brand.blueGlow,
  },
  ghostLabel: {
    color: brand.blueLight,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.4,
  },
});

