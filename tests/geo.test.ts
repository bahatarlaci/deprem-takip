import { describe, expect, it } from "vitest";

import { haversineDistanceKm } from "@/lib/geo";

describe("haversineDistanceKm", () => {
  it("aynı koordinatlar için 0 döner", () => {
    expect(haversineDistanceKm(39, 29, 39, 29)).toBe(0);
  });

  it("İstanbul-Ankara arası yaklaşık mesafeyi hesaplar", () => {
    const distance = haversineDistanceKm(41.0082, 28.9784, 39.9334, 32.8597);

    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(360);
  });
});
