"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { normalizeDateTimeInput, toDateTimeLocalInTimeZone } from "@/lib/time";
import { EarthquakeApiMeta, EarthquakeApiResponse, EarthquakeEvent, EarthquakeFilters } from "@/lib/types";

const REFRESH_INTERVAL_MS = 60_000;
const DEFAULT_LIMIT = "200";

interface UseEarthquakesResult {
  data: EarthquakeEvent[];
  meta: EarthquakeApiMeta | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  queryString: string;
  clientRadialOverridesBounding: boolean;
}

function parseLimit(limit: string): number {
  const parsedLimit = Number(limit);
  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    return 200;
  }

  return parsedLimit;
}

function hasAnyBoundingInput(filters: EarthquakeFilters): boolean {
  return [filters.minlat, filters.maxlat, filters.minlon, filters.maxlon].some((value) => value.trim() !== "");
}

function hasCompleteBoundingInput(filters: EarthquakeFilters): boolean {
  return [filters.minlat, filters.maxlat, filters.minlon, filters.maxlon].every((value) => value.trim() !== "");
}

function hasCompleteRadialInput(filters: EarthquakeFilters): boolean {
  return [filters.lat, filters.lon, filters.maxrad].every((value) => value.trim() !== "");
}

export function createDefaultFilters(now = new Date()): EarthquakeFilters {
  const previousDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    start: toDateTimeLocalInTimeZone(previousDay),
    end: toDateTimeLocalInTimeZone(now),
    limit: DEFAULT_LIMIT,
    orderby: "timedesc",
    eventid: "",
    minmag: "",
    maxmag: "",
    mindepth: "",
    maxdepth: "",
    minlat: "",
    maxlat: "",
    minlon: "",
    maxlon: "",
    lat: "",
    lon: "",
    minrad: "",
    maxrad: "",
  };
}

export function buildEarthquakeSearchParams(filters: EarthquakeFilters): {
  params: URLSearchParams;
  radialOverridesBounding: boolean;
} {
  const searchParams = new URLSearchParams();

  searchParams.set("start", normalizeDateTimeInput(filters.start));
  searchParams.set("end", normalizeDateTimeInput(filters.end));
  searchParams.set("limit", String(parseLimit(filters.limit)));
  searchParams.set("orderby", filters.orderby);

  const eventId = (filters.eventid ?? "").trim();
  if (eventId) {
    searchParams.set("eventid", eventId);
  }

  const numericFields: Array<keyof EarthquakeFilters> = [
    "minmag",
    "maxmag",
    "mindepth",
    "maxdepth",
    "minlat",
    "maxlat",
    "minlon",
    "maxlon",
    "lat",
    "lon",
    "minrad",
    "maxrad",
  ];

  const radialComplete = hasCompleteRadialInput(filters);
  const boundingComplete = hasCompleteBoundingInput(filters);
  const radialOverridesBounding = radialComplete && hasAnyBoundingInput(filters);

  for (const field of numericFields) {
    if (radialComplete && (field === "minlat" || field === "maxlat" || field === "minlon" || field === "maxlon")) {
      continue;
    }

    if (!radialComplete && !boundingComplete && (field === "minlat" || field === "maxlat" || field === "minlon" || field === "maxlon")) {
      continue;
    }

    const value = (filters[field] ?? "").trim();
    if (!value) {
      continue;
    }

    searchParams.set(field, value);
  }

  return {
    params: searchParams,
    radialOverridesBounding,
  };
}

export function useEarthquakes(filters: EarthquakeFilters): UseEarthquakesResult {
  const [{ params, radialOverridesBounding: clientRadialOverridesBounding }, setQuery] = useState(() =>
    buildEarthquakeSearchParams(filters),
  );

  const queryString = useMemo(() => params.toString(), [params]);

  const [data, setData] = useState<EarthquakeEvent[]>([]);
  const [meta, setMeta] = useState<EarthquakeApiMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  useEffect(() => {
    setQuery(buildEarthquakeSearchParams(filters));
  }, [filters]);

  const fetchData = useCallback(
    async (silent = false): Promise<void> => {
      const currentRequestId = ++requestIdRef.current;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const response = await fetch(`/api/earthquakes?${queryString}`, {
          method: "GET",
          cache: "no-store",
        });

        const body = (await response.json()) as EarthquakeApiResponse | { error?: string };

        if (!response.ok) {
          throw new Error(body && typeof body === "object" && "error" in body ? body.error : "Veri alınamadı.");
        }

        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        const result = body as EarthquakeApiResponse;
        setData(result.data);
        setMeta(result.meta);
        setError(null);
      } catch (fetchError) {
        if (currentRequestId !== requestIdRef.current) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Beklenmeyen bir hata oluştu.");
      } finally {
        if (currentRequestId === requestIdRef.current) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [queryString],
  );

  useEffect(() => {
    void fetchData(false);
    const intervalId = window.setInterval(() => {
      void fetchData(true);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchData]);

  return {
    data,
    meta,
    isLoading,
    isRefreshing,
    error,
    refresh: () => fetchData(false),
    queryString,
    clientRadialOverridesBounding,
  };
}
