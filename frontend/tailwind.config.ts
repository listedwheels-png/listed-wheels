import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      phone: "360px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },
    extend: {
      colors: {
        ink: {
          900: "#0F1B2D",
          700: "#2A3A52",
          500: "#5B6B82",
          200: "#D9DEE6",
        },
        paper: "#FAF8F4",
        surface: "#FFFFFF",
        accent: {
          500: "#F5A524",
          600: "#D98A0B",
        },
        success: "#1F9D6B",
        warning: "#C98A00",
        danger: "#C0392B",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-noto-devanagari)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-noto-devanagari)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,27,45,.06), 0 8px 24px rgba(15,27,45,.08)",
        "card-hover": "0 2px 4px rgba(15,27,45,.08), 0 12px 28px rgba(15,27,45,.12)",
      },
      borderRadius: {
        card: "12px",
        btn: "10px",
        input: "10px",
      },
      maxWidth: {
        content: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
