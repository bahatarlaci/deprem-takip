import { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/depremler"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/harita"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/risk"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.85,
    },
    {
      url: absoluteUrl("/bildirimler"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
