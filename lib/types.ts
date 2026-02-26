export type OrderBy = "timedesc" | "timeasc";

export interface EarthquakeQuery {
  start: string;
  end: string;
  limit: number;
  orderby: OrderBy;
  eventid?: string;
  minmag?: number;
  maxmag?: number;
  mindepth?: number;
  maxdepth?: number;
  minlat?: number;
  maxlat?: number;
  minlon?: number;
  maxlon?: number;
  lat?: number;
  lon?: number;
  minrad?: number;
  maxrad?: number;
}

export interface EarthquakeEvent {
  eventID: string;
  date: string;
  location: string;
  latitude: number;
  longitude: number;
  depth: number;
  magnitude: number;
  type: string;
  rms: number | null;
  country: string;
  province: string;
  district: string;
  neighborhood: string;
  isEventUpdate: boolean;
  lastUpdateDate: string | null;
}

export interface EarthquakeApiMeta {
  fetchedAt: string;
  count: number;
  source: string;
  radialOverridesBounding: boolean;
}

export interface EarthquakeApiResponse {
  data: EarthquakeEvent[];
  meta: EarthquakeApiMeta;
}

export interface EarthquakeFilters {
  start: string;
  end: string;
  limit: string;
  orderby: OrderBy;
  eventid: string;
  minmag: string;
  maxmag: string;
  mindepth: string;
  maxdepth: string;
  minlat: string;
  maxlat: string;
  minlon: string;
  maxlon: string;
  lat: string;
  lon: string;
  minrad: string;
  maxrad: string;
}
