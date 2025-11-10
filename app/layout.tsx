// app/layout.tsx

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "./providers/SettingsContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Estonian ASR",
    template: "%s | Estonian ASR",
  },
  description:
    "Free Estonian speech-to-text and Estonian→English live captions. No login required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className={inter.className}>
        <SettingsProvider>{children}</SettingsProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
