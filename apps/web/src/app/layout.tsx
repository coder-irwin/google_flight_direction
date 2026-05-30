import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import MapProvider from "@/components/MapProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkyIntel — Aviation Intelligence & Real-Time Flight Platform",
  description:
    "AI-powered aviation intelligence platform with real-time flight tracking, geodesic route visualization, weather-aware routing, and Gemini AI insights. Powered by OpenSky Network, Google Maps Vector, and OpenWeatherMap.",
  keywords: [
    "flight tracking",
    "aviation intelligence",
    "real-time flights",
    "AI route optimization",
    "OpenSky Network",
    "Google Maps aviation",
    "flight route planner",
  ],
  authors: [{ name: "SkyIntel" }],
  openGraph: {
    title: "SkyIntel — Aviation Intelligence Platform",
    description:
      "Real-time global flight tracking and AI-powered route intelligence.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkyIntel — Aviation Intelligence Platform",
    description: "Real-time global flight tracking and AI-powered route intelligence.",
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f0c1a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <MapProvider>
          {children}
        </MapProvider>
      </body>
    </html>
  );
}
