import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Pixel Hutch",
  description: "Tell Pixel Hutch what is slowing your business down. Contact Max directly about IT support, websites, booking systems, CRM tools, or automation.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Pixel Hutch",
    description: "Start a direct conversation with Max about practical technology help for your business.",
    url: "/contact",
  },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
