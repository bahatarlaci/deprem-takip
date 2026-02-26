"use client";

import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_NOTIFICATION_RULE,
  NOTIFICATION_RULE_STORAGE_KEY,
  NOTIFIED_EVENT_IDS_STORAGE_KEY,
  NotificationPermissionState,
  NotificationRule,
  findNewMatchingEvents,
  parseNotificationRule,
  parseNotifiedEventIds,
  serializeNotifiedEventIds,
  trackNotifiedEvents,
} from "@/lib/notifications";
import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeEvent } from "@/lib/types";

interface UseNotificationAlertsResult {
  notificationRule: NotificationRule;
  notificationPermission: NotificationPermissionState;
  lastNotificationLabel: string | null;
  setNotificationRule: (rule: NotificationRule) => void;
  requestNotificationPermission: () => Promise<void>;
  sendTestNotification: () => Promise<void>;
  clearNotificationHistory: () => void;
}

function loadNotificationRuleFromStorage(): NotificationRule {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_RULE;
  }

  try {
    const savedRule = window.localStorage.getItem(NOTIFICATION_RULE_STORAGE_KEY);
    if (!savedRule) {
      return DEFAULT_NOTIFICATION_RULE;
    }

    return parseNotificationRule(JSON.parse(savedRule));
  } catch {
    return DEFAULT_NOTIFICATION_RULE;
  }
}

function loadNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return window.Notification.permission;
}

export function useNotificationAlerts(events: EarthquakeEvent[]): UseNotificationAlertsResult {
  const [notificationRule, setNotificationRule] = useState<NotificationRule>(DEFAULT_NOTIFICATION_RULE);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>("default");
  const [lastNotificationLabel, setLastNotificationLabel] = useState<string | null>(null);

  const notifiedEventIdsRef = useRef<Set<string>>(new Set());
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);
  const notificationStreamPrimedRef = useRef(false);
  const notificationHydratedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedNotifiedIds = window.localStorage.getItem(NOTIFIED_EVENT_IDS_STORAGE_KEY);
      if (savedNotifiedIds) {
        notifiedEventIdsRef.current = parseNotifiedEventIds(JSON.parse(savedNotifiedIds));
      }
    } catch {
      notifiedEventIdsRef.current = new Set();
    }

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/deprem-notification-sw.js")
        .then((registration) => {
          serviceWorkerRef.current = registration;
        })
        .catch(() => {
          serviceWorkerRef.current = null;
        });
    }

    const syncTimeout = window.setTimeout(() => {
      notificationHydratedRef.current = true;
      setNotificationRule(loadNotificationRuleFromStorage());
      setNotificationPermission(loadNotificationPermission());
    }, 0);

    return () => {
      window.clearTimeout(syncTimeout);
    };
  }, []);

  useEffect(() => {
    if (!notificationHydratedRef.current || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      NOTIFICATION_RULE_STORAGE_KEY,
      JSON.stringify(notificationRule),
    );
  }, [notificationRule]);

  useEffect(() => {
    if (!notificationHydratedRef.current || typeof window === "undefined") {
      return;
    }

    if (events.length === 0) {
      return;
    }

    const unseenEvents = events.filter((event) => !notifiedEventIdsRef.current.has(event.eventID));
    if (unseenEvents.length === 0) {
      return;
    }

    notifiedEventIdsRef.current = trackNotifiedEvents(notifiedEventIdsRef.current, unseenEvents);
    window.localStorage.setItem(
      NOTIFIED_EVENT_IDS_STORAGE_KEY,
      JSON.stringify(serializeNotifiedEventIds(notifiedEventIdsRef.current)),
    );

    if (!notificationStreamPrimedRef.current) {
      notificationStreamPrimedRef.current = true;
      return;
    }

    if (!notificationRule.enabled || notificationPermission !== "granted") {
      return;
    }

    const matchedEvents = findNewMatchingEvents(unseenEvents, notificationRule, new Set<string>());
    if (matchedEvents.length === 0) {
      return;
    }

    const sortedMatchedEvents = [...matchedEvents].sort(
      (left, right) => Date.parse(left.date) - Date.parse(right.date),
    );

    void (async () => {
      for (const event of sortedMatchedEvents.slice(-3)) {
        const title = `Deprem Alarmı · M ${event.magnitude.toFixed(1)}`;
        const body = `${event.province}${event.district ? `/${event.district}` : ""} - Derinlik ${event.depth.toFixed(1)} km`;
        const url = `/harita?eventId=${event.eventID}`;

        if (serviceWorkerRef.current) {
          await serviceWorkerRef.current.showNotification(title, {
            body,
            tag: `deprem-${event.eventID}`,
            data: { url, eventID: event.eventID },
          });
        } else if ("Notification" in window) {
          new window.Notification(title, {
            body,
            tag: `deprem-${event.eventID}`,
          });
        }

        setLastNotificationLabel(`${event.location} (${formatIstanbulDateTime(event.date)})`);
      }
    })();
  }, [events, notificationPermission, notificationRule]);

  const requestNotificationPermission = async (): Promise<void> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const sendTestNotification = async (): Promise<void> => {
    if (typeof window === "undefined" || notificationPermission !== "granted") {
      return;
    }

    const title = "Deprem Alarmı · Test Bildirimi";
    const body = "Bildirim sistemi aktif. Yeni eşleşen deprem olduğunda burada göreceksiniz.";

    if (serviceWorkerRef.current) {
      await serviceWorkerRef.current.showNotification(title, {
        body,
        tag: "deprem-test-notification",
        data: { url: "/bildirimler" },
      });
    } else if ("Notification" in window) {
      new window.Notification(title, { body, tag: "deprem-test-notification" });
    }
  };

  const clearNotificationHistory = (): void => {
    notifiedEventIdsRef.current = new Set<string>();
    notificationStreamPrimedRef.current = false;
    setLastNotificationLabel(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(NOTIFIED_EVENT_IDS_STORAGE_KEY, JSON.stringify([]));
    }
  };

  return {
    notificationRule,
    notificationPermission,
    lastNotificationLabel,
    setNotificationRule,
    requestNotificationPermission,
    sendTestNotification,
    clearNotificationHistory,
  };
}
