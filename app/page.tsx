import { Metadata } from "next";

import DashboardPageClient from "@/components/pages/dashboard-page-client";
import {
  DEFAULT_KEYWORDS,
  DEFAULT_SEO_DESCRIPTION,
  SITE_NAME,
  absoluteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: `Dashboard | ${SITE_NAME}`,
  description:
    "Kritik deprem durumu, son 1 saat yoğunluğu ve en güncel kayıtları tek ekranda izleyin.",
  keywords: DEFAULT_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `Dashboard | ${SITE_NAME}`,
    description: DEFAULT_SEO_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} dashboard`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Dashboard | ${SITE_NAME}`,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function HomePage() {
  return <DashboardPageClient />;
}
