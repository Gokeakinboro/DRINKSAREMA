import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AgeGate } from "@/components/AgeGate";

export const metadata: Metadata = {
  title: "DrinksArena — Nigeria's Premier Online Drinks Store",
  description: "Shop beer, wine, spirits, champagne and more. Fast delivery across Lagos, Abuja, Port Harcourt and Ibadan.",
  keywords: "buy alcohol online nigeria, drinks delivery lagos, beer wine spirits abuja",
  openGraph: {
    title: "DrinksArena",
    description: "Nigeria's Premier Online Drinks Store",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-surface-alt text-ink-primary antialiased">
        <Providers>
          <AgeGate />
          {children}
        </Providers>
      </body>
    </html>
  );
}
