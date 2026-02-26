"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CriticalAlertBanner } from "@/components/critical-alert-banner";
import { EarthquakeList } from "@/components/earthquake-list";
import { EarthquakeMap } from "@/components/earthquake-map";
import { FilterPanel } from "@/components/filter-panel";
import {
  NotificationPermissionState,
  NotificationRulePanel,
} from "@/components/notification-rule-panel";
import { ProvinceRiskRadar } from "@/components/province-risk-radar";
import { SummaryCards } from "@/components/summary-cards";
import { Button } from "@/components/ui/button";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";
import {
  DEFAULT_NOTIFICATION_RULE,
  NOTIFICATION_RULE_STORAGE_KEY,
  NOTIFIED_EVENT_IDS_STORAGE_KEY,
  findNewMatchingEvents,
  parseNotificationRule,
  parseNotifiedEventIds,
  serializeNotifiedEventIds,
  trackNotifiedEvents,
  type NotificationRule,
} from "@/lib/notifications";
import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeFilters } from "@/lib/types";

import styles from "./page.module.css";

const CRITICAL_THRESHOLD = 4.0;

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

function playAlertTone(): void {
  const AudioContextConstructor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) {
    return;
  }
  const audioContext = new AudioContextConstructor();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.02;

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.25);

  setTimeout(() => {
    void audioContext.close();
  }, 500);
}

export default function HomePage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [filters, setFilters] = useState<EarthquakeFilters>(defaults);
  const [appliedFilters, setAppliedFilters] = useState<EarthquakeFilters>(defaults);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [notificationRule, setNotificationRule] = useState<NotificationRule>(DEFAULT_NOTIFICATION_RULE);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState>("default");
  const [lastNotificationLabel, setLastNotificationLabel] = useState<string | null>(null);

  const { data, meta, isLoading, isRefreshing, error, refresh, clientRadialOverridesBounding } =
    useEarthquakes(appliedFilters);

  const notifiedEventIdsRef = useRef<Set<string>>(new Set());
  const serviceWorkerRef = useRef<ServiceWorkerRegistration | null>(null);
  const notificationStreamPrimedRef = useRef(false);
  const notificationHydratedRef = useRef(false);
  const pendingEventIdRef = useRef<string | null>(null);

  const effectiveActiveProvince = useMemo(() => {
    if (activeProvince && data.some((event) => event.province === activeProvince)) {
      return activeProvince;
    }

    return null;
  }, [activeProvince, data]);

  const displayedEvents = useMemo(() => {
    if (!effectiveActiveProvince) {
      return data;
    }

    return data.filter((event) => event.province === effectiveActiveProvince);
  }, [data, effectiveActiveProvince]);

  const criticalEvent = useMemo(() => {
    return (
      displayedEvents
        .filter((event) => event.magnitude >= CRITICAL_THRESHOLD)
        .sort((left, right) => {
          if (right.magnitude !== left.magnitude) {
            return right.magnitude - left.magnitude;
          }

          return Date.parse(right.date) - Date.parse(left.date);
        })[0] ?? null
    );
  }, [displayedEvents]);

  const summaryMeta = useMemo(() => {
    if (!meta) {
      return null;
    }

    return {
      ...meta,
      count: displayedEvents.length,
    };
  }, [displayedEvents.length, meta]);

  const previousCriticalIdRef = useRef<string | null>(null);
  const effectiveSelectedEventId = useMemo(() => {
    if (
      selectedEventId &&
      displayedEvents.some((event) => event.eventID === selectedEventId)
    ) {
      return selectedEventId;
    }

    return displayedEvents[0]?.eventID ?? null;
  }, [displayedEvents, selectedEventId]);

  useEffect(() => {
    const currentCriticalId = criticalEvent?.eventID ?? null;

    if (!currentCriticalId) {
      previousCriticalIdRef.current = null;
      return;
    }

    const isNewCritical = previousCriticalIdRef.current !== currentCriticalId;
    previousCriticalIdRef.current = currentCriticalId;

    if (isNewCritical && soundEnabled) {
      playAlertTone();
    }
  }, [criticalEvent, soundEnabled]);

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

    const eventIdFromUrl = new URLSearchParams(window.location.search).get("eventId");
    if (eventIdFromUrl) {
      pendingEventIdRef.current = eventIdFromUrl;
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
    if (!pendingEventIdRef.current) {
      return;
    }

    const pendingEventId = pendingEventIdRef.current;
    if (!displayedEvents.some((event) => event.eventID === pendingEventId)) {
      return;
    }

    setSelectedEventId(pendingEventId);
    pendingEventIdRef.current = null;
  }, [displayedEvents]);

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

    if (data.length === 0) {
      return;
    }

    const unseenEvents = data.filter((event) => !notifiedEventIdsRef.current.has(event.eventID));
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
        const url = `/?eventId=${event.eventID}`;

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

        setLastNotificationLabel(
          `${event.location} (${formatIstanbulDateTime(event.date)})`,
        );
      }
    })();
  }, [data, notificationPermission, notificationRule]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    const nextDefaults = createDefaultFilters();
    setFilters(nextDefaults);
    setAppliedFilters(nextDefaults);
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await window.Notification.requestPermission();
    setNotificationPermission(permission);
  };

  const handleSendTestNotification = async () => {
    if (typeof window === "undefined" || notificationPermission !== "granted") {
      return;
    }

    const title = "Deprem Alarmı · Test Bildirimi";
    const body = "Bildirim sistemi aktif. Yeni eşleşen deprem olduğunda burada göreceksiniz.";

    if (serviceWorkerRef.current) {
      await serviceWorkerRef.current.showNotification(title, {
        body,
        tag: "deprem-test-notification",
        data: { url: "/" },
      });
    } else if ("Notification" in window) {
      new window.Notification(title, { body, tag: "deprem-test-notification" });
    }
  };

  const handleClearNotificationHistory = () => {
    notifiedEventIdsRef.current = new Set<string>();
    notificationStreamPrimedRef.current = false;
    setLastNotificationLabel(null);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(NOTIFIED_EVENT_IDS_STORAGE_KEY, JSON.stringify([]));
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>AFAD Earthquake API</p>
          <h1>Deprem Takip Paneli</h1>
          <p className={styles.subtitle}>Türkiye genelindeki son depremleri filtrele, listede incele ve haritada takip et.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      <SummaryCards events={displayedEvents} meta={summaryMeta} isRefreshing={isRefreshing} />

      <NotificationRulePanel
        rule={notificationRule}
        permission={notificationPermission}
        onRuleChange={setNotificationRule}
        onRequestPermission={handleRequestNotificationPermission}
        onClearHistory={handleClearNotificationHistory}
        onSendTest={handleSendTestNotification}
        lastTriggeredLabel={lastNotificationLabel}
      />

      <ProvinceRiskRadar
        events={data}
        activeProvince={effectiveActiveProvince}
        onProvinceSelect={(province) => setActiveProvince(province)}
        onClear={() => setActiveProvince(null)}
      />

      <CriticalAlertBanner
        criticalEvent={criticalEvent}
        threshold={CRITICAL_THRESHOLD}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
        onFocusEvent={setSelectedEventId}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      <main className={styles.main}>
        <aside className={styles.sidebar}>
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            isLoading={isLoading}
            radialOverridesBounding={Boolean(meta?.radialOverridesBounding) || clientRadialOverridesBounding}
          />
        </aside>

        <section className={styles.content}>
          <EarthquakeMap
            events={displayedEvents}
            selectedEventId={effectiveSelectedEventId}
            onSelectEvent={setSelectedEventId}
          />
          <EarthquakeList
            events={displayedEvents}
            selectedEventId={effectiveSelectedEventId}
            onSelectEvent={setSelectedEventId}
            isLoading={isLoading}
          />
        </section>
      </main>
    </div>
  );
}
