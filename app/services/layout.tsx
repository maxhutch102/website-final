import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Small Business IT, Website & Software Services",
  description: "Explore Pixel Hutch pricing for custom websites, online stores, CRM and booking systems, automation, care plans, and onsite IT support in Phoenix.",
  alternates: { canonical: "/services" },
  openGraph: {
    title: "Small Business IT, Website & Software Services",
    description: "Custom websites, online stores, CRM and booking systems, automation, and practical IT support from Pixel Hutch.",
    url: "/services",
  },
};

export default function ServicesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
