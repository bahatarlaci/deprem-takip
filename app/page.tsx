"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CriticalAlertBanner } from "@/components/critical-alert-banner";
import { EarthquakeList } from "@/components/earthquake-list";
import { SummaryCards } from "@/components/summary-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";
import { buildProvinceRiskRadar } from "@/lib/risk-radar";

const CRITICAL_THRESHOLD = 4.0;

function playAlertTone(): void {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }

  const audioContext = new AudioContextConstructor();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.02;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.25);

  setTimeout(() => {
    void audioContext.close();
  }, 500);
}

export default function DashboardPage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const { data, meta, isLoading, isRefreshing, error, refresh } = useEarthquakes(defaults);

  const criticalEvent = useMemo(() => {
    return (
      data
        .filter((event) => event.magnitude >= CRITICAL_THRESHOLD)
        .sort((left, right) => {
          if (right.magnitude !== left.magnitude) {
            return right.magnitude - left.magnitude;
          }

          return Date.parse(right.date) - Date.parse(left.date);
        })[0] ?? null
    );
  }, [data]);

  const previousCriticalIdRef = useRef<string | null>(null);
  useEffect(() => {
    const currentCriticalId = criticalEvent?.eventID ?? null;

    if (!currentCriticalId) {
      previousCriticalIdRef.current = null;
      return;
    }

    const isNewCritical = previousCriticalIdRef.current !== currentCriticalId;
    previousCriticalIdRef.current = currentCriticalId;

    if (isNewCritical && soundEnabled) {
      playAlertTone();
    }
  }, [criticalEvent, soundEnabled]);

  const criticalCount = data.filter((event) => event.magnitude >= CRITICAL_THRESHOLD).length;
  const referenceTimestamp = meta?.fetchedAt ? Date.parse(meta.fetchedAt) : Date.parse(data[0]?.date ?? "");
  const lastHourLimit = Number.isFinite(referenceTimestamp) ? referenceTimestamp - 60 * 60 * 1000 : null;
  const lastHourCount =
    lastHourLimit == null ? 0 : data.filter((event) => Date.parse(event.date) >= lastHourLimit).length;
  const topProvince = buildProvinceRiskRadar(data)[0] ?? null;

  const latestEvents = useMemo(() => data.slice(0, 10), [data]);

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId && latestEvents.some((event) => event.eventID === selectedEventId)) {
      return selectedEventId;
    }

    return latestEvents[0]?.eventID ?? null;
  }, [latestEvents, selectedEventId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Operasyon Özeti</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            Anlık durum takibi için kritik eşik, son 1 saat yoğunluğu ve en güncel kayıtlar tek ekranda.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      <SummaryCards events={data} meta={meta} isRefreshing={isRefreshing} />

      <CriticalAlertBanner
        criticalEvent={criticalEvent}
        threshold={CRITICAL_THRESHOLD}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
        onFocusEvent={setSelectedEventId}
      />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Kritik Olay (M≥4)</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{criticalCount}</CardContent>
        </Card>

        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">Son 1 Saat</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-2xl font-semibold">{lastHourCount}</CardContent>
        </Card>

        <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-[0.12em] text-muted-foreground">En Hareketli İl</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-base font-semibold">
            {topProvince
              ? `${topProvince.province} · Skor ${topProvince.score}`
              : "-"}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">Son 10 Kayıt</h3>
        <EarthquakeList
          events={latestEvents}
          selectedEventId={effectiveSelectedEventId}
          onSelectEvent={setSelectedEventId}
          isLoading={isLoading}
          detailHrefBuilder={(event) => "/depremler/" + event.eventID}
        />
      </section>
    </div>
  );
}
