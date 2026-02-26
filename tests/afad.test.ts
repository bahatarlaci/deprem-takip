import { describe, expect, it } from "vitest";

import {
  QueryValidationError,
  buildAfadSearchParams,
  normalizeAfadPayload,
  parseEarthquakeQuery,
} from "@/lib/afad";

describe("parseEarthquakeQuery", () => {
  it("start ve end zorunlu alanlarını doğrular", () => {
    expect(() => parseEarthquakeQuery(new URLSearchParams("end=2026-02-15T23:59:59"))).toThrow(
      QueryValidationError,
    );
  });

  it("yarıçap filtresi aktifken kutu filtresini yok sayar", () => {
    const { query, radialOverridesBounding } = parseEarthquakeQuery(
      new URLSearchParams(
        [
          "start=2026-02-14T00:00:00",
          "end=2026-02-15T00:00:00",
          "lat=39",
          "lon=35",
          "maxrad=100000",
          "minlat=38",
          "maxlat=40",
          "minlon=34",
          "maxlon=36",
        ].join("&"),
      ),
    );

    expect(radialOverridesBounding).toBe(true);
    expect(query.lat).toBe(39);
    expect(query.minlat).toBeUndefined();
    expect(query.maxlon).toBeUndefined();
  });

  it("start tarihi end tarihinden büyük olamaz", () => {
    expect(() =>
      parseEarthquakeQuery(new URLSearchParams("start=2026-02-16T00:00:00&end=2026-02-15T00:00:00")),
    ).toThrow(QueryValidationError);
  });
});

describe("buildAfadSearchParams", () => {
  it("format değerini json olarak sabitler", () => {
    const params = buildAfadSearchParams({
      start: "2026-02-14T00:00:00",
      end: "2026-02-15T00:00:00",
      limit: 200,
      orderby: "timedesc",
    });

    expect(params.get("format")).toBe("json");
    expect(params.get("orderby")).toBe("timedesc");
  });
});

describe("normalizeAfadPayload", () => {
  it("AFAD event dizisini normalize eder", () => {
    const data = normalizeAfadPayload([
      {
        rms: "0.35",
        eventID: "1",
        location: "Gediz (Kütahya)",
        latitude: "39.0225",
        longitude: "29.70083",
        depth: "5.17",
        type: "ML",
        magnitude: "2.0",
        country: "Türkiye",
        province: "Kütahya",
        district: "Gediz",
        neighborhood: "Çukurören",
        date: "2026-01-15T01:51:03",
        isEventUpdate: false,
        lastUpdateDate: null,
      },
    ]);

    expect(data[0].magnitude).toBe(2);
    expect(data[0].depth).toBeCloseTo(5.17);
    expect(data[0].latitude).toBeCloseTo(39.0225);
  });
});
