"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { EarthquakeEvent } from "@/lib/types";

import styles from "./earthquake-map.module.css";

const EarthquakeMapInner = dynamic(() => import("@/components/earthquake-map-inner"), {
  ssr: false,
  loading: () => <div className={styles.loading}>Harita yükleniyor...</div>,
});

interface EarthquakeMapProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

export function EarthquakeMap({ events, selectedEventId, onSelectEvent }: EarthquakeMapProps) {
  const [clustersEnabled, setClustersEnabled] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(true);

  return (
    <div className={styles.container}>
      <div className={styles.layerControls}>
        <button
          type="button"
          className={clustersEnabled ? styles.activeControl : styles.controlButton}
          onClick={() => setClustersEnabled((previous) => !previous)}
        >
          Cluster {clustersEnabled ? "Açık" : "Kapalı"}
        </button>
        <button
          type="button"
          className={heatmapEnabled ? styles.activeControl : styles.controlButton}
          onClick={() => setHeatmapEnabled((previous) => !previous)}
        >
          Heatmap {heatmapEnabled ? "Açık" : "Kapalı"}
        </button>
      </div>
      <EarthquakeMapInner
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        clustersEnabled={clustersEnabled}
        heatmapEnabled={heatmapEnabled}
      />
    </div>
  );
}
