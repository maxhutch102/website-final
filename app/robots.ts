import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: ["/", "/about", "/contact", "/services", "/work", "/privacy", "/terms"], disallow: ["/crm", "/portal", "/login", "/api"] }],
    sitemap: "https://pixel-hutch.com/sitemap.xml",
  };
}
