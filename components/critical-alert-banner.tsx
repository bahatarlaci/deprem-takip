"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EarthquakeEvent } from "@/lib/types";

interface CriticalAlertBannerProps {
  criticalEvent: EarthquakeEvent | null;
  threshold: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onFocusEvent: (eventId: string) => void;
}

export function CriticalAlertBanner({
  criticalEvent,
  threshold,
  soundEnabled,
  onToggleSound,
  onFocusEvent,
}: CriticalAlertBannerProps) {
  if (!criticalEvent) {
    return null;
  }

  return (
    <Alert
      data-testid="critical-banner"
      className="flex flex-col gap-3 border-amber-300 bg-gradient-to-r from-amber-100/85 to-orange-100/90 text-amber-950 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <AlertTitle className="mb-2 font-semibold">Kritik Deprem Uyarısı</AlertTitle>
        <AlertDescription>
          {threshold.toFixed(1)}+ eşik aşıldı: <b>{criticalEvent.location}</b> - M
          {criticalEvent.magnitude.toFixed(1)}
        </AlertDescription>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-500 bg-white/70 text-amber-950 hover:bg-amber-100"
          onClick={() => onFocusEvent(criticalEvent.eventID)}
        >
          Haritada Göster
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-500 bg-white/70 text-amber-950 hover:bg-amber-100"
          onClick={onToggleSound}
        >
          Ses: {soundEnabled ? "Açık" : "Kapalı"}
        </Button>
      </div>
    </Alert>
  );
}
