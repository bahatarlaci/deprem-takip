import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";

const mockApiResponse = {
  data: [
    {
      eventID: "1",
      date: "2026-02-15T12:00:00",
      location: "Gediz (Kütahya)",
      latitude: 39.0225,
      longitude: 29.70083,
      depth: 5.17,
      magnitude: 2,
      type: "ML",
      rms: 0.35,
      country: "Türkiye",
      province: "Kütahya",
      district: "Gediz",
      neighborhood: "Çukurören",
      isEventUpdate: false,
      lastUpdateDate: null,
    },
  ],
  meta: {
    fetchedAt: "2026-02-15T12:01:00",
    count: 1,
    source: "https://deprem.afad.gov.tr/apiv2/event/filter",
    radialOverridesBounding: false,
  },
};

describe("useEarthquakes", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("ilk yüklemede fetch çalıştırır ve 60 saniyede bir yeniler", async () => {
    const filters = createDefaultFilters(new Date("2026-02-15T12:00:00Z"));
    let intervalHandler: (() => Promise<void> | void) | null = null;

    const setIntervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation((handler: TimerHandler): number => {
        intervalHandler = handler as () => Promise<void> | void;
        return 1;
      });

    vi.spyOn(window, "clearInterval").mockImplementation(() => undefined);

    renderHook(() => useEarthquakes(filters));

    const fetchMock = global.fetch as unknown as ReturnType<typeof vi.fn>;
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);

    await act(async () => {
      await intervalHandler?.();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
