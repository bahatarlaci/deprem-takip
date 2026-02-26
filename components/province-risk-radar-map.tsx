"use client";

import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import { ProvinceRiskItem } from "@/lib/risk-radar";

import styles from "./province-risk-radar.module.css";

interface ProvinceRiskRadarMapProps {
  items: ProvinceRiskItem[];
  activeProvince: string | null;
  onProvinceSelect: (province: string) => void;
}

function riskColor(level: ProvinceRiskItem["level"]): string {
  if (level === "high") {
    return "#e24b3c";
  }

  if (level === "medium") {
    return "#e8a43f";
  }

  return "#2b9edb";
}

function riskRadius(score: number): number {
  return Math.max(6, Math.min(20, 6 + score / 7));
}

export default function ProvinceRiskRadarMap({
  items,
  activeProvince,
  onProvinceSelect,
}: ProvinceRiskRadarMapProps) {
  return (
    <MapContainer className={styles.radarMap} center={[39, 35]} zoom={5} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {items.map((item) => {
        const selected = item.province === activeProvince;
        const color = riskColor(item.level);

        return (
          <CircleMarker
            key={item.province}
            center={[item.centroidLat, item.centroidLon]}
            radius={riskRadius(item.score)}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: selected ? 0.85 : 0.6,
              weight: selected ? 3 : 1.5,
            }}
            eventHandlers={{
              click: () => onProvinceSelect(item.province),
            }}
          >
            <Popup>
              <div className={styles.popup}>
                <strong>{item.province}</strong>
                <span>Risk Skoru: {item.score}</span>
                <span>Deprem Sayısı: {item.eventCount}</span>
                <span>Maks Büyüklük: {item.maxMagnitude.toFixed(1)}</span>
                <span>Ort. Derinlik: {item.avgDepth.toFixed(1)} km</span>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
