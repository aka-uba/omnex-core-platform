import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { ColorSchemeScript } from "@mantine/core";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Omnex-Core - Login",
  description: "Agency Operating System - Authentication",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning style={{ scrollbarGutter: 'auto' }}>
      <head>
        <ColorSchemeScript />
        <link rel="manifest" href="/api/manifest" />
        <meta name="theme-color" content="#228be6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Omnex" />
        <link rel="apple-touch-icon" href="/branding/pwa-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable}`} style={{ overflow: 'hidden' }}>
        <Providers dir="ltr">
          {children}
        </Providers>
      </body>
    </html>
  );
}
