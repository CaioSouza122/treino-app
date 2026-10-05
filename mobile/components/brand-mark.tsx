import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { brand } from "@/constants/brand";

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  compact?: boolean;
};

export function BrandMark({ size = 48, withName = false, compact = false }: BrandMarkProps) {
  const glyph = Math.max(18, Math.round(size * 0.44));
  return (
    <View style={[styles.group, compact && styles.compactGroup]}>
      <View style={[styles.markOuter, { height: size, width: size, borderRadius: size * 0.32 }]}>
        <View style={[styles.markInner, { borderRadius: size * 0.28 }]}>
          <MaterialIcons name="bolt" color={brand.blueGlow} size={glyph} />
          <View style={styles.aiBadge}>
            <Text style={[styles.aiText, { fontSize: Math.max(7, size * 0.17) }]}>PRO</Text>
          </View>
        </View>
      </View>
      {withName ? (
        <View>
          <Text style={styles.name}>
            HIPERTROF<Text style={styles.nameAccent}>.IA</Text>
          </Text>
          {!compact && <Text style={styles.tagline}>INTELLIGENT ATHLETIC ENGINE</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: "center", flexDirection: "row", gap: 12 },
  compactGroup: { gap: 8 },
  markOuter: {
    alignItems: "center",
    backgroundColor: "rgba(0, 240, 255, 0.12)",
    borderColor: "rgba(0, 240, 255, 0.35)",
    borderWidth: 1.5,
    justifyContent: "center",
    padding: 2,
  },
  markInner: {
    alignItems: "center",
    backgroundColor: brand.surfaceElevated,
    borderColor: brand.border,
    borderWidth: 1,
    flex: 1,
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
    width: "100%",
  },
  aiBadge: {
    alignItems: "center",
    backgroundColor: brand.blue,
    borderRadius: 4,
    bottom: 2,
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 1,
    position: "absolute",
    right: 2,
  },
  aiText: {
    color: brand.text,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  name: {
    color: brand.text,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  nameAccent: {
    color: brand.blueGlow,
  },
  tagline: {
    color: brand.muted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 2,
  },
});

