import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { brand, fonts } from "@/constants/brand";
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
      <Text style={[styles.label, labelStyles[variant]]}>{label}</Text>
    </Pressable>
  );
}

/** Icon colour that matches the label of each variant. */
export const buttonInk = {
  primary: brand.background,
  secondary: brand.text,
  accent: brand.text,
  ghost: brand.text,
};

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: brand.accentPressed },
  secondary: { backgroundColor: brand.surfaceElevated },
  accent: { opacity: 0.8 },
  ghost: { opacity: 0.6 },
});

const labelStyles = StyleSheet.create({
  primary: { color: buttonInk.primary },
  secondary: { color: buttonInk.secondary },
  accent: { color: buttonInk.accent },
  ghost: { color: buttonInk.ghost, textDecorationLine: "underline" },
});

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: 20,
  },
  primary: { backgroundColor: brand.accent },
  secondary: { backgroundColor: "transparent", borderColor: brand.borderStrong, borderWidth: 1.5 },
  accent: { backgroundColor: brand.surfaceElevated },
  ghost: { backgroundColor: "transparent" },
  label: { fontFamily: fonts.semibold, fontSize: 16 },
  disabled: { opacity: 0.45 },
});
