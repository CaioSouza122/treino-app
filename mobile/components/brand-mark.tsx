import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Path, Circle } from "react-native-svg";

import { brand, font } from "@/constants/brand";

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
};

/**
 * Marca: um "H" cujas hastes são dois músculos (fibras) e cuja barra central
 * é uma linha de gráfico em ascensão — evolução de carga ao longo do tempo.
 * A mesma geometria gera o ícone do app em scripts/generate-icons.py.
 */
const MUSCLE = "M15 3 C1 19 1 45 15 61 C27 45 27 19 15 3 Z";
const FIBERS = "M12 13 C8 26 8 40 12 52 M17 16 C15 28 15 40 16 50";
const CHART = "M18 47 L27 39 L32 43 L40 31 L48 24 L54 12";

export function BrandMark({ size = 40, withName = false }: BrandMarkProps) {
  return (
    <View style={styles.group}>
      <Svg width={size} height={size} viewBox="0 0 64 64">
        {/* Músculo esquerdo e direito (espelhado) */}
        {[false, true].map((mirrored) => (
          <G key={String(mirrored)} transform={mirrored ? "translate(64 0) scale(-1 1)" : undefined}>
            <Path d={MUSCLE} fill={brand.lime} />
            <Path d={FIBERS} stroke={brand.background} strokeWidth={1.3} strokeLinecap="round" fill="none" opacity={0.55} />
          </G>
        ))}
        {/* Linha de gráfico: contorno escuro para destacar sobre os músculos */}
        <Path d={CHART} stroke={brand.background} strokeWidth={4.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Path d={CHART} stroke={brand.cyan} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={27} cy={39} r={2.2} fill={brand.background} stroke={brand.cyan} strokeWidth={1.6} />
        <Circle cx={40} cy={31} r={2.2} fill={brand.background} stroke={brand.cyan} strokeWidth={1.6} />
        <Circle cx={54} cy={12} r={3.2} fill={brand.cyan} />
      </Svg>
      {withName ? <Wordmark size={Math.round(size * 0.42)} /> : null}
    </View>
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <Text style={[styles.name, { fontSize: size, lineHeight: size * 1.2 }]}>
      Hipertrof<Text style={styles.accent}>.IA</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: "center", flexDirection: "row", gap: 10 },
  name: { color: brand.text, fontFamily: font.display, letterSpacing: -0.4 },
  accent: { color: brand.cyan },
});
