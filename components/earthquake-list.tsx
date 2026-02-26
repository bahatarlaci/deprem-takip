"use client";

import { useEffect, useRef } from "react";

import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeEvent } from "@/lib/types";

import styles from "./earthquake-list.module.css";

interface EarthquakeListProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  isLoading: boolean;
}

export function EarthquakeList({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading,
}: EarthquakeListProps) {
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  useEffect(() => {
    if (!selectedEventId) {
      return;
    }

    rowRefs.current[selectedEventId]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [selectedEventId]);

  if (events.length === 0 && !isLoading) {
    return <p className={styles.empty}>Seçilen filtre için deprem kaydı bulunamadı.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Konum</th>
            <th>Büyüklük</th>
            <th>Derinlik</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            const selected = event.eventID === selectedEventId;
            return (
              <tr
                key={event.eventID}
                ref={(node) => {
                  rowRefs.current[event.eventID] = node;
                }}
                onClick={() => onSelectEvent(event.eventID)}
                className={selected ? styles.selectedRow : undefined}
                data-testid={`event-row-${event.eventID}`}
              >
                <td>{formatIstanbulDateTime(event.date)}</td>
                <td>{event.location}</td>
                <td>M {event.magnitude.toFixed(1)}</td>
                <td>{event.depth.toFixed(1)} km</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
