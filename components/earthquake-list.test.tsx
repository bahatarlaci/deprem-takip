import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EarthquakeEvent } from "@/lib/types";

import { EarthquakeList } from "./earthquake-list";

const events: EarthquakeEvent[] = [
  {
    eventID: "100",
    date: "2026-02-15T01:00:00",
    location: "Gediz (Kütahya)",
    latitude: 39,
    longitude: 29,
    depth: 5,
    magnitude: 2.3,
    type: "ML",
    rms: 0.4,
    country: "Türkiye",
    province: "Kütahya",
    district: "Gediz",
    neighborhood: "A",
    isEventUpdate: false,
    lastUpdateDate: null,
  },
];

describe("EarthquakeList", () => {
  it("satır tıklamasında event seçimini dışarı iletir", () => {
    const onSelectEvent = vi.fn();

    render(
      <EarthquakeList
        events={events}
        selectedEventId={null}
        onSelectEvent={onSelectEvent}
        isLoading={false}
      />,
    );

    fireEvent.click(screen.getByTestId("event-row-100"));

    expect(onSelectEvent).toHaveBeenCalledWith("100");
  });
});
