import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services & Pricing | Pixel Hutch",
  description: "Explore Pixel Hutch website, online store, business system, and ongoing support services for businesses.",
};

export default function ServicesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
