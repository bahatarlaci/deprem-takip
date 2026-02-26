"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { buildProvinceRiskRadar } from "@/lib/risk-radar";
import { EarthquakeEvent } from "@/lib/types";

import styles from "./province-risk-radar.module.css";

const ProvinceRiskRadarMap = dynamic(() => import("@/components/province-risk-radar-map"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Radar haritası yükleniyor...</div>,
});

interface ProvinceRiskRadarProps {
  events: EarthquakeEvent[];
  activeProvince: string | null;
  onProvinceSelect: (province: string) => void;
  onClear: () => void;
}

function levelText(level: "low" | "medium" | "high"): string {
  if (level === "high") {
    return "Yüksek";
  }

  if (level === "medium") {
    return "Orta";
  }

  return "Düşük";
}

export function ProvinceRiskRadar({
  events,
  activeProvince,
  onProvinceSelect,
  onClear,
}: ProvinceRiskRadarProps) {
  const radarItems = useMemo(() => buildProvinceRiskRadar(events), [events]);
  const top10 = useMemo(() => radarItems.slice(0, 10), [radarItems]);

  return (
    <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">İl Bazlı Risk Radar</p>
            <CardTitle className="text-xl">Türkiye genelinde risk yoğunluğu</CardTitle>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeProvince ? <Badge variant="secondary">Aktif il: {activeProvince}</Badge> : null}
            <Button type="button" variant="outline" size="sm" onClick={onClear} disabled={!activeProvince}>
              İl filtresini temizle
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
          <div className={cn(styles.mapPanel, "rounded-xl border border-border/80")}> 
            {radarItems.length === 0 ? (
              <p className={styles.empty}>Radar için yeterli il verisi yok.</p>
            ) : (
              <ProvinceRiskRadarMap
                items={radarItems}
                activeProvince={activeProvince}
                onProvinceSelect={onProvinceSelect}
              />
            )}
          </div>

          <Card className="border-border/80 bg-slate-50/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">En hareketli 10 il</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>İl</TableHead>
                    <TableHead>Skor</TableHead>
                    <TableHead>Deprem</TableHead>
                    <TableHead>Max M</TableHead>
                    <TableHead>Seviye</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top10.map((item) => (
                    <TableRow
                      key={item.province}
                      className={cn(
                        "cursor-pointer",
                        activeProvince === item.province ? "bg-sky-100/70 hover:bg-sky-100" : undefined,
                      )}
                      onClick={() => onProvinceSelect(item.province)}
                    >
                      <TableCell>{item.province}</TableCell>
                      <TableCell>{item.score}</TableCell>
                      <TableCell>{item.eventCount}</TableCell>
                      <TableCell>{item.maxMagnitude.toFixed(1)}</TableCell>
                      <TableCell>{levelText(item.level)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
