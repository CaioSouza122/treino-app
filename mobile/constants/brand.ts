// Neutral dark palette with a single accent. Keep new UI on the semantic names
// (accent, surface, text, muted…); the legacy names below alias them.
const palette = {
  background: "#0B0B0E",
  surface: "#141418",
  surfaceElevated: "#1C1C22",
  border: "#25252C",
  borderStrong: "#33333B",
  text: "#F4F4F5",
  muted: "#A1A1AA",
  dim: "#6B6B76",
  accent: "#4F7CFF",
  accentPressed: "#3F68E0",
  accentSoft: "#1A2342",
  accentText: "#8CA8FF",
  success: "#22C55E",
  successSoft: "#12261A",
  danger: "#F05252",
  dangerSoft: "#2A1515",
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
  radius: 16,
  radiusSm: 10,
  radiusLg: 20,
  screenPadding: 20,
  touchMinHeight: 48,
};
