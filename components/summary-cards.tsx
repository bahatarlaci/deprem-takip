"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeApiMeta, EarthquakeEvent } from "@/lib/types";

interface SummaryCardsProps {
  events: EarthquakeEvent[];
  meta: EarthquakeApiMeta | null;
  isRefreshing: boolean;
}

export function SummaryCards({ events, meta, isRefreshing }: SummaryCardsProps) {
  const maxMagnitude =
    events.length > 0
      ? Math.max(...events.map((event) => event.magnitude)).toLocaleString("tr-TR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : "-";

  const latestEvent = events[0]?.date;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card className="border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Toplam Kayıt
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-2xl font-semibold">{meta?.count ?? events.length}</CardContent>
      </Card>

      <Card className="border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Maksimum Büyüklük
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-2xl font-semibold">{maxMagnitude}</CardContent>
      </Card>

      <Card className="border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Son Deprem Zamanı
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 text-base font-semibold">
          {latestEvent ? formatIstanbulDateTime(latestEvent) : "-"}
        </CardContent>
      </Card>

      <Card className="border-border/80 bg-white/80 shadow-sm backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
            Son Senkron
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <p className="text-base font-semibold">{meta?.fetchedAt ? formatIstanbulDateTime(meta.fetchedAt) : "-"}</p>
          <p className="text-xs text-muted-foreground">
            {isRefreshing ? "Yenileniyor..." : "60 sn auto-refresh aktif"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
