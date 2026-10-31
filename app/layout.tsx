import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "API Health Engine: real-time uptime & latency monitoring",
    template: "%s · API Health Engine",
  },
  description: "Monitor your APIs in real time. Instant status, latency charts, uptime history and incident tracking.",
};

export const viewport: Viewport = { themeColor: "#060913", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="antialiased">
        <div className="aurora" aria-hidden />
        {children}
      </body>
    </html>
  );
}
