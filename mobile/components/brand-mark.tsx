import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { brand } from "@/constants/brand";

type BrandMarkProps = {
  size?: number;
  withName?: boolean;
  compact?: boolean;
};

export function BrandMark({ size = 48, withName = false, compact = false }: BrandMarkProps) {
  return (
    <View style={[styles.group, compact && styles.compactGroup]}>
      <View style={[styles.mark, { height: size, width: size, borderRadius: size * 0.3 }]}>
        <MaterialIcons name="bolt" color="#FFFFFF" size={Math.round(size * 0.55)} />
      </View>
      {withName ? <Text style={[styles.name, compact && styles.nameCompact]}>HipertrofIA</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { alignItems: "center", flexDirection: "row", gap: 12 },
  compactGroup: { gap: 8 },
  mark: { alignItems: "center", backgroundColor: brand.accent, justifyContent: "center" },
  name: { color: brand.text, fontSize: 22, fontWeight: "700", letterSpacing: -0.4 },
  nameCompact: { fontSize: 17 },
});
