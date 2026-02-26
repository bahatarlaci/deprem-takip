"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

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
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>İl Bazlı Risk Radar</p>
          <h2>Türkiye genelinde risk yoğunluğu</h2>
        </div>
        <div className={styles.actions}>
          {activeProvince ? <span className={styles.badge}>Aktif il: {activeProvince}</span> : null}
          <button type="button" className={styles.clearButton} onClick={onClear} disabled={!activeProvince}>
            İl filtresini temizle
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mapPanel}>
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

        <div className={styles.tablePanel}>
          <h3>En hareketli 10 il</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>İl</th>
                  <th>Skor</th>
                  <th>Deprem</th>
                  <th>Max M</th>
                  <th>Seviye</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((item) => (
                  <tr
                    key={item.province}
                    className={activeProvince === item.province ? styles.activeRow : undefined}
                    onClick={() => onProvinceSelect(item.province)}
                  >
                    <td>{item.province}</td>
                    <td>{item.score}</td>
                    <td>{item.eventCount}</td>
                    <td>{item.maxMagnitude.toFixed(1)}</td>
                    <td>{levelText(item.level)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
