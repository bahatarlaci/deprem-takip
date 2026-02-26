import { EarthquakeEvent } from "@/lib/types";

export const NOTIFICATION_RULE_STORAGE_KEY = "deprem_notification_rule_v1";
export const NOTIFIED_EVENT_IDS_STORAGE_KEY = "deprem_notified_event_ids_v1";
const NOTIFIED_EVENT_IDS_LIMIT = 400;

export interface NotificationRule {
  enabled: boolean;
  minMagnitude: number;
  province: string;
  district: string;
  minDepth: number | null;
  maxDepth: number | null;
}

export const DEFAULT_NOTIFICATION_RULE: NotificationRule = {
  enabled: false,
  minMagnitude: 4,
  province: "",
  district: "",
  minDepth: null,
  maxDepth: null,
};

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

function normalizeMaybeNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function parseNotificationRule(payload: unknown): NotificationRule {
  if (!payload || typeof payload !== "object") {
    return DEFAULT_NOTIFICATION_RULE;
  }

  const candidate = payload as Partial<NotificationRule>;

  const minMagnitude = Number(candidate.minMagnitude);
  const parsedMinMagnitude = Number.isFinite(minMagnitude)
    ? Math.max(0, Number(minMagnitude.toFixed(1)))
    : DEFAULT_NOTIFICATION_RULE.minMagnitude;

  const minDepth = normalizeMaybeNumber(candidate.minDepth);
  const maxDepth = normalizeMaybeNumber(candidate.maxDepth);

  return {
    enabled: Boolean(candidate.enabled),
    minMagnitude: parsedMinMagnitude,
    province: typeof candidate.province === "string" ? candidate.province.trim() : "",
    district: typeof candidate.district === "string" ? candidate.district.trim() : "",
    minDepth,
    maxDepth,
  };
}

export function parseNotifiedEventIds(payload: unknown): Set<string> {
  if (!Array.isArray(payload)) {
    return new Set<string>();
  }

  const ids = payload
    .filter((item): item is string => typeof item === "string")
    .slice(0, NOTIFIED_EVENT_IDS_LIMIT);

  return new Set(ids);
}

export function matchNotificationRule(event: EarthquakeEvent, rule: NotificationRule): boolean {
  if (event.magnitude < rule.minMagnitude) {
    return false;
  }

  if (rule.province && normalizeText(event.province) !== normalizeText(rule.province)) {
    return false;
  }

  if (rule.district && normalizeText(event.district) !== normalizeText(rule.district)) {
    return false;
  }

  if (rule.minDepth != null && event.depth < rule.minDepth) {
    return false;
  }

  if (rule.maxDepth != null && event.depth > rule.maxDepth) {
    return false;
  }

  return true;
}

export function findNewMatchingEvents(
  events: EarthquakeEvent[],
  rule: NotificationRule,
  notifiedIds: Set<string>,
): EarthquakeEvent[] {
  if (!rule.enabled) {
    return [];
  }

  return events.filter((event) => !notifiedIds.has(event.eventID) && matchNotificationRule(event, rule));
}

export function trackNotifiedEvents(notifiedIds: Set<string>, events: EarthquakeEvent[]): Set<string> {
  const next = new Set(notifiedIds);

  for (const event of events) {
    next.add(event.eventID);
  }

  if (next.size <= NOTIFIED_EVENT_IDS_LIMIT) {
    return next;
  }

  const items = Array.from(next);
  return new Set(items.slice(items.length - NOTIFIED_EVENT_IDS_LIMIT));
}

export function serializeNotifiedEventIds(notifiedIds: Set<string>): string[] {
  return Array.from(notifiedIds).slice(-NOTIFIED_EVENT_IDS_LIMIT);
}
