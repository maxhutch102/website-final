import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{
      userAgent: "*",
      allow: ["/"],
      disallow: ["/crm", "/portal", "/login", "/client-login", "/forgot-password", "/reset-password", "/create-client-password", "/api"],
    }],
    host: "https://pixel-hutch.com",
    sitemap: "https://pixel-hutch.com/sitemap.xml",
  };
}
