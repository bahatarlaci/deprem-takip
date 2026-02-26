import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(120deg, #def3ff 0%, #f6fbff 45%, #d4e8ff 100%)",
          padding: "66px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: "#37526d", letterSpacing: 2 }}>CANLI DEPREM TAKİBİ</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 66, fontWeight: 700, color: "#112f4c" }}>{SITE_NAME}</div>
          <div style={{ fontSize: 32, color: "#395877" }}>
            Filtreleme • Harita • Risk Analizi • Bildirimler
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#4f6d8b" }}>AFAD verisi ile 60 sn auto-refresh</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
