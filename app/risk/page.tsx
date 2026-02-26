"use client";

import { useMemo, useState } from "react";

import { EarthquakeList } from "@/components/earthquake-list";
import { ProvinceRiskRadar } from "@/components/province-risk-radar";
import { SummaryCards } from "@/components/summary-cards";
import { Button } from "@/components/ui/button";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";

export default function RiskPage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data, meta, isLoading, isRefreshing, error, refresh } = useEarthquakes(defaults);

  const effectiveActiveProvince = useMemo(() => {
    if (activeProvince && data.some((event) => event.province === activeProvince)) {
      return activeProvince;
    }

    return null;
  }, [activeProvince, data]);

  const provinceEvents = useMemo(() => {
    if (!effectiveActiveProvince) {
      return data;
    }

    return data.filter((event) => event.province === effectiveActiveProvince);
  }, [data, effectiveActiveProvince]);

  const summaryMeta = useMemo(() => {
    if (!meta) {
      return null;
    }

    return {
      ...meta,
      count: provinceEvents.length,
    };
  }, [meta, provinceEvents.length]);

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId && provinceEvents.some((event) => event.eventID === selectedEventId)) {
      return selectedEventId;
    }

    return provinceEvents[0]?.eventID ?? null;
  }, [provinceEvents, selectedEventId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Risk</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">İl Bazlı Risk Analizi</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Son 24 saat verisinde il bazlı yoğunluğu takip et ve yüksek aktivite görülen illere odaklan.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      <SummaryCards events={provinceEvents} meta={summaryMeta} isRefreshing={isRefreshing} />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <ProvinceRiskRadar
        events={data}
        activeProvince={effectiveActiveProvince}
        onProvinceSelect={(province) => setActiveProvince(province)}
        onClear={() => setActiveProvince(null)}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {effectiveActiveProvince ? `${effectiveActiveProvince} İçin Son Depremler` : "Son Depremler"}
        </h3>
        <EarthquakeList
          events={provinceEvents}
          selectedEventId={effectiveSelectedEventId}
          onSelectEvent={setSelectedEventId}
          isLoading={isLoading}
        />
      </section>
    </div>
  );
}
