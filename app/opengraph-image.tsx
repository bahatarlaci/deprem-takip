import { ImageResponse } from "next/og";

import { SITE_NAME } from "@/lib/seo";

export const runtime = "edge";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #e4f4ff 0%, #f7fbff 55%, #d8ebff 100%)",
          padding: "70px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 32, color: "#3d5772", letterSpacing: 2 }}>AFAD EARTHQUAKE API</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: "#0f2b47" }}>{SITE_NAME}</div>
          <div style={{ fontSize: 34, color: "#31506f" }}>
            Canlı deprem takibi, harita analizi ve anlık alarm yönetimi
          </div>
        </div>
        <div style={{ fontSize: 28, color: "#4a6988" }}>deprem-takip • Türkiye</div>
      </div>
    ),
    {
      ...size,
    },
  );
}
