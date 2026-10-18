import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { brand, ui } from "@/constants/brand";
import { cn } from "@/lib/utils";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /** Aplica o padding horizontal padrão (ui.screenPadding). Padrão: true. */
  padded?: boolean;
  /** Remove o fundo opaco (usado em telas que abrem como modal sobre outra). */
  transparent?: boolean;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  padded = true,
  transparent = false,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View
      style={{ backgroundColor: transparent ? "transparent" : brand.background, flex: 1 }}
      className={cn("flex-1", containerClassName)}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={[{ flex: 1 }, style]}
      >
        <View className={cn("flex-1", className)} style={{ flex: 1, paddingHorizontal: padded ? ui.screenPadding : 0 }}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
