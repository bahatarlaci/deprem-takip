import { EarthquakeEvent } from "@/lib/types";

export type RiskLevel = "low" | "medium" | "high";

export interface ProvinceRiskItem {
  province: string;
  eventCount: number;
  maxMagnitude: number;
  avgDepth: number;
  centroidLat: number;
  centroidLon: number;
  score: number;
  level: RiskLevel;
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 70) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

export function buildProvinceRiskRadar(events: EarthquakeEvent[]): ProvinceRiskItem[] {
  const groupedByProvince = new Map<string, EarthquakeEvent[]>();

  for (const event of events) {
    const province = event.province?.trim();
    if (!province) {
      continue;
    }

    const provinceEvents = groupedByProvince.get(province) ?? [];
    provinceEvents.push(event);
    groupedByProvince.set(province, provinceEvents);
  }

  if (groupedByProvince.size === 0) {
    return [];
  }

  const draft = Array.from(groupedByProvince.entries()).map(([province, provinceEvents]) => {
    const eventCount = provinceEvents.length;
    const maxMagnitude = Math.max(...provinceEvents.map((event) => event.magnitude));

    const depthSum = provinceEvents.reduce((sum, event) => sum + event.depth, 0);
    const latSum = provinceEvents.reduce((sum, event) => sum + event.latitude, 0);
    const lonSum = provinceEvents.reduce((sum, event) => sum + event.longitude, 0);

    return {
      province,
      eventCount,
      maxMagnitude,
      avgDepth: depthSum / eventCount,
      centroidLat: latSum / eventCount,
      centroidLon: lonSum / eventCount,
    };
  });

  const maxCount = Math.max(...draft.map((item) => item.eventCount), 1);
  const maxMagnitude = Math.max(...draft.map((item) => item.maxMagnitude), 1);

  return draft
    .map((item) => {
      const countNorm = item.eventCount / maxCount;
      const magnitudeNorm = item.maxMagnitude / maxMagnitude;
      const depthNorm = 1 - Math.min(item.avgDepth, 70) / 70;

      const score = Number(
        ((countNorm * 0.45 + magnitudeNorm * 0.4 + depthNorm * 0.15) * 100).toFixed(1),
      );

      return {
        ...item,
        score,
        level: toRiskLevel(score),
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.eventCount !== left.eventCount) {
        return right.eventCount - left.eventCount;
      }

      return right.maxMagnitude - left.maxMagnitude;
    });
}
