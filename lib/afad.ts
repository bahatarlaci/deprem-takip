import { EarthquakeEvent, EarthquakeQuery, OrderBy } from "@/lib/types";

const VALID_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export const AFAD_BASE_URL = "https://deprem.afad.gov.tr/apiv2/event/filter";
export const DEFAULT_LIMIT = 200;
export const MAX_LIMIT = 10000;

export class QueryValidationError extends Error {
  readonly status = 400;
}

export class UpstreamTimeoutError extends Error {
  readonly status = 504;
}

export class UpstreamResponseError extends Error {
  readonly status = 502;
}

export class AfadUpstreamError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus?: number,
  ) {
    super(message);
  }
}

interface ParseResult {
  query: EarthquakeQuery;
  radialOverridesBounding: boolean;
}

interface AfadErrorPayload {
  status?: number;
  message?: string;
}

interface AfadRawEvent {
  rms: string | null;
  eventID: string;
  location: string;
  latitude: string;
  longitude: string;
  depth: string;
  type: string;
  magnitude: string;
  country: string;
  province: string;
  district: string;
  neighborhood: string;
  date: string;
  isEventUpdate: boolean;
  lastUpdateDate: string | null;
}

function parseNumberParam(name: string, value: string | null): number | undefined {
  if (value == null || value.trim() === "") {
    return undefined;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new QueryValidationError(`${name} sayısal bir değer olmalıdır.`);
  }

  return numberValue;
}

function parseDateTimeParam(name: string, value: string | null): string {
  if (!value) {
    throw new QueryValidationError(`${name} zorunludur.`);
  }

  if (!VALID_DATE_TIME.test(value)) {
    throw new QueryValidationError(
      `${name} ISO tarih formatında olmalıdır (örn: 2026-02-15T23:59:59).`,
    );
  }

  if (Number.isNaN(Date.parse(value))) {
    throw new QueryValidationError(`${name} geçerli bir tarih olmalıdır.`);
  }

  return value;
}

function ensureRange(minValue: number | undefined, maxValue: number | undefined, label: string): void {
  if (minValue == null || maxValue == null) {
    return;
  }

  if (minValue > maxValue) {
    throw new QueryValidationError(`${label} için minimum değer maksimumdan büyük olamaz.`);
  }
}

function parseOrderBy(value: string | null): OrderBy {
  if (value == null || value.trim() === "") {
    return "timedesc";
  }

  if (value !== "timedesc" && value !== "timeasc") {
    throw new QueryValidationError("orderby yalnızca 'timedesc' veya 'timeasc' olabilir.");
  }

  return value;
}

export function parseEarthquakeQuery(searchParams: URLSearchParams): ParseResult {
  const start = parseDateTimeParam("start", searchParams.get("start"));
  const end = parseDateTimeParam("end", searchParams.get("end"));

  if (Date.parse(start) > Date.parse(end)) {
    throw new QueryValidationError("start tarihi end tarihinden büyük olamaz.");
  }

  const limit = parseNumberParam("limit", searchParams.get("limit")) ?? DEFAULT_LIMIT;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new QueryValidationError(`limit 1 ile ${MAX_LIMIT} arasında bir tam sayı olmalıdır.`);
  }

  const query: EarthquakeQuery = {
    start,
    end,
    limit,
    orderby: parseOrderBy(searchParams.get("orderby")),
    eventid: searchParams.get("eventid")?.trim() || searchParams.get("eventID")?.trim() || undefined,
    minmag: parseNumberParam("minmag", searchParams.get("minmag")),
    maxmag: parseNumberParam("maxmag", searchParams.get("maxmag")),
    mindepth: parseNumberParam("mindepth", searchParams.get("mindepth")),
    maxdepth: parseNumberParam("maxdepth", searchParams.get("maxdepth")),
    minlat: parseNumberParam("minlat", searchParams.get("minlat")),
    maxlat: parseNumberParam("maxlat", searchParams.get("maxlat")),
    minlon: parseNumberParam("minlon", searchParams.get("minlon")),
    maxlon: parseNumberParam("maxlon", searchParams.get("maxlon")),
    lat: parseNumberParam("lat", searchParams.get("lat")),
    lon: parseNumberParam("lon", searchParams.get("lon")),
    minrad: parseNumberParam("minrad", searchParams.get("minrad")),
    maxrad: parseNumberParam("maxrad", searchParams.get("maxrad")),
  };

  ensureRange(query.minmag, query.maxmag, "Büyüklük");
  ensureRange(query.mindepth, query.maxdepth, "Derinlik");
  ensureRange(query.minlat, query.maxlat, "Enlem");
  ensureRange(query.minlon, query.maxlon, "Boylam");
  ensureRange(query.minrad, query.maxrad, "Yarıçap");

  const bboxFields = [query.minlat, query.maxlat, query.minlon, query.maxlon];
  const bboxCount = bboxFields.filter((value) => value != null).length;
  if (bboxCount > 0 && bboxCount < 4) {
    throw new QueryValidationError(
      "Kutu filtresi için minlat, maxlat, minlon ve maxlon birlikte gönderilmelidir.",
    );
  }

  const radialCount = [query.lat, query.lon, query.maxrad].filter((value) => value != null).length;
  if (radialCount > 0 && radialCount < 3) {
    throw new QueryValidationError("Yarıçap filtresi için lat, lon ve maxrad birlikte gönderilmelidir.");
  }

  const radialActive = radialCount === 3;
  const radialOverridesBounding = radialActive && bboxCount === 4;
  if (radialActive) {
    query.minlat = undefined;
    query.maxlat = undefined;
    query.minlon = undefined;
    query.maxlon = undefined;
  }

  return {
    query,
    radialOverridesBounding,
  };
}

function appendIfDefined(searchParams: URLSearchParams, key: string, value: string | number | undefined): void {
  if (value == null || value === "") {
    return;
  }

  searchParams.set(key, String(value));
}

export function buildAfadSearchParams(query: EarthquakeQuery): URLSearchParams {
  const searchParams = new URLSearchParams();

  appendIfDefined(searchParams, "start", query.start);
  appendIfDefined(searchParams, "end", query.end);
  appendIfDefined(searchParams, "limit", query.limit);
  appendIfDefined(searchParams, "orderby", query.orderby);
  appendIfDefined(searchParams, "eventid", query.eventid);

  appendIfDefined(searchParams, "minmag", query.minmag);
  appendIfDefined(searchParams, "maxmag", query.maxmag);
  appendIfDefined(searchParams, "mindepth", query.mindepth);
  appendIfDefined(searchParams, "maxdepth", query.maxdepth);

  const radialActive = query.lat != null && query.lon != null && query.maxrad != null;
  if (radialActive) {
    appendIfDefined(searchParams, "lat", query.lat);
    appendIfDefined(searchParams, "lon", query.lon);
    appendIfDefined(searchParams, "minrad", query.minrad);
    appendIfDefined(searchParams, "maxrad", query.maxrad);
  } else {
    appendIfDefined(searchParams, "minlat", query.minlat);
    appendIfDefined(searchParams, "maxlat", query.maxlat);
    appendIfDefined(searchParams, "minlon", query.minlon);
    appendIfDefined(searchParams, "maxlon", query.maxlon);
  }

  searchParams.set("format", "json");

  return searchParams;
}

export function buildAfadUrl(query: EarthquakeQuery): string {
  const searchParams = buildAfadSearchParams(query);
  return `${AFAD_BASE_URL}?${searchParams.toString()}`;
}

function toFiniteNumber(value: string | null | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return null;
  }

  return numberValue;
}

function normalizeEarthquakeEvent(item: AfadRawEvent): EarthquakeEvent {
  const latitude = toFiniteNumber(item.latitude);
  const longitude = toFiniteNumber(item.longitude);
  const depth = toFiniteNumber(item.depth);
  const magnitude = toFiniteNumber(item.magnitude);

  if (latitude == null || longitude == null || depth == null || magnitude == null) {
    throw new UpstreamResponseError("AFAD verisinde sayısal alanlar çözümlenemedi.");
  }

  return {
    eventID: String(item.eventID),
    date: String(item.date),
    location: String(item.location),
    latitude,
    longitude,
    depth,
    magnitude,
    type: String(item.type ?? ""),
    rms: toFiniteNumber(item.rms),
    country: String(item.country ?? ""),
    province: String(item.province ?? ""),
    district: String(item.district ?? ""),
    neighborhood: String(item.neighborhood ?? ""),
    isEventUpdate: Boolean(item.isEventUpdate),
    lastUpdateDate: item.lastUpdateDate,
  };
}

function isAfadErrorPayload(payload: unknown): payload is AfadErrorPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  return "message" in payload || "status" in payload;
}

export function normalizeAfadPayload(payload: unknown): EarthquakeEvent[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalizeEarthquakeEvent(item as AfadRawEvent));
  }

  if (isAfadErrorPayload(payload)) {
    throw new AfadUpstreamError(
      payload.message ?? "AFAD servisi bir hata döndürdü.",
      payload.status,
    );
  }

  throw new UpstreamResponseError("AFAD servisinden beklenmeyen formatta yanıt alındı.");
}

export async function fetchAfadEarthquakes(
  query: EarthquakeQuery,
  timeoutMs = 10000,
): Promise<EarthquakeEvent[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = buildAfadUrl(query);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payloadText = await response.text();

    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      throw new UpstreamResponseError("AFAD servisinden geçersiz JSON yanıtı alındı.");
    }

    if (!response.ok) {
      if (isAfadErrorPayload(payload)) {
        throw new AfadUpstreamError(payload.message ?? "AFAD servisi hata verdi.", payload.status);
      }

      throw new UpstreamResponseError(`AFAD servisi HTTP ${response.status} döndürdü.`);
    }

    return normalizeAfadPayload(payload);
  } catch (error) {
    if (error instanceof AfadUpstreamError || error instanceof UpstreamResponseError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new UpstreamTimeoutError("AFAD servisine istek zaman aşımına uğradı.");
    }

    if (error instanceof TypeError) {
      throw new UpstreamResponseError("AFAD servisine bağlanırken bir ağ hatası oluştu.");
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
