"use client";

import { ChangeEvent, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EarthquakeFilters } from "@/lib/types";

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

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
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
    <Card className="border-border/80 bg-white/85 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Filtreler</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onReset}>
              Varsayılana Dön
            </Button>
            <Button type="submit" size="sm" form="filter-form" disabled={isLoading}>
              Uygula
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-0">
        <form id="filter-form" className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Event ID">
              <Input
                type="text"
                name="eventid"
                value={filters.eventid}
                onChange={(event) => onFiltersChange(updateField(filters, event))}
                placeholder="Örn: 701434"
              />
            </Field>
            <Field label="Başlangıç">
              <Input
                type="datetime-local"
                name="start"
                value={filters.start}
                onChange={(event) => onFiltersChange(updateField(filters, event))}
                required
              />
            </Field>
            <Field label="Bitiş">
              <Input
                type="datetime-local"
                name="end"
                value={filters.end}
                onChange={(event) => onFiltersChange(updateField(filters, event))}
                required
              />
            </Field>
            <Field label="Limit">
              <Input
                type="number"
                name="limit"
                min={1}
                max={10000}
                value={filters.limit}
                onChange={(event) => onFiltersChange(updateField(filters, event))}
              />
            </Field>
            <Field label="Sıralama">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                name="orderby"
                value={filters.orderby}
                onChange={(event) => onFiltersChange(updateField(filters, event))}
              >
                <option value="timedesc">Yeni {">"} Eski</option>
                <option value="timeasc">Eski {">"} Yeni</option>
              </select>
            </Field>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Büyüklük ve Derinlik</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Min Büyüklük">
                <Input
                  type="number"
                  step="0.1"
                  name="minmag"
                  value={filters.minmag}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Max Büyüklük">
                <Input
                  type="number"
                  step="0.1"
                  name="maxmag"
                  value={filters.maxmag}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Min Derinlik (km)">
                <Input
                  type="number"
                  step="0.1"
                  name="mindepth"
                  value={filters.mindepth}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Max Derinlik (km)">
                <Input
                  type="number"
                  step="0.1"
                  name="maxdepth"
                  value={filters.maxdepth}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Kutusal Coğrafi Filtre</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Min Enlem">
                <Input
                  type="number"
                  step="0.0001"
                  name="minlat"
                  value={filters.minlat}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Max Enlem">
                <Input
                  type="number"
                  step="0.0001"
                  name="maxlat"
                  value={filters.maxlat}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Min Boylam">
                <Input
                  type="number"
                  step="0.0001"
                  name="minlon"
                  value={filters.minlon}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Max Boylam">
                <Input
                  type="number"
                  step="0.0001"
                  name="maxlon"
                  value={filters.maxlon}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Yarıçap Coğrafi Filtre</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Merkez Enlem">
                <Input
                  type="number"
                  step="0.0001"
                  name="lat"
                  value={filters.lat}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Merkez Boylam">
                <Input
                  type="number"
                  step="0.0001"
                  name="lon"
                  value={filters.lon}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Min Yarıçap (m)">
                <Input
                  type="number"
                  step="1"
                  name="minrad"
                  value={filters.minrad}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
              <Field label="Max Yarıçap (m)">
                <Input
                  type="number"
                  step="1"
                  name="maxrad"
                  value={filters.maxrad}
                  onChange={(event) => onFiltersChange(updateField(filters, event))}
                />
              </Field>
            </div>
          </div>
        </form>

        {showOverrideNotice ? (
          <p
            className={cn(
              "rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700",
            )}
          >
            Yarıçap filtresi aktif. Kutusal filtre değerleri bu istekte otomatik olarak yok sayılacaktır.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
