import { Metadata } from "next";

import RiskPageClient from "@/components/pages/risk-page-client";
import { DEFAULT_KEYWORDS, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Risk Analizi | ${SITE_NAME}`,
  description:
    "İl bazlı deprem risk skorları, yoğunluk haritası ve il detay analiz ekranı.",
  keywords: [...DEFAULT_KEYWORDS, "deprem risk haritası", "il bazlı deprem"],
  alternates: {
    canonical: "/risk",
  },
  openGraph: {
    title: `Risk Analizi | ${SITE_NAME}`,
    description: "Türkiye genelinde il bazlı deprem risk analizini inceleyin.",
    url: absoluteUrl("/risk"),
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} risk analizi`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Risk Analizi | ${SITE_NAME}`,
    description: "İl bazlı deprem risk skorları ve yoğunluk analizi.",
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function RiskPage() {
  return <RiskPageClient />;
}
