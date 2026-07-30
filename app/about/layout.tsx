import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Max Hutchison & Pixel Hutch",
  description: "Meet Max Hutchison and the family behind Pixel Hutch, a Phoenix technology partner helping small businesses simplify websites, systems, and everyday IT.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Max Hutchison & Pixel Hutch",
    description: "A family-run Phoenix technology partner focused on useful websites, business systems, and clear, practical IT support.",
    url: "/about",
  },
};

export default function AboutLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
