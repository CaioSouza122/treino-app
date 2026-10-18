/**
 * Identidade visual HIPERTROF.IA
 * Preto profundo + verde-lima (corpo / ação) + ciano (IA / circuito).
 * Regra de uso: lima = ação e progresso, ciano = tudo que é da IA.
 */
export const brand = {
  background: "#050607",
  surface: "#0B0D10",
  raised: "#12151A",
  border: "#1C2027",
  borderStrong: "#2B313B",

  text: "#F5F7FA",
  muted: "#8B94A1",
  dim: "#565E6B",

  lime: "#B4F72A",
  limeSoft: "#12190A",
  onLime: "#0A0F02",

  cyan: "#27D9E8",
  cyanSoft: "#08181B",

  danger: "#FF6B5E",
};

export const font = {
  display: "ChakraPetch_700Bold",
  displayMedium: "ChakraPetch_600SemiBold",
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
};

export const ui = {
  radius: radius.lg,
  screenPadding: 20,
  touchMinHeight: 48,
};

/** Estilos de texto reutilizáveis. */
export const type = {
  label: {
    color: brand.muted,
    fontFamily: font.displayMedium,
    fontSize: 10.5,
    letterSpacing: 1.8,
    textTransform: "uppercase" as const,
  },
  h1: {
    color: brand.text,
    fontFamily: font.display,
    fontSize: 30,
    letterSpacing: -0.3,
    lineHeight: 35,
  },
  h2: {
    color: brand.text,
    fontFamily: font.display,
    fontSize: 21,
    letterSpacing: -0.2,
    lineHeight: 26,
  },
  title: {
    color: brand.text,
    fontFamily: font.displayMedium,
    fontSize: 16,
    lineHeight: 21,
  },
  body: { color: brand.text, fontSize: 15, lineHeight: 22 },
  caption: { color: brand.muted, fontSize: 12.5, lineHeight: 18 },
};
