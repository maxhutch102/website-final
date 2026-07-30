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
  title: {
    default: "Pixel Hutch | Phoenix Small Business IT, Websites & Systems",
    template: "%s | Pixel Hutch",
  },
  description: "Phoenix-based Pixel Hutch provides small-business IT support, custom websites, booking systems, CRM tools, automation, and practical ongoing technology help.",
  applicationName: "Pixel Hutch",
  authors: [{ name: "Max Hutchison", url: "https://pixel-hutch.com/about" }],
  creator: "Pixel Hutch",
  publisher: "Pixel Hutch",
  alternates: { canonical: "/" },
  category: "technology",
  keywords: [
    "Phoenix small business IT support",
    "Phoenix web design",
    "Arizona business technology",
    "custom CRM",
    "online booking systems",
    "small business automation",
    "onsite IT support Phoenix",
  ],
  openGraph: {
    title: "Pixel Hutch | Phoenix Small Business IT, Websites & Systems",
    description: "Practical IT support, custom websites, booking systems, CRM tools, and automation for Arizona small businesses.",
    url: "https://pixel-hutch.com",
    siteName: "Pixel Hutch",
    locale: "en_US",
    type: "website",
    images: [{ url: "/pixel-hutch-hero.png", width: 1536, height: 1024, alt: "Pixel Hutch website and business workflow tools" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Hutch | Phoenix Small Business IT, Websites & Systems",
    description: "Practical IT support, websites, booking systems, CRM tools, and automation for small businesses.",
    images: ["/pixel-hutch-hero.png"],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": ["ProfessionalService", "LocalBusiness"],
              "@id": "https://pixel-hutch.com/#business",
              name: "Pixel Hutch",
              url: "https://pixel-hutch.com",
              logo: "https://pixel-hutch.com/pixel-hutch-logo.svg",
              image: "https://pixel-hutch.com/pixel-hutch-hero.png",
              email: "max@pixel-hutch.com",
              telephone: "+1-480-352-4096",
              founder: { "@type": "Person", name: "Max Hutchison" },
              address: {
                "@type": "PostalAddress",
                addressLocality: "Phoenix",
                addressRegion: "AZ",
                addressCountry: "US",
              },
              areaServed: [
                { "@type": "City", name: "Phoenix" },
                { "@type": "State", name: "Arizona" },
                { "@type": "Country", name: "United States" },
              ],
              description: "Small-business IT support, custom websites, booking systems, CRM tools, automation, and ongoing technology help.",
              knowsAbout: ["IT support", "web design", "CRM systems", "online booking systems", "business automation"],
            }).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className={`${inconsolata.variable} ${silkscreen.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
