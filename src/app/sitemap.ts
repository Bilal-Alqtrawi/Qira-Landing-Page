import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/legal/privacy", "/legal/terms", "/legal/retention"].map(path => ({ url: `${site.url}${path}`, lastModified: "2026-01-01", changeFrequency: "monthly", priority: path ? 0.4 : 1 }));
}
