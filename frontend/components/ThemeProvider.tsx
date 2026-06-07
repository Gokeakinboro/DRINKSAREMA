"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const FONT_URLS: Record<string, string> = {
  inter: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
  "plus-jakarta": "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
  poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap",
  nunito: "https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap",
  lato: "https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap",
};

const FONT_NAMES: Record<string, string> = {
  inter: "Inter",
  "plus-jakarta": "Plus Jakarta Sans",
  poppins: "Poppins",
  nunito: "Nunito",
  lato: "Lato",
};

function hexToChannels(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6 * 360, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360; s /= 100; l /= 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const [r, g, b] = s === 0 ? [l, l, l] : [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)];
  return `#${[r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("")}`;
}

function shiftHex(hex: string, delta: number): string {
  try {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
  } catch {
    return hex;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: theme } = useQuery({
    queryKey: ["site-theme"],
    queryFn: () => api.get("/settings/theme").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!theme) return;
    const root = document.documentElement;

    root.style.setProperty("--brand-primary", hexToChannels(theme.brandColour));
    root.style.setProperty("--brand-dark", hexToChannels(shiftHex(theme.brandColour, -15)));
    root.style.setProperty("--brand-light", hexToChannels(shiftHex(theme.brandColour, 12)));
    root.style.setProperty("--accent", hexToChannels(theme.accentColour));
    root.style.setProperty("--accent-dark", hexToChannels(shiftHex(theme.accentColour, -15)));
    root.style.setProperty("--accent-light", hexToChannels(shiftHex(theme.accentColour, 12)));

    const fontKey = theme.fontFamily as string;
    const fontName = FONT_NAMES[fontKey] ?? "Inter";
    const fontUrl = FONT_URLS[fontKey];

    if (fontUrl && fontKey !== "inter") {
      let link = document.getElementById("da-theme-font") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.id = "da-theme-font";
        link.rel = "stylesheet";
        document.head.appendChild(link);
      }
      link.href = fontUrl;
    }
    root.style.setProperty("--font-body", `'${fontName}', system-ui, sans-serif`);
  }, [theme]);

  return <>{children}</>;
}
