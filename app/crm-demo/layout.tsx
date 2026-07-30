import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Small Business CRM Demo",
  description: "Explore Pixel Hutch's interactive CRM demo with leads, customers, projects, invoices, tasks, reporting, and a client portal.",
  alternates: { canonical: "/crm-demo" },
  openGraph: {
    title: "Interactive Small Business CRM Demo",
    description: "Click through a connected workspace for leads, projects, billing, and client communication.",
    url: "/crm-demo",
  },
};

export default function CrmDemoLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
