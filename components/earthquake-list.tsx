"use client";

import { useEffect, useRef } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatIstanbulDateTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { EarthquakeEvent } from "@/lib/types";

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
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        Seçilen filtre için deprem kaydı bulunamadı.
      </p>
    );
  }

  return (
    <div className="max-h-[460px] overflow-auto rounded-xl border border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 z-10 bg-slate-50/95">Tarih</TableHead>
            <TableHead className="sticky top-0 z-10 bg-slate-50/95">Konum</TableHead>
            <TableHead className="sticky top-0 z-10 bg-slate-50/95">Büyüklük</TableHead>
            <TableHead className="sticky top-0 z-10 bg-slate-50/95">Derinlik</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const selected = event.eventID === selectedEventId;
            return (
              <TableRow
                key={event.eventID}
                ref={(node) => {
                  rowRefs.current[event.eventID] = node;
                }}
                onClick={() => onSelectEvent(event.eventID)}
                className={cn("cursor-pointer", selected ? "bg-sky-100/70 hover:bg-sky-100" : undefined)}
                data-testid={`event-row-${event.eventID}`}
              >
                <TableCell>{formatIstanbulDateTime(event.date)}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>M {event.magnitude.toFixed(1)}</TableCell>
                <TableCell>{event.depth.toFixed(1)} km</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
