import { describe, expect, it } from "vitest";

import {
  DEFAULT_NOTIFICATION_RULE,
  findNewMatchingEvents,
  matchNotificationRule,
  parseNotificationRule,
  trackNotifiedEvents,
} from "@/lib/notifications";
import { EarthquakeEvent } from "@/lib/types";

function eventFactory(partial: Partial<EarthquakeEvent>): EarthquakeEvent {
  return {
    eventID: "1",
    date: "2026-02-15T12:00:00",
    location: "Gediz (Kütahya)",
    latitude: 39,
    longitude: 29,
    depth: 8,
    magnitude: 4.3,
    type: "ML",
    rms: 0.2,
    country: "Türkiye",
    province: "Kütahya",
    district: "Gediz",
    neighborhood: "Merkez",
    isEventUpdate: false,
    lastUpdateDate: null,
    ...partial,
  };
}

describe("notification rules", () => {
  it("M, il, ilçe ve derinlik kuralını doğru eşler", () => {
    const rule = {
      enabled: true,
      minMagnitude: 4,
      province: "Kütahya",
      district: "Gediz",
      minDepth: 5,
      maxDepth: 12,
    };

    expect(matchNotificationRule(eventFactory({ magnitude: 4.6, depth: 9 }), rule)).toBe(true);
    expect(matchNotificationRule(eventFactory({ magnitude: 3.9 }), rule)).toBe(false);
    expect(matchNotificationRule(eventFactory({ province: "İzmir" }), rule)).toBe(false);
    expect(matchNotificationRule(eventFactory({ district: "Simav" }), rule)).toBe(false);
    expect(matchNotificationRule(eventFactory({ depth: 20 }), rule)).toBe(false);
  });

  it("daha önce bildirilen eventID'leri tekrar döndürmez", () => {
    const rule = {
      ...DEFAULT_NOTIFICATION_RULE,
      enabled: true,
      minMagnitude: 4,
    };

    const events = [eventFactory({ eventID: "a", magnitude: 4.4 }), eventFactory({ eventID: "b", magnitude: 4.1 })];
    const notified = new Set(["a"]);

    const result = findNewMatchingEvents(events, rule, notified);
    expect(result).toHaveLength(1);
    expect(result[0].eventID).toBe("b");
  });

  it("parseNotificationRule bozuk veride default döndürür", () => {
    expect(parseNotificationRule(null)).toEqual(DEFAULT_NOTIFICATION_RULE);
    expect(parseNotificationRule({ enabled: true, minMagnitude: "x" })).toEqual({
      ...DEFAULT_NOTIFICATION_RULE,
      enabled: true,
    });
  });

  it("trackNotifiedEvents yeni eventIDleri sete ekler", () => {
    const initial = new Set(["a", "b"]);
    const next = trackNotifiedEvents(initial, [eventFactory({ eventID: "c" }), eventFactory({ eventID: "d" })]);

    expect(next.has("a")).toBe(true);
    expect(next.has("d")).toBe(true);
  });
});
