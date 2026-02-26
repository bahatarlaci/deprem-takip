"use client";

import { EarthquakeEvent } from "@/lib/types";

import styles from "./critical-alert-banner.module.css";

interface CriticalAlertBannerProps {
  criticalEvent: EarthquakeEvent | null;
  threshold: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onFocusEvent: (eventId: string) => void;
}

export function CriticalAlertBanner({
  criticalEvent,
  threshold,
  soundEnabled,
  onToggleSound,
  onFocusEvent,
}: CriticalAlertBannerProps) {
  if (!criticalEvent) {
    return null;
  }

  return (
    <section className={styles.banner} data-testid="critical-banner">
      <div>
        <strong>Kritik Deprem Uyarısı</strong>
        <p>
          {threshold.toFixed(1)}+ eşik aşıldı: <b>{criticalEvent.location}</b> - M
          {criticalEvent.magnitude.toFixed(1)}
        </p>
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={() => onFocusEvent(criticalEvent.eventID)}>
          Haritada Göster
        </button>
        <button type="button" className={styles.actionButton} onClick={onToggleSound}>
          Ses: {soundEnabled ? "Açık" : "Kapalı"}
        </button>
      </div>
    </section>
  );
}
