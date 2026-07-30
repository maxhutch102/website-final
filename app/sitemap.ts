import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    ["", "weekly", 1],
    ["/services", "monthly", 0.95],
    ["/booking-systems", "monthly", 0.9],
    ["/crm-demo", "monthly", 0.85],
    ["/work", "monthly", 0.8],
    ["/about", "monthly", 0.75],
    ["/contact", "monthly", 0.9],
    ["/privacy", "yearly", 0.2],
    ["/terms", "yearly", 0.2],
  ] as const;
  return routes.map(([route, changeFrequency, priority]) => ({
    url: `https://pixel-hutch.com${route}`,
    lastModified: new Date("2026-07-29"),
    changeFrequency,
    priority,
  }));
}
