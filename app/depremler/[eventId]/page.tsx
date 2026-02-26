import { Metadata } from "next";

import { EarthquakeDetailPage } from "@/components/earthquake-detail-page";

interface EventDetailRouteProps {
  params: Promise<{
    eventId: string;
  }>;
}

export async function generateMetadata({ params }: EventDetailRouteProps): Promise<Metadata> {
  const { eventId } = await params;

  return {
    title: `Deprem Detayı ${eventId}`,
    description: `${eventId} event ID'li deprem için artçı zinciri ve yakın deprem analizi`,
  };
}

export default async function EventDetailRoute({ params }: EventDetailRouteProps) {
  const { eventId } = await params;
  return <EarthquakeDetailPage eventId={eventId} />;
}
