import { Metadata } from "next";

import MapPageClient from "@/components/pages/map-page-client";
import { DEFAULT_KEYWORDS, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Harita | ${SITE_NAME}`,
  description:
    "Deprem yoğunluğunu cluster ve heatmap katmanlarıyla canlı harita üzerinde inceleyin.",
  keywords: [...DEFAULT_KEYWORDS, "deprem heatmap", "deprem cluster"],
  alternates: {
    canonical: "/harita",
  },
  openGraph: {
    title: `Harita | ${SITE_NAME}`,
    description:
      "Türkiye deprem yoğunluğunu harita katmanlarıyla anlık izleyin.",
    url: absoluteUrl("/harita"),
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} deprem haritası`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Harita | ${SITE_NAME}`,
    description: "Cluster ve heatmap katmanlı deprem haritası.",
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function MapPage() {
  return <MapPageClient />;
}
