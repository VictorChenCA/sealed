import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        bg: "hsl(240 10% 4%)",
        panel: "hsl(240 6% 9%)",
        "panel-2": "hsl(240 6% 12%)",
        border: "hsl(240 5% 18%)",
        text: "hsl(0 0% 95%)",
        dim: "hsl(240 3% 60%)",
        accent: {
          DEFAULT: "hsl(258 90% 66%)",
          fg: "hsl(0 0% 100%)",
        },
        good: "hsl(141 71% 60%)",
        bad: "hsl(0 84% 67%)",
        warn: "hsl(38 92% 60%)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
