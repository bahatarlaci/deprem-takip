"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CriticalAlertBanner } from "@/components/critical-alert-banner";
import { EarthquakeList } from "@/components/earthquake-list";
import { EarthquakeMap } from "@/components/earthquake-map";
import { FilterPanel } from "@/components/filter-panel";
import { ProvinceRiskRadar } from "@/components/province-risk-radar";
import { SummaryCards } from "@/components/summary-cards";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";
import { EarthquakeFilters } from "@/lib/types";

import styles from "./page.module.css";

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

export default function HomePage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [filters, setFilters] = useState<EarthquakeFilters>(defaults);
  const [appliedFilters, setAppliedFilters] = useState<EarthquakeFilters>(defaults);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);

  const { data, meta, isLoading, isRefreshing, error, refresh, clientRadialOverridesBounding } =
    useEarthquakes(appliedFilters);

  const effectiveActiveProvince = useMemo(() => {
    if (activeProvince && data.some((event) => event.province === activeProvince)) {
      return activeProvince;
    }

    return null;
  }, [activeProvince, data]);

  const displayedEvents = useMemo(() => {
    if (!effectiveActiveProvince) {
      return data;
    }

    return data.filter((event) => event.province === effectiveActiveProvince);
  }, [data, effectiveActiveProvince]);

  const criticalEvent = useMemo(() => {
    return (
      displayedEvents
        .filter((event) => event.magnitude >= CRITICAL_THRESHOLD)
        .sort((left, right) => {
          if (right.magnitude !== left.magnitude) {
            return right.magnitude - left.magnitude;
          }

          return Date.parse(right.date) - Date.parse(left.date);
        })[0] ?? null
    );
  }, [displayedEvents]);

  const summaryMeta = useMemo(() => {
    if (!meta) {
      return null;
    }

    return {
      ...meta,
      count: displayedEvents.length,
    };
  }, [displayedEvents.length, meta]);

  const previousCriticalIdRef = useRef<string | null>(null);
  const effectiveSelectedEventId = useMemo(() => {
    if (
      selectedEventId &&
      displayedEvents.some((event) => event.eventID === selectedEventId)
    ) {
      return selectedEventId;
    }

    return displayedEvents[0]?.eventID ?? null;
  }, [displayedEvents, selectedEventId]);

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

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const nextDefaults = createDefaultFilters();
    setFilters(nextDefaults);
    setAppliedFilters(nextDefaults);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>AFAD Earthquake API</p>
          <h1>Deprem Takip Paneli</h1>
          <p className={styles.subtitle}>Türkiye genelindeki son depremleri filtrele, listede incele ve haritada takip et.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </button>
      </header>

      <SummaryCards events={displayedEvents} meta={summaryMeta} isRefreshing={isRefreshing} />

      <ProvinceRiskRadar
        events={data}
        activeProvince={effectiveActiveProvince}
        onProvinceSelect={(province) => setActiveProvince(province)}
        onClear={() => setActiveProvince(null)}
      />

      <CriticalAlertBanner
        criticalEvent={criticalEvent}
        threshold={CRITICAL_THRESHOLD}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
        onFocusEvent={setSelectedEventId}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isLoading={isLoading}
            radialOverridesBounding={Boolean(meta?.radialOverridesBounding) || clientRadialOverridesBounding}
          />
        </aside>

        <section className={styles.content}>
          <EarthquakeMap
            events={displayedEvents}
            selectedEventId={effectiveSelectedEventId}
            onSelectEvent={setSelectedEventId}
          />
          <EarthquakeList
            events={displayedEvents}
            selectedEventId={effectiveSelectedEventId}
            onSelectEvent={setSelectedEventId}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}
