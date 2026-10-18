// "Anilha" palette: rubber-floor graphite, chalk text, and competition bumper-plate
// colours. Plate colours always encode a training day (A red, B blue, C yellow, D green…),
// never decoration.
const palette = {
  background: "#1F2023",
  surface: "#27282C",
  surfaceElevated: "#303136",
  border: "#38393E",
  borderStrong: "#4A4B51",
  text: "#ECE9E2",
  muted: "#8C8F95",
  dim: "#62656B",
  accent: "#ECE9E2",
  accentPressed: "#CFCBC1",
  accentSoft: "#303136",
  accentText: "#ECE9E2",
  success: "#2F9E5B",
  successSoft: "#203329",
  danger: "#F0715F",
  dangerSoft: "#3A2624",
};

/** Competition bumper-plate colours, in session order. */
export const plates = [
  { color: "#D7362B", ink: "#FFF4EE" }, // A — 25 kg red
  { color: "#2F5FD0", ink: "#F1F4FF" }, // B — 20 kg blue
  { color: "#E7B422", ink: "#2A2205" }, // C — 15 kg yellow
  { color: "#2F9E5B", ink: "#F0FFF5" }, // D — 10 kg green
  { color: "#E6E3DC", ink: "#1F2023" }, // E — 5 kg white
  { color: "#6E7177", ink: "#F4F2EC" }, // F — change plates
];

export const plateFor = (index: number) => plates[index % plates.length];

export const fonts = {
  display: "BigShouldersDisplay_800ExtraBold",
  displayBlack: "BigShouldersDisplay_900Black",
  body: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
};

export const brand = {
  ...palette,
  // Legacy aliases
  surfaceCard: palette.surface,
  borderHighlight: palette.borderStrong,
  blue: palette.accent,
  blueLight: palette.accentText,
  blueGlow: palette.accent,
  blueSoft: palette.accentSoft,
  neonLime: palette.accent,
  violet: palette.accent,
};

export const ui = {
  radius: 14,
  radiusSm: 8,
  radiusLg: 20,
  screenPadding: 20,
  touchMinHeight: 48,
};
