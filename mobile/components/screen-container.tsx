import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { brand, ui } from "@/constants/brand";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /** Aplica o padding horizontal padrão (ui.screenPadding). Padrão: true. */
  padded?: boolean;
  /** Remove o fundo opaco (usado em telas que abrem como modal sobre outra). */
  transparent?: boolean;
}

/** Fundo da marca até a borda da tela, com o conteúdo dentro da área segura. */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  padded = true,
  transparent = false,
  style,
  ...props
}: ScreenContainerProps) {
  return (
    <View
      style={{ backgroundColor: transparent ? "transparent" : brand.background, flex: 1 }}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        style={[{ flex: 1 }, style]}
      >
        <View style={{ flex: 1, paddingHorizontal: padded ? ui.screenPadding : 0 }}>
          {children}
        </View>
      </SafeAreaView>
    </View>
  );
}
