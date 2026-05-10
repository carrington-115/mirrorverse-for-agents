import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const make = (
    path: string,
    priority: number,
    changeFrequency: "daily" | "weekly" | "monthly",
  ) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: now,
    changeFrequency,
    priority,
  });

  return [
    make("/", 1, "weekly"),
    make("/sign-in", 0.7, "monthly"),
    make("/sign-up", 0.7, "monthly"),
  ];
}
