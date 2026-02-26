"use client";

import { useEffect, useMemo, useState } from "react";

import { EarthquakeList } from "@/components/earthquake-list";
import { EarthquakeMap } from "@/components/earthquake-map";
import { SummaryCards } from "@/components/summary-cards";
import { Button } from "@/components/ui/button";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";

export default function MapPage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data, meta, isLoading, isRefreshing, error, refresh } = useEarthquakes(defaults);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const eventIdFromQuery = new URLSearchParams(window.location.search).get("eventId");
    if (!eventIdFromQuery) {
      return;
    }

    const syncTimeout = window.setTimeout(() => {
      setSelectedEventId((previous) => previous ?? eventIdFromQuery);
    }, 0);

    return () => {
      window.clearTimeout(syncTimeout);
    };
  }, []);

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId && data.some((event) => event.eventID === selectedEventId)) {
      return selectedEventId;
    }

    return data[0]?.eventID ?? null;
  }, [data, selectedEventId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Harita</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Canlı Deprem Haritası</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Cluster ve heatmap katmanlarıyla yoğunluğu izle, listeden bir olayı seçerek haritada odaklan.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      <SummaryCards events={data} meta={meta} isRefreshing={isRefreshing} />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <EarthquakeMap
        events={data}
        selectedEventId={effectiveSelectedEventId}
        onSelectEvent={setSelectedEventId}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Harita ile Senkron Liste</h3>
        <EarthquakeList
          events={data}
          selectedEventId={effectiveSelectedEventId}
          onSelectEvent={setSelectedEventId}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
