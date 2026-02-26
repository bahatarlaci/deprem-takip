"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CriticalAlertBanner } from "@/components/critical-alert-banner";
import { EarthquakeList } from "@/components/earthquake-list";
import { NotificationRulePanel } from "@/components/notification-rule-panel";
import { SummaryCards } from "@/components/summary-cards";
import { Button } from "@/components/ui/button";
import { createDefaultFilters, useEarthquakes } from "@/hooks/use-earthquakes";
import { useNotificationAlerts } from "@/hooks/use-notification-alerts";

const CRITICAL_THRESHOLD = 4.0;

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

export default function NotificationsPage() {
  const defaults = useMemo(() => createDefaultFilters(), []);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const { data, meta, isLoading, isRefreshing, error, refresh } = useEarthquakes(defaults);
  const {
    notificationRule,
    notificationPermission,
    lastNotificationLabel,
    setNotificationRule,
    requestNotificationPermission,
    sendTestNotification,
    clearNotificationHistory,
  } = useNotificationAlerts(data);

  const criticalEvent = useMemo(() => {
    return (
      data
        .filter((event) => event.magnitude >= CRITICAL_THRESHOLD)
        .sort((left, right) => {
          if (right.magnitude !== left.magnitude) {
            return right.magnitude - left.magnitude;
          }

          return Date.parse(right.date) - Date.parse(left.date);
        })[0] ?? null
    );
  }, [data]);

  const previousCriticalIdRef = useRef<string | null>(null);
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

  const effectiveSelectedEventId = useMemo(() => {
    if (selectedEventId && data.some((event) => event.eventID === selectedEventId)) {
      return selectedEventId;
    }

    return data[0]?.eventID ?? null;
  }, [data, selectedEventId]);

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">Bildirimler</p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Anlık Alarm Yönetimi</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
            M, il/ilçe ve derinlik kurallarını belirle; yeni eşleşen depremler için tarayıcı bildirimi al.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void refresh()} disabled={isLoading}>
          Manuel Yenile
        </Button>
      </header>

      <SummaryCards events={data} meta={meta} isRefreshing={isRefreshing} />

      <NotificationRulePanel
        rule={notificationRule}
        permission={notificationPermission}
        onRuleChange={setNotificationRule}
        onRequestPermission={requestNotificationPermission}
        onClearHistory={clearNotificationHistory}
        onSendTest={sendTestNotification}
        lastTriggeredLabel={lastNotificationLabel}
      />

      <CriticalAlertBanner
        criticalEvent={criticalEvent}
        threshold={CRITICAL_THRESHOLD}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((previous) => !previous)}
        onFocusEvent={setSelectedEventId}
      />

      {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">İzlenen Depremler</h3>
        <EarthquakeList
          events={data}
          selectedEventId={effectiveSelectedEventId}
          onSelectEvent={setSelectedEventId}
          isLoading={isLoading}
          detailHrefBuilder={(event) => "/depremler/" + event.eventID}
        />
      </section>
    </div>
  );
}
