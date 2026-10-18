const { themeColors } = require("./theme.config");
const plugin = require("tailwindcss/plugin");

const tailwindColors = Object.fromEntries(
  Object.entries(themeColors).map(([name, swatch]) => [
    name,
    {
      DEFAULT: `var(--color-${name})`,
      light: swatch.light,
      dark: swatch.dark,
    },
  ]),
);

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  // Scan all component and app files for Tailwind classes
  content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}", "./lib/**/*.{js,ts,tsx}", "./hooks/**/*.{js,ts,tsx}"],

  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: tailwindColors,
      fontFamily: {
        display: ["BigShouldersDisplay_800ExtraBold"],
        body: ["Barlow_400Regular"],
        medium: ["Barlow_500Medium"],
        semibold: ["Barlow_600SemiBold"],
      },
      borderRadius: {
        card: "14px",
        "card-sm": "8px",
        "card-lg": "20px",
      },
      boxShadow: {
        card: "0 6px 16px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant, addBase }) => {
      addVariant("light", ':root:not([data-theme="dark"]) &');
      addVariant("dark", ':root[data-theme="dark"] &');
      addBase({
        ":root": Object.fromEntries(
          Object.entries(themeColors).map(([name, swatch]) => [
            `--color-${name}`,
            swatch.dark,
          ]),
        ),
      });
    }),
  ],
};
