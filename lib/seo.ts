const FALLBACK_SITE_URL = "https://deprem-takip.vercel.app";

export const SITE_NAME = "Deprem Takip Platformu";
export const DEFAULT_SEO_DESCRIPTION =
  "AFAD verisi ile gerçek zamanlı deprem takibi, filtreleme, harita analizi ve bildirim yönetimi.";

export const DEFAULT_KEYWORDS = [
  "AFAD deprem",
  "deprem takip",
  "Türkiye deprem haritası",
  "canlı deprem",
  "deprem bildirimi",
  "deprem risk analizi",
];

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || FALLBACK_SITE_URL;
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return `https://${raw}`;
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
