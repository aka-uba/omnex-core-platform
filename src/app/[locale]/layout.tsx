import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "../globals.css";
import { Providers } from "../providers";
import { ColorSchemeScript } from "@mantine/core";
import { rtlLocales } from "@/lib/i18n/config";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: '--font-display',
  display: 'swap',
});

// Metadata boş bırakılıyor - DynamicHeadMeta tarafından firma adından dinamik olarak ayarlanacak
export const metadata: Metadata = {
  title: "",
  description: "",
};

// Route segment config - optimize caching
// Use 'auto' to allow Next.js to determine best caching strategy
// The layout itself is mostly static, dynamic data comes from client components
export const dynamic = 'auto';
export const revalidate = 60; // Revalidate every 60 seconds

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRTL = rtlLocales.includes(locale);
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        {/* Preload Material Symbols font for faster icon rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{
          __html: `
            .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            .material-symbols-outlined.fill {
              font-variation-settings: 'FILL' 1;
            }
          `
        }} />
        {process.env.NODE_ENV === 'development' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  const originalLog = console.log;
                  console.log = function(...args) {
                    const message = args[0];
                    // Only filter Fast Refresh logs, keep all debug logs
                    if (typeof message === 'string' && (
                      message.includes('[Fast Refresh]') ||
                      (message.includes('rebuilding') && !message.includes('[DEBUG]')) ||
                      (message.includes('done in') && !message.includes('[DEBUG]'))
                    )) {
                      return;
                    }
                    originalLog.apply(console, args);
                  };
                })();
              `,
            }}
          />
        )}
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable}`}>
        <Providers dir={dir}>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
