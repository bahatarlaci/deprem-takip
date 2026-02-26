import { Metadata } from "next";

import { EarthquakeDetailPage } from "@/components/earthquake-detail-page";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

interface EventDetailRouteProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: EventDetailRouteProps): Promise<Metadata> {
  const { eventId } = await params;
  const title = `Deprem Detayı ${eventId} | ${SITE_NAME}`;
  const description = `${eventId} event ID'li deprem için artçı zinciri ve yakın deprem analizi`;

  return {
    title,
    description,
    alternates: {
      canonical: `/depremler/${eventId}`,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/depremler/${eventId}`),
      siteName: SITE_NAME,
      locale: "tr_TR",
      type: "article",
      images: [
        {
          url: absoluteUrl("/opengraph-image"),
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} deprem detayı`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/twitter-image")],
    },
  };
}

export default async function EventDetailRoute({ params }: EventDetailRouteProps) {
  const { eventId } = await params;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Deprem Detayı ${eventId}`,
    url: absoluteUrl(`/depremler/${eventId}`),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: absoluteUrl("/"),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Depremler",
          item: absoluteUrl("/depremler"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: `Deprem ${eventId}`,
          item: absoluteUrl(`/depremler/${eventId}`),
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <EarthquakeDetailPage eventId={eventId} />
    </>
  );
}
