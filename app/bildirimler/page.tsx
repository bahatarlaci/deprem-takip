import { Metadata } from "next";

import NotificationsPageClient from "@/components/pages/notifications-page-client";
import { DEFAULT_KEYWORDS, SITE_NAME, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Bildirimler | ${SITE_NAME}`,
  description:
    "Deprem alarm kuralı oluşturun, web push bildirimlerini yönetin ve eşleşen olayları takip edin.",
  keywords: [...DEFAULT_KEYWORDS, "deprem alarm", "web push deprem"],
  alternates: {
    canonical: "/bildirimler",
  },
  openGraph: {
    title: `Bildirimler | ${SITE_NAME}`,
    description: "Deprem alarm kuralları ve bildirim yönetimi ekranı.",
    url: absoluteUrl("/bildirimler"),
    type: "website",
    siteName: SITE_NAME,
    locale: "tr_TR",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} bildirimler`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Bildirimler | ${SITE_NAME}`,
    description: "Deprem alarm kuralları ve web push bildirim yönetimi.",
    images: [absoluteUrl("/twitter-image")],
  },
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
