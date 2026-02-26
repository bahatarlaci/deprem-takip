"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EarthquakeMap } from "@/components/earthquake-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  buildEarthquakeSearchParams,
  createDefaultFilters,
  useEarthquakes,
} from "@/hooks/use-earthquakes";
import { haversineDistanceKm } from "@/lib/geo";
import { formatIstanbulDateTime, toDateTimeLocalInTimeZone } from "@/lib/time";
import { EarthquakeApiResponse, EarthquakeEvent, EarthquakeFilters } from "@/lib/types";

interface EarthquakeDetailPageProps {
  eventId: string;
}

interface RelatedEventRow {
  event: EarthquakeEvent;
  distanceKm: number;
  deltaMinutes: number;
}

const LOOKBACK_DAYS = 3650;
const AFTERSHOCK_WINDOW_HOURS = 72;
const NEARBY_WINDOW_HOURS = 24;
const AFTERSHOCK_RADIUS_M = 120_000;
const NEARBY_RADIUS_M = 250_000;
const AFTERSHOCK_LIMIT = "300";
const NEARBY_LIMIT = "200";

function createEventLookupFilters(eventId: string, now = new Date()): EarthquakeFilters {
  const start = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  return {
    ...createDefaultFilters(now),
    start: toDateTimeLocalInTimeZone(start),
    end: toDateTimeLocalInTimeZone(now),
    limit: "20",
    orderby: "timedesc",
    eventid: eventId,
  };
}

function createRadialFilters(
  baseEvent: EarthquakeEvent,
  start: Date,
  end: Date,
  limit: string,
  orderby: "timedesc" | "timeasc",
  maxrad: number,
): EarthquakeFilters {
  return {
    ...createDefaultFilters(end),
    start: toDateTimeLocalInTimeZone(start),
    end: toDateTimeLocalInTimeZone(end),
    limit,
    orderby,
    eventid: "",
    lat: String(baseEvent.latitude),
    lon: String(baseEvent.longitude),
    minrad: "",
    maxrad: String(maxrad),
    minlat: "",
    maxlat: "",
    minlon: "",
    maxlon: "",
  };
}

function uniqueByEventId(events: EarthquakeEvent[]): EarthquakeEvent[] {
  const map = new Map<string, EarthquakeEvent>();

  for (const event of events) {
    if (!map.has(event.eventID)) {
      map.set(event.eventID, event);
    }
  }

  return Array.from(map.values());
}

function formatDeltaMinutes(deltaMinutes: number): string {
  if (deltaMinutes < 60) {
    return `+${deltaMinutes} dk`;
  }

  const hours = Math.floor(deltaMinutes / 60);
  const minutes = deltaMinutes % 60;
  return `+${hours} sa ${minutes} dk`;
}

async function fetchByFilters(
  filters: EarthquakeFilters,
  signal?: AbortSignal,
): Promise<EarthquakeEvent[]> {
  const { params } = buildEarthquakeSearchParams(filters);
  const response = await fetch(`/api/earthquakes?${params.toString()}`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  const body = (await response.json()) as EarthquakeApiResponse | { error?: string };
  if (!response.ok) {
    throw new Error(body && typeof body === "object" && "error" in body ? body.error : "Veri alınamadı.");
  }

  return (body as EarthquakeApiResponse).data;
}

export function EarthquakeDetailPage({ eventId }: EarthquakeDetailPageProps) {
  const lookupFilters = useMemo(() => createEventLookupFilters(eventId), [eventId]);
  const [aftershockEvents, setAftershockEvents] = useState<EarthquakeEvent[]>([]);
  const [nearbyEvents, setNearbyEvents] = useState<EarthquakeEvent[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [focusedEventId, setFocusedEventId] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const { data, isLoading, isRefreshing, error, refresh } = useEarthquakes(lookupFilters);

  const targetEvent = useMemo(() => {
    return data.find((event) => event.eventID === eventId) ?? data[0] ?? null;
  }, [data, eventId]);

  useEffect(() => {
    if (!targetEvent) {
      setAftershockEvents([]);
      setNearbyEvents([]);
      setRelatedError(null);
      return;
    }

    const controller = new AbortController();
    const targetTime = Date.parse(targetEvent.date);
    const now = new Date();

    const aftershockEnd = new Date(
      Math.min(now.getTime(), targetTime + AFTERSHOCK_WINDOW_HOURS * 60 * 60 * 1000),
    );

    const nearbyStart = new Date(targetTime - NEARBY_WINDOW_HOURS * 60 * 60 * 1000);
    const nearbyEnd = new Date(
      Math.min(now.getTime(), targetTime + NEARBY_WINDOW_HOURS * 60 * 60 * 1000),
    );

    const aftershockFilters = createRadialFilters(
      targetEvent,
      new Date(targetTime),
      aftershockEnd,
      AFTERSHOCK_LIMIT,
      "timeasc",
      AFTERSHOCK_RADIUS_M,
    );

    const nearbyFilters = createRadialFilters(
      targetEvent,
      nearbyStart,
      nearbyEnd,
      NEARBY_LIMIT,
      "timedesc",
      NEARBY_RADIUS_M,
    );

    setRelatedLoading(true);
    setRelatedError(null);

    void (async () => {
      try {
        const [aftershockData, nearbyData] = await Promise.all([
          fetchByFilters(aftershockFilters, controller.signal),
          fetchByFilters(nearbyFilters, controller.signal),
        ]);

        if (controller.signal.aborted) {
          return;
        }

        setAftershockEvents(
          aftershockData
            .filter(
              (event) =>
                event.eventID !== targetEvent.eventID && Date.parse(event.date) >= targetTime,
            )
            .sort((left, right) => Date.parse(left.date) - Date.parse(right.date)),
        );

        setNearbyEvents(
          nearbyData
            .filter((event) => event.eventID !== targetEvent.eventID)
            .sort((left, right) => {
              const leftDistance = haversineDistanceKm(
                targetEvent.latitude,
                targetEvent.longitude,
                left.latitude,
                left.longitude,
              );

              const rightDistance = haversineDistanceKm(
                targetEvent.latitude,
                targetEvent.longitude,
                right.latitude,
                right.longitude,
              );

              if (leftDistance !== rightDistance) {
                return leftDistance - rightDistance;
              }

              if (right.magnitude !== left.magnitude) {
                return right.magnitude - left.magnitude;
              }

              return Date.parse(right.date) - Date.parse(left.date);
            }),
        );
      } catch (relatedFetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setRelatedError(
          relatedFetchError instanceof Error
            ? relatedFetchError.message
            : "İlişkili deprem verisi alınamadı.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setRelatedLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [targetEvent]);

  const aftershockRows = useMemo<RelatedEventRow[]>(() => {
    if (!targetEvent) {
      return [];
    }

    const targetTime = Date.parse(targetEvent.date);

    return aftershockEvents.slice(0, 80).map((event) => ({
      event,
      distanceKm: haversineDistanceKm(
        targetEvent.latitude,
        targetEvent.longitude,
        event.latitude,
        event.longitude,
      ),
      deltaMinutes: Math.max(0, Math.round((Date.parse(event.date) - targetTime) / 60000)),
    }));
  }, [aftershockEvents, targetEvent]);

  const nearbyRows = useMemo<RelatedEventRow[]>(() => {
    if (!targetEvent) {
      return [];
    }

    const targetTime = Date.parse(targetEvent.date);

    return nearbyEvents.slice(0, 60).map((event) => ({
      event,
      distanceKm: haversineDistanceKm(
        targetEvent.latitude,
        targetEvent.longitude,
        event.latitude,
        event.longitude,
      ),
      deltaMinutes: Math.round((Date.parse(event.date) - targetTime) / 60000),
    }));
  }, [nearbyEvents, targetEvent]);

  const mapEvents = useMemo(() => {
    if (!targetEvent) {
      return [];
    }

    return uniqueByEventId([targetEvent, ...aftershockRows.map((row) => row.event), ...nearbyRows.map((row) => row.event)]);
  }, [aftershockRows, nearbyRows, targetEvent]);

  const effectiveFocusedEventId = useMemo(() => {
    if (focusedEventId && mapEvents.some((event) => event.eventID === focusedEventId)) {
      return focusedEventId;
    }

    return targetEvent?.eventID ?? null;
  }, [focusedEventId, mapEvents, targetEvent]);

  const maxAftershock = useMemo(() => {
    if (aftershockRows.length === 0) {
      return null;
    }

    return Math.max(...aftershockRows.map((row) => row.event.magnitude));
  }, [aftershockRows]);

  const nearestDistance = useMemo(() => {
    if (nearbyRows.length === 0) {
      return null;
    }

    return Math.min(...nearbyRows.map((row) => row.distanceKm));
  }, [nearbyRows]);

  const handleShare = async () => {
    if (typeof window === "undefined") {
      return;
    }

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Deprem Detayı ${eventId}`,
          text: `${eventId} kimlikli deprem detayını incele`,
          url,
        });
        setShareStatus("copied");
        return;
      }

      await navigator.clipboard.writeText(url);
      setShareStatus("copied");
    } catch {
      setShareStatus("error");
    }
  };

  useEffect(() => {
    if (shareStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShareStatus("idle");
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [shareStatus]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Deprem Detayı</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Event ID: {eventId}</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Artçı zinciri, yakın depremler ve paylaşılabilir detay görünümü.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/depremler">Listeye Dön</Link>
          </Button>
          <Button type="button" variant="outline" onClick={handleShare}>
            Linki Paylaş
          </Button>
          <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
            Yenile
          </Button>
        </div>
      </header>

      {shareStatus === "copied" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Link paylaşımı hazır.
        </p>
      ) : null}
      {shareStatus === "error" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Link paylaşımı başarısız oldu. Tarayıcı izinlerini kontrol et.
        </p>
      ) : null}

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {!isLoading && !error && !targetEvent ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu event ID için kayıt bulunamadı.
        </p>
      ) : null}

      {targetEvent ? (
        <>
          <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Ana Olay</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Konum</p>
                <p className="text-sm font-semibold">{targetEvent.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Zaman</p>
                <p className="text-sm font-semibold">{formatIstanbulDateTime(targetEvent.date)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Büyüklük / Derinlik</p>
                <p className="text-sm font-semibold">
                  M {targetEvent.magnitude.toFixed(1)} · {targetEvent.depth.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Koordinat</p>
                <p className="text-sm font-semibold">
                  {targetEvent.latitude.toFixed(3)}, {targetEvent.longitude.toFixed(3)}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Artçı Sayısı</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">{aftershockRows.length}</CardContent>
            </Card>

            <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">En Büyük Artçı</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">
                {maxAftershock != null ? `M ${maxAftershock.toFixed(1)}` : "-"}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">En Yakın Deprem</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-2xl font-semibold">
                {nearestDistance != null ? `${nearestDistance.toFixed(1)} km` : "-"}
              </CardContent>
            </Card>
          </div>

          {relatedError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {relatedError}
            </p>
          ) : null}

          <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Bölgesel Harita</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <EarthquakeMap
                events={mapEvents}
                selectedEventId={effectiveFocusedEventId}
                onSelectEvent={setFocusedEventId}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Artçı Zinciri (72 saat / 120 km)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {aftershockRows.length === 0 && !relatedLoading ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    Seçilen olaydan sonra artçı kaydı bulunamadı.
                  </p>
                ) : (
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-slate-50/95">Tarih</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">M</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Derinlik</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Uzaklık</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Süre</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95 text-right">Detay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aftershockRows.map((row) => (
                          <TableRow
                            key={row.event.eventID}
                            className="cursor-pointer"
                            onClick={() => setFocusedEventId(row.event.eventID)}
                          >
                            <TableCell>{formatIstanbulDateTime(row.event.date)}</TableCell>
                            <TableCell>M {row.event.magnitude.toFixed(1)}</TableCell>
                            <TableCell>{row.event.depth.toFixed(1)} km</TableCell>
                            <TableCell>{row.distanceKm.toFixed(1)} km</TableCell>
                            <TableCell>{formatDeltaMinutes(row.deltaMinutes)}</TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/depremler/${row.event.eventID}`}>Aç</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Yakın Depremler (±24 saat / 250 km)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {nearbyRows.length === 0 && !relatedLoading ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground">
                    Yakın deprem kaydı bulunamadı.
                  </p>
                ) : (
                  <div className="max-h-[420px] overflow-auto rounded-xl border border-border/70">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="sticky top-0 bg-slate-50/95">Tarih</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Konum</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">M</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Uzaklık</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95">Fark</TableHead>
                          <TableHead className="sticky top-0 bg-slate-50/95 text-right">Detay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {nearbyRows.map((row) => (
                          <TableRow
                            key={row.event.eventID}
                            className="cursor-pointer"
                            onClick={() => setFocusedEventId(row.event.eventID)}
                          >
                            <TableCell>{formatIstanbulDateTime(row.event.date)}</TableCell>
                            <TableCell>{row.event.location}</TableCell>
                            <TableCell>M {row.event.magnitude.toFixed(1)}</TableCell>
                            <TableCell>{row.distanceKm.toFixed(1)} km</TableCell>
                            <TableCell>
                              {row.deltaMinutes >= 0 ? `+${row.deltaMinutes} dk` : `${row.deltaMinutes} dk`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/depremler/${row.event.eventID}`}>Aç</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            {relatedLoading
              ? "İlişkili deprem verileri güncelleniyor..."
              : isRefreshing
                ? "Ana kayıt 60 saniyelik periyotta yenileniyor..."
                : "Veri güncel."}
          </p>
        </>
      ) : null}
    </div>
  );
}
