import { StyleSheet, Text, View } from "react-native";

import { brand, fonts, plates } from "@/constants/brand";

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  compact?: boolean;
};

/** Logo: a red 25 kg bumper plate seen face-on. */
export function BrandMark({ size = 48, withName = false, compact = false }: BrandMarkProps) {
  const hub = size * 0.36;
  const hole = size * 0.13;
  return (
    <View style={[styles.group, compact && styles.compactGroup]}>
      <View style={[styles.disc, { borderRadius: size / 2, borderWidth: Math.max(2, size * 0.05), height: size, width: size }]}>
        <View style={[styles.hub, { borderRadius: hub / 2, height: hub, width: hub }]}>
          <View style={[styles.hole, { borderRadius: hole / 2, height: hole, width: hole }]} />
        </View>
      </View>
      {withName ? <Text style={[styles.name, compact && styles.nameCompact]}>HipertrofIA</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: "center", flexDirection: "row", gap: 12 },
  compactGroup: { gap: 8 },
  disc: {
    alignItems: "center",
    backgroundColor: plates[0].color,
    borderColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
  },
  hub: { alignItems: "center", backgroundColor: "#B9BCC2", justifyContent: "center" },
  hole: { backgroundColor: brand.background },
  name: { color: brand.text, fontFamily: fonts.display, fontSize: 30, letterSpacing: 0.5 },
  nameCompact: { fontSize: 22 },
});
