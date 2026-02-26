"use client";

import L from "leaflet";
import "leaflet.heat";
import "leaflet.markercluster";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { formatIstanbulDateTime } from "@/lib/time";
import { EarthquakeEvent } from "@/lib/types";

import styles from "./earthquake-map.module.css";

interface EarthquakeMapInnerProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  clustersEnabled: boolean;
  heatmapEnabled: boolean;
}

interface FlyToSelectedEventProps {
  selectedEvent: EarthquakeEvent | null;
  enabled: boolean;
}

interface HeatmapLayerProps {
  events: EarthquakeEvent[];
  enabled: boolean;
}

interface ClusterLayerProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  enabled: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function popupHtml(event: EarthquakeEvent): string {
  return `<div class="${styles.popup}">
    <strong>${escapeHtml(event.location)}</strong>
    <span>M ${event.magnitude.toFixed(1)}</span>
    <span>Derinlik: ${event.depth.toFixed(1)} km</span>
    <span>${escapeHtml(formatIstanbulDateTime(event.date))}</span>
  </div>`;
}

function markerRadius(magnitude: number): number {
  return Math.min(Math.max(5, magnitude * 2.5), 18);
}

function magnitudeTone(magnitude: number): "cool" | "warm" | "hot" {
  if (magnitude >= 4) {
    return "hot";
  }

  if (magnitude >= 3) {
    return "warm";
  }

  return "cool";
}

function createEventIcon(event: EarthquakeEvent, selected: boolean): L.DivIcon {
  const tone = magnitudeTone(event.magnitude);
  const size = markerRadius(event.magnitude) * 2;

  return L.divIcon({
    className: "event-marker-wrapper",
    html: `<span class="event-marker ${tone}${selected ? " selected" : ""}" style="width:${size}px;height:${size}px"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToSelectedEvent({ selectedEvent, enabled }: FlyToSelectedEventProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !selectedEvent) {
      return;
    }

    map.flyTo([selectedEvent.latitude, selectedEvent.longitude], Math.max(map.getZoom(), 7), {
      duration: 0.7,
    });
  }, [enabled, map, selectedEvent]);

  return null;
}

function HeatmapLayer({ events, enabled }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || events.length === 0) {
      return;
    }

    const latLngs = events.map((event) => [event.latitude, event.longitude, Math.min(1, event.magnitude / 6)] as [number, number, number]);

    const heatLayer = L.heatLayer(latLngs, {
      radius: 26,
      blur: 20,
      minOpacity: 0.35,
      maxZoom: 10,
      gradient: {
        0.2: "#7ee5ff",
        0.45: "#31c2b1",
        0.65: "#f9d057",
        0.85: "#f38d35",
        1: "#d7301f",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [enabled, events, map]);

  return null;
}

function ClusterLayer({ events, selectedEventId, onSelectEvent, enabled }: ClusterLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || events.length === 0) {
      return;
    }

    const clusterGroup = L.markerClusterGroup({
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      iconCreateFunction: (cluster) => {
        const magnitudes = cluster
          .getAllChildMarkers()
          .map((marker) => Number((marker.options as { magnitude?: number }).magnitude ?? 0));
        const maxMagnitude = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;
        const tone = magnitudeTone(maxMagnitude);
        const childCount = cluster.getChildCount();

        return L.divIcon({
          html: `<span>${childCount}</span>`,
          className: `cluster-icon ${tone}`,
          iconSize: [40, 40],
        });
      },
    });

    const markersById = new Map<string, L.Marker>();

    for (const event of events) {
      const isSelected = event.eventID === selectedEventId;
      const marker = L.marker([event.latitude, event.longitude], {
        icon: createEventIcon(event, isSelected),
        title: event.location,
      } as L.MarkerOptions & { magnitude: number });

      (marker.options as L.MarkerOptions & { magnitude: number }).magnitude = event.magnitude;

      marker.bindPopup(popupHtml(event));
      marker.on("click", () => onSelectEvent(event.eventID));

      markersById.set(event.eventID, marker);
      clusterGroup.addLayer(marker);
    }

    clusterGroup.addTo(map);

    if (selectedEventId) {
      const selectedMarker = markersById.get(selectedEventId);
      if (selectedMarker) {
        clusterGroup.zoomToShowLayer(selectedMarker, () => {
          selectedMarker.openPopup();
        });
      }
    }

    return () => {
      map.removeLayer(clusterGroup);
      markersById.clear();
    };
  }, [enabled, events, map, onSelectEvent, selectedEventId]);

  return null;
}

export default function EarthquakeMapInner({
  events,
  selectedEventId,
  onSelectEvent,
  clustersEnabled,
  heatmapEnabled,
}: EarthquakeMapInnerProps) {
  const selectedEvent = useMemo(
    () => (selectedEventId ? events.find((event) => event.eventID === selectedEventId) ?? null : null),
    [events, selectedEventId],
  );

  const center: [number, number] = selectedEvent
    ? [selectedEvent.latitude, selectedEvent.longitude]
    : [39.0, 35.0];

  return (
    <MapContainer className={styles.map} center={center} zoom={6} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıcıları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FlyToSelectedEvent selectedEvent={selectedEvent} enabled={!clustersEnabled} />

      <HeatmapLayer events={events} enabled={heatmapEnabled} />
      <ClusterLayer
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={onSelectEvent}
        enabled={clustersEnabled}
      />

      {!clustersEnabled
        ? events.map((event) => {
            const isSelected = event.eventID === selectedEventId;

            return (
              <CircleMarker
                key={event.eventID}
                center={[event.latitude, event.longitude]}
                radius={markerRadius(event.magnitude)}
                pathOptions={{
                  color: isSelected ? "#ff4f37" : "#1a7fc2",
                  fillColor: isSelected ? "#ff4f37" : "#2ea7ff",
                  fillOpacity: isSelected ? 0.85 : 0.7,
                  weight: isSelected ? 2.2 : 1.4,
                }}
                eventHandlers={{
                  click: () => onSelectEvent(event.eventID),
                }}
              >
                <Popup>
                  <div className={styles.popup}>
                    <strong>{event.location}</strong>
                    <span>M {event.magnitude.toFixed(1)}</span>
                    <span>Derinlik: {event.depth.toFixed(1)} km</span>
                    <span>{formatIstanbulDateTime(event.date)}</span>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })
        : null}
    </MapContainer>
  );
}
