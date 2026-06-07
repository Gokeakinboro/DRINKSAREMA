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
          primary: "rgb(var(--brand-primary) / <alpha-value>)",
          dark: "rgb(var(--brand-dark) / <alpha-value>)",
          light: "rgb(var(--brand-light) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          dark: "rgb(var(--accent-dark) / <alpha-value>)",
          light: "rgb(var(--accent-light) / <alpha-value>)",
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
