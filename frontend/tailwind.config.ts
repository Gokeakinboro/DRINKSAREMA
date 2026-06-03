import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1A4731",
          dark: "#0F2D1F",
          light: "#23603F",
        },
        accent: {
          DEFAULT: "#C9A227",
          dark: "#A8831E",
          light: "#D4B83A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F4F7F4",
        },
        ink: {
          primary: "#1A1A1A",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },
        success: "#16A34A",
        error: "#DC2626",
        warning: "#D97706",
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 8px 25px rgba(26,71,49,0.15)",
      },
    },
  },
  plugins: [],
};
export default config;
