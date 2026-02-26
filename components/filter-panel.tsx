"use client";

import { ChangeEvent, FormEvent } from "react";

import { EarthquakeFilters } from "@/lib/types";

import styles from "./filter-panel.module.css";

interface FilterPanelProps {
  filters: EarthquakeFilters;
  isLoading: boolean;
  radialOverridesBounding: boolean;
  onFiltersChange: (nextFilters: EarthquakeFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

function updateField(
  filters: EarthquakeFilters,
  event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
): EarthquakeFilters {
  const { name, value } = event.target;

  return {
    ...filters,
    [name]: value,
  };
}

export function FilterPanel({
  filters,
  isLoading,
  radialOverridesBounding,
  onFiltersChange,
  onApply,
  onReset,
}: FilterPanelProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply();
  };

  const radialFieldsComplete =
    filters.lat.trim() !== "" && filters.lon.trim() !== "" && filters.maxrad.trim() !== "";
  const anyBoundingFilled =
    filters.minlat.trim() !== "" ||
    filters.maxlat.trim() !== "" ||
    filters.minlon.trim() !== "" ||
    filters.maxlon.trim() !== "";

  const showOverrideNotice = radialOverridesBounding || (radialFieldsComplete && anyBoundingFilled);

  return (
    <form className={styles.panel} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>Filtreler</h2>
        <div className={styles.headerActions}>
          <button type="button" onClick={onReset} className={styles.ghostButton}>
            Varsayılana Dön
          </button>
          <button type="submit" disabled={isLoading} className={styles.primaryButton}>
            Uygula
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        <label>
          Event ID
          <input
            type="text"
            name="eventid"
            value={filters.eventid}
            onChange={(event) => onFiltersChange(updateField(filters, event))}
            placeholder="Örn: 701434"
          />
        </label>
        <label>
          Başlangıç
          <input
            type="datetime-local"
            name="start"
            value={filters.start}
            onChange={(event) => onFiltersChange(updateField(filters, event))}
            required
          />
        </label>
        <label>
          Bitiş
          <input
            type="datetime-local"
            name="end"
            value={filters.end}
            onChange={(event) => onFiltersChange(updateField(filters, event))}
            required
          />
        </label>
        <label>
          Limit
          <input
            type="number"
            name="limit"
            min={1}
            max={10000}
            value={filters.limit}
            onChange={(event) => onFiltersChange(updateField(filters, event))}
          />
        </label>
        <label>
          Sıralama
          <select
            name="orderby"
            value={filters.orderby}
            onChange={(event) => onFiltersChange(updateField(filters, event))}
          >
            <option value="timedesc">Yeni {">"} Eski</option>
            <option value="timeasc">Eski {">"} Yeni</option>
          </select>
        </label>
      </div>

      <div className={styles.group}>
        <h3>Büyüklük ve Derinlik</h3>
        <div className={styles.grid}>
          <label>
            Min Büyüklük
            <input
              type="number"
              step="0.1"
              name="minmag"
              value={filters.minmag}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Max Büyüklük
            <input
              type="number"
              step="0.1"
              name="maxmag"
              value={filters.maxmag}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Min Derinlik (km)
            <input
              type="number"
              step="0.1"
              name="mindepth"
              value={filters.mindepth}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Max Derinlik (km)
            <input
              type="number"
              step="0.1"
              name="maxdepth"
              value={filters.maxdepth}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
        </div>
      </div>

      <div className={styles.group}>
        <h3>Kutusal Coğrafi Filtre</h3>
        <div className={styles.grid}>
          <label>
            Min Enlem
            <input
              type="number"
              step="0.0001"
              name="minlat"
              value={filters.minlat}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Max Enlem
            <input
              type="number"
              step="0.0001"
              name="maxlat"
              value={filters.maxlat}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Min Boylam
            <input
              type="number"
              step="0.0001"
              name="minlon"
              value={filters.minlon}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Max Boylam
            <input
              type="number"
              step="0.0001"
              name="maxlon"
              value={filters.maxlon}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
        </div>
      </div>

      <div className={styles.group}>
        <h3>Yarıçap Coğrafi Filtre</h3>
        <div className={styles.grid}>
          <label>
            Merkez Enlem
            <input
              type="number"
              step="0.0001"
              name="lat"
              value={filters.lat}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Merkez Boylam
            <input
              type="number"
              step="0.0001"
              name="lon"
              value={filters.lon}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Min Yarıçap (m)
            <input
              type="number"
              step="1"
              name="minrad"
              value={filters.minrad}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
          <label>
            Max Yarıçap (m)
            <input
              type="number"
              step="1"
              name="maxrad"
              value={filters.maxrad}
              onChange={(event) => onFiltersChange(updateField(filters, event))}
            />
          </label>
        </div>
      </div>

      {showOverrideNotice ? (
        <p className={styles.notice}>
          Yarıçap filtresi aktif. Kutusal filtre değerleri bu istekte otomatik olarak yok sayılacaktır.
        </p>
      ) : null}
    </form>
  );
}
