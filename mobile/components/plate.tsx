import { StyleSheet, Text, View, type ViewStyle } from "react-native";

import { brand, fonts, plateFor } from "@/constants/brand";

type PlateProps = {
  /** Session index; picks the bumper-plate colour and letter. */
  index: number;
  size?: number;
  /** Small print along the bottom of the plate, where a real plate shows its weight. */
  caption?: string;
  /** Renders an empty outline plate instead of a filled one. */
  muted?: boolean;
  style?: ViewStyle;
};

/** A bumper plate seen face-on. Large plates get a hub and centre hole; small ones show only the letter. */
export function Plate({ index, size = 40, caption, muted = false, style }: PlateProps) {
  const plate = plateFor(index);
  const letter = String.fromCharCode(65 + index);
  const detailed = size >= 120;
  const hub = size * 0.26;
  const hole = size * 0.11;

  return (
    <View
      accessibilityLabel={`Treino ${letter}`}
      style={[
        styles.disc,
        {
          backgroundColor: muted ? "transparent" : plate.color,
          borderColor: muted ? brand.borderStrong : "rgba(0,0,0,0.22)",
          borderRadius: size / 2,
          borderWidth: detailed ? size * 0.035 : muted ? 1.5 : 0,
          height: size,
          width: size,
        },
        style,
      ]}
    >
      {detailed ? (
        <>
          {/* Inner lip of the rubber, a slightly darker ring */}
          <View
            style={[
              styles.ring,
              { borderRadius: size * 0.4, height: size * 0.8, width: size * 0.8 },
            ]}
          />
          {!muted && <Text
            style={[
              styles.letter,
              { color: plate.ink, fontSize: size * 0.22, lineHeight: size * 0.25, position: "absolute", top: size * 0.04 },
            ]}
          >
            {letter}
          </Text>}
          <View style={[styles.hub, { borderRadius: hub / 2, height: hub, width: hub }]}>
            <View style={[styles.hole, { borderRadius: hole / 2, height: hole, width: hole }]} />
          </View>
          {caption ? (
            <Text
              numberOfLines={1}
              style={[styles.caption, { color: plate.ink, bottom: size * 0.12, fontSize: size * 0.085 }]}
            >
              {caption}
            </Text>
          ) : null}
        </>
      ) : (
        <Text style={[styles.letter, { color: muted ? brand.muted : plate.ink, fontSize: size * 0.5, lineHeight: size * 0.6 }]}>
          {letter}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  disc: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  ring: { borderColor: "rgba(0,0,0,0.14)", borderWidth: 1.5, position: "absolute" },
  letter: { fontFamily: fonts.displayBlack, position: "relative" },
  hub: {
    alignItems: "center",
    backgroundColor: "#B9BCC2",
    borderColor: "#8E9197",
    borderWidth: 3,
    justifyContent: "center",
    position: "absolute",
  },
  hole: { backgroundColor: brand.background },
  caption: { fontFamily: fonts.display, letterSpacing: 1, position: "absolute" },
});
