import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { brand } from "@/constants/brand";

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  compact?: boolean;
};

export function BrandMark({ size = 48, withName = false, compact = false }: BrandMarkProps) {
  const glyph = Math.max(19, Math.round(size * 0.47));
  return (
    <View style={[styles.group, compact && styles.compactGroup]}>
      <View style={[styles.mark, { height: size, width: size, borderRadius: size * 0.28 }]}>
        <MaterialIcons name="fitness-center" color={brand.text} size={glyph} />
        <View style={styles.aiChip}><Text style={[styles.ai, { fontSize: Math.max(8, size * 0.18) }]}>IA</Text></View>
      </View>
      {withName ? (
        <View>
          <Text style={styles.name}>HIPERTROF<Text style={styles.nameAccent}>.IA</Text></Text>
          {!compact && <Text style={styles.tagline}>TREINO INTELIGENTE</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: "center", flexDirection: "row", gap: 12 },
  compactGroup: { gap: 8 },
  mark: { alignItems: "center", backgroundColor: "#101F3D", borderColor: brand.blue, borderWidth: 1.5, justifyContent: "center", overflow: "hidden" },
  aiChip: { alignItems: "center", backgroundColor: brand.blue, borderRadius: 6, bottom: 4, justifyContent: "center", minHeight: 15, minWidth: 20, paddingHorizontal: 3, position: "absolute", right: 4 },
  ai: { color: brand.text, fontWeight: "900", letterSpacing: -0.4 },
  name: { color: brand.text, fontSize: 18, fontStyle: "italic", fontWeight: "900", letterSpacing: -0.65 },
  nameAccent: { color: brand.blueLight },
  tagline: { color: brand.muted, fontSize: 8, fontWeight: "700", letterSpacing: 1.4, marginTop: 2 },
});
