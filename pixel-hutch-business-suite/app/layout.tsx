import type { Metadata } from "next";
import { Inconsolata, Silkscreen } from "next/font/google";
import "./globals.css";

const inconsolata = Inconsolata({
  variable: "--font-inconsolata",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pixel-hutch.com"),
  title: "Pixel Hutch | Websites, Systems & Support for Businesses",
  description: "Pixel Hutch builds practical websites, business systems, and ongoing technology support for businesses.",
  openGraph: {
    title: "Pixel Hutch | Websites, Systems & Support for Businesses",
    description: "Practical websites, configurable business systems, and hands on technology support for businesses.",
    url: "https://pixel-hutch.com",
    siteName: "Pixel Hutch",
    type: "website",
    images: [{ url: "/pixel-hutch-hero.png", width: 1536, height: 1024, alt: "Pixel Hutch website and business workflow tools" }],
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/black-wordmark-favicon.ico",
    shortcut: "/black-wordmark-favicon.ico",
    apple: "/black-wordmark-favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inconsolata.variable} ${silkscreen.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
