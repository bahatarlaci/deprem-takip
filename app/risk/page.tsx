"use client";

import { useMemo, useState } from "react";

import { EarthquakeList } from "@/components/earthquake-list";
import { ProvinceRiskRadar } from "@/components/province-risk-radar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";
import { buildProvinceRiskRadar } from "@/lib/risk-radar";

export default function RiskPage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const { data, isLoading, error, refresh } = useEarthquakes(defaults);

  const radarItems = useMemo(() => buildProvinceRiskRadar(data), [data]);
  const effectiveActiveProvince = useMemo(() => {
    if (activeProvince && radarItems.some((item) => item.province === activeProvince)) {
      return activeProvince;
    }

    return radarItems[0]?.province ?? null;
  }, [activeProvince, radarItems]);

  const selectedRiskItem = useMemo(() => {
    if (!effectiveActiveProvince) {
      return null;
    }

    return radarItems.find((item) => item.province === effectiveActiveProvince) ?? null;
  }, [effectiveActiveProvince, radarItems]);

  const provinceEvents = useMemo(() => {
    if (!effectiveActiveProvince) {
      return [];
    }

    return data.filter((event) => event.province === effectiveActiveProvince);
  }, [data, effectiveActiveProvince]);

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
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">İl Bazlı Risk Analiz Merkezi</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Haritadan ili seç, risk skorunu incele ve seçilen ilin deprem geçmişini detaylı değerlendir.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Analiz İli</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold">{selectedRiskItem?.province ?? "-"}</CardContent>
        </Card>

        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Risk Skoru</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold">
            {selectedRiskItem ? selectedRiskItem.score.toFixed(1) : "-"}
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Deprem Sayısı</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xl font-semibold">{selectedRiskItem?.eventCount ?? 0}</CardContent>
        </Card>

        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Max M / Ort. Derinlik</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-sm font-semibold">
            {selectedRiskItem
              ? `M ${selectedRiskItem.maxMagnitude.toFixed(1)} · ${selectedRiskItem.avgDepth.toFixed(1)} km`
              : "-"}
          </CardContent>
        </Card>
      </div>

      <ProvinceRiskRadar
        events={data}
        activeProvince={effectiveActiveProvince}
        onProvinceSelect={(province) => setActiveProvince(province)}
        onClear={() => setActiveProvince(null)}
      />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {effectiveActiveProvince ? `${effectiveActiveProvince} İl Detayı` : "İl Detayı"}
        </h3>
        <EarthquakeList
          events={provinceEvents}
          selectedEventId={effectiveSelectedEventId}
          onSelectEvent={setSelectedEventId}
          isLoading={isLoading}
          detailHrefBuilder={(event) => "/depremler/" + event.eventID}
        />
      </section>
    </div>
  );
}
