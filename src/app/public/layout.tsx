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
  title: "Daire Önizleme",
  description: "Gayrimenkul Önizleme Sayfası",
  applicationName: "Enterprise Platform",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning style={{ scrollbarGutter: 'auto' }}>
      <head>
        <ColorSchemeScript />
        <meta name="theme-color" content="#228be6" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable}`}>
        <Providers dir="ltr">
          {children}
        </Providers>
      </body>
    </html>
  );
}
