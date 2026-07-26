import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/contact", "/services", "/work", "/privacy", "/terms"];
  return routes.map((route) => ({
    url: `https://pixel-hutch.com${route}`,
    lastModified: new Date("2026-07-23"),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route === "/contact" || route === "/services" ? 0.9 : 0.7,
  }));
}
