import { Metadata } from "next";

import EarthquakesPageClient from "@/components/pages/earthquakes-page-client";
import { DEFAULT_KEYWORDS, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Depremler | ${SITE_NAME}`,
  description:
    "AFAD deprem kayıtlarını tarih, büyüklük, derinlik ve coğrafi filtrelerle detaylı listeleyin.",
  keywords: [...DEFAULT_KEYWORDS, "deprem filtreleme", "deprem listesi"],
  alternates: {
    canonical: "/depremler",
  },
  openGraph: {
    title: `Depremler | ${SITE_NAME}`,
    description:
      "AFAD deprem kayıtlarını gelişmiş filtrelerle listele ve detay sayfalarına geç.",
    url: absoluteUrl("/depremler"),
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} deprem listesi`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Depremler | ${SITE_NAME}`,
    description: "Filtrelenebilir AFAD deprem listesi.",
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function EarthquakesPage() {
  return <EarthquakesPageClient />;
}
