import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EarthquakeEvent } from "@/lib/types";

import { CriticalAlertBanner } from "./critical-alert-banner";

const sampleEvent: EarthquakeEvent = {
  eventID: "42",
  date: "2026-02-15T01:00:00",
  location: "Gediz (Kütahya)",
  latitude: 39.0225,
  longitude: 29.70083,
  depth: 5.17,
  magnitude: 4.4,
  type: "ML",
  rms: 0.35,
  country: "Türkiye",
  province: "Kütahya",
  district: "Gediz",
  neighborhood: "Çukurören",
  isEventUpdate: false,
  lastUpdateDate: null,
};

describe("CriticalAlertBanner", () => {
  it("kritik deprem varsa bannerı gösterir", () => {
    render(
      <CriticalAlertBanner
        criticalEvent={sampleEvent}
        threshold={4}
        soundEnabled={false}
        onToggleSound={vi.fn()}
        onFocusEvent={vi.fn()}
      />,
    );

    expect(screen.getByTestId("critical-banner")).toBeInTheDocument();
    expect(screen.getByText(/Gediz/)).toBeInTheDocument();
  });

  it("butonlar callback çağırır", () => {
    const onToggleSound = vi.fn();
    const onFocusEvent = vi.fn();

    render(
      <CriticalAlertBanner
        criticalEvent={sampleEvent}
        threshold={4}
        soundEnabled={false}
        onToggleSound={onToggleSound}
        onFocusEvent={onFocusEvent}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Haritada Göster" }));
    fireEvent.click(screen.getByRole("button", { name: /Ses:/ }));

    expect(onFocusEvent).toHaveBeenCalledWith("42");
    expect(onToggleSound).toHaveBeenCalledTimes(1);
  });
});
