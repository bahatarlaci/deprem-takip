import { describe, expect, it } from "vitest";

import { buildProvinceRiskRadar } from "@/lib/risk-radar";
import { EarthquakeEvent } from "@/lib/types";

const baseEvent: Omit<EarthquakeEvent, "eventID" | "province" | "magnitude" | "depth" | "latitude" | "longitude"> = {
  date: "2026-02-15T12:00:00",
  location: "X",
  type: "ML",
  rms: 0.3,
  country: "Türkiye",
  district: "Merkez",
  neighborhood: "A",
  isEventUpdate: false,
  lastUpdateDate: null,
};

function eventFactory(
  eventID: string,
  province: string,
  magnitude: number,
  depth: number,
  latitude: number,
  longitude: number,
): EarthquakeEvent {
  return {
    ...baseEvent,
    eventID,
    province,
    magnitude,
    depth,
    latitude,
    longitude,
  };
}

describe("buildProvinceRiskRadar", () => {
  it("illeri risk skoruna göre sıralar", () => {
    const result = buildProvinceRiskRadar([
      eventFactory("1", "Kütahya", 4.2, 8, 39, 29),
      eventFactory("2", "Kütahya", 3.1, 7, 39.1, 29.1),
      eventFactory("3", "İzmir", 2.6, 25, 38.4, 27.1),
      eventFactory("4", "İzmir", 2.4, 20, 38.3, 27),
      eventFactory("5", "Ankara", 1.8, 40, 39.9, 32.8),
    ]);

    expect(result).toHaveLength(3);
    expect(result[0].province).toBe("Kütahya");
    expect(result[0].score).toBeGreaterThan(result[1].score);
  });

  it("boş girdide boş sonuç döner", () => {
    expect(buildProvinceRiskRadar([])).toEqual([]);
  });
});
