"use client";

import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeApiMeta, EarthquakeEvent } from "@/lib/types";

import styles from "./summary-cards.module.css";

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
    <div className={styles.grid}>
      <article className={styles.card}>
        <h3>Toplam Kayıt</h3>
        <p>{meta?.count ?? events.length}</p>
      </article>
      <article className={styles.card}>
        <h3>Maksimum Büyüklük</h3>
        <p>{maxMagnitude}</p>
      </article>
      <article className={styles.card}>
        <h3>Son Deprem Zamanı</h3>
        <p>{latestEvent ? formatIstanbulDateTime(latestEvent) : "-"}</p>
      </article>
      <article className={styles.card}>
        <h3>Son Senkron</h3>
        <p>{meta?.fetchedAt ? formatIstanbulDateTime(meta.fetchedAt) : "-"}</p>
        <small>{isRefreshing ? "Yenileniyor..." : "60 sn auto-refresh aktif"}</small>
      </article>
    </div>
  );
}
