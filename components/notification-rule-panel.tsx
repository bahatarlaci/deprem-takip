"use client";

import { Bell, BellOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NotificationRule } from "@/lib/notifications";

export type NotificationPermissionState = NotificationPermission | "unsupported";

interface NotificationRulePanelProps {
  rule: NotificationRule;
  permission: NotificationPermissionState;
  onRuleChange: (rule: NotificationRule) => void;
  onRequestPermission: () => Promise<void>;
  onClearHistory: () => void;
  onSendTest: () => Promise<void>;
  lastTriggeredLabel: string | null;
}

function permissionMeta(permission: NotificationPermissionState): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (permission === "granted") {
    return { label: "İzin verildi", variant: "default" };
  }

  if (permission === "denied") {
    return { label: "İzin reddedildi", variant: "destructive" };
  }

  if (permission === "unsupported") {
    return { label: "Tarayıcı desteklemiyor", variant: "outline" };
  }

  return { label: "İzin bekleniyor", variant: "secondary" };
}

function parseNumericInput(value: string): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function NotificationRulePanel({
  rule,
  permission,
  onRuleChange,
  onRequestPermission,
  onClearHistory,
  onSendTest,
  lastTriggeredLabel,
}: NotificationRulePanelProps) {
  const permissionStatus = permissionMeta(permission);

  return (
    <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">Anlık Bildirim</p>
            <CardTitle className="text-lg">Web Push Alarm Kuralı</CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={permissionStatus.variant}>{permissionStatus.label}</Badge>
            <Button
              type="button"
              size="sm"
              variant={rule.enabled ? "default" : "outline"}
              onClick={() => onRuleChange({ ...rule, enabled: !rule.enabled })}
            >
              {rule.enabled ? (
                <>
                  <Bell className="h-4 w-4" />
                  Alarm Açık
                </>
              ) : (
                <>
                  <BellOff className="h-4 w-4" />
                  Alarm Kapalı
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="rule-minMagnitude">M &gt;=</Label>
            <Input
              id="rule-minMagnitude"
              type="number"
              step="0.1"
              value={rule.minMagnitude}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (!Number.isFinite(parsed)) {
                  return;
                }

                onRuleChange({ ...rule, minMagnitude: Math.max(0, Number(parsed.toFixed(1))) });
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-province">İl</Label>
            <Input
              id="rule-province"
              type="text"
              placeholder="Örn: Kütahya"
              value={rule.province}
              onChange={(event) => onRuleChange({ ...rule, province: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-district">İlçe</Label>
            <Input
              id="rule-district"
              type="text"
              placeholder="Örn: Gediz"
              value={rule.district}
              onChange={(event) => onRuleChange({ ...rule, district: event.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-minDepth">Min Derinlik (km)</Label>
            <Input
              id="rule-minDepth"
              type="number"
              step="0.1"
              placeholder="Opsiyonel"
              value={rule.minDepth ?? ""}
              onChange={(event) =>
                onRuleChange({
                  ...rule,
                  minDepth: parseNumericInput(event.target.value),
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rule-maxDepth">Max Derinlik (km)</Label>
            <Input
              id="rule-maxDepth"
              type="number"
              step="0.1"
              placeholder="Opsiyonel"
              value={rule.maxDepth ?? ""}
              onChange={(event) =>
                onRuleChange({
                  ...rule,
                  maxDepth: parseNumericInput(event.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void onRequestPermission()}
            disabled={permission === "granted" || permission === "unsupported"}
          >
            Bildirim izni iste
          </Button>
          <Button type="button" variant="outline" onClick={() => void onSendTest()} disabled={permission !== "granted"}>
            Test bildirimi gönder
          </Button>
          <Button type="button" variant="ghost" onClick={onClearHistory}>
            Bildirim geçmişini temizle
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {lastTriggeredLabel
            ? `Son alarm: ${lastTriggeredLabel}`
            : "Henüz eşleşen yeni deprem bildirimi gönderilmedi."}
        </p>
      </CardContent>
    </Card>
  );
}
