import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Websites, CRM & Business Systems Portfolio",
  description: "Explore Pixel Hutch website, CRM, client portal, online store, and business-system projects built to solve practical operational problems.",
  alternates: { canonical: "/work" },
  openGraph: {
    title: "Pixel Hutch Work & Product Builds",
    description: "Real websites, CRM tools, client portals, and business systems designed to be useful.",
    url: "/work",
  },
};

export default function WorkLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
