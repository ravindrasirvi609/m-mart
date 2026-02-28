"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Fix Leaflet's default icon paths (broken by bundlers)
// ---------------------------------------------------------------------------
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeoValue = {
  latitude: number;
  longitude: number;
  radius_km: number;
};

interface ZoneMapPickerProps {
  /** Initial centre coordinates (Pune default) */
  defaultLat?: number;
  defaultLng?: number;
  /** Initial radius in kilometres */
  defaultRadiusKm?: number;
  /** Whether the user can click to reposition the marker */
  interactive?: boolean;
  /** Callback fired whenever value changes */
  onChange?: (value: GeoValue) => void;
  /** Map container height */
  height?: string;
  /** CSS class for the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Inner component that listens for map clicks
// ---------------------------------------------------------------------------

function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * Interactive Leaflet map for picking a centre point + radius zone.
 * Used by admin forms for service areas, banners, and campaigns.
 *
 * - Click the map to set the centre marker
 * - Drag the radius slider to adjust coverage
 * - Emits { latitude, longitude, radius_km } on every change
 */
export function ZoneMapPicker({
  defaultLat = 18.5912,
  defaultLng = 73.7388,
  defaultRadiusKm = 5,
  interactive = true,
  onChange,
  height = "300px",
  className,
}: ZoneMapPickerProps) {
  const [lat, setLat] = useState(defaultLat);
  const [lng, setLng] = useState(defaultLng);
  const [radiusKm, setRadiusKm] = useState(defaultRadiusKm);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Sync defaults when parent updates them (e.g. editing an existing record)
  useEffect(() => {
    setLat(defaultLat);
    setLng(defaultLng);
    setRadiusKm(defaultRadiusKm);
  }, [defaultLat, defaultLng, defaultRadiusKm]);

  // Emit changes
  useEffect(() => {
    onChangeRef.current?.({
      latitude: lat,
      longitude: lng,
      radius_km: radiusKm,
    });
  }, [lat, lng, radiusKm]);

  const handleMapClick = useCallback(
    (clickLat: number, clickLng: number) => {
      if (!interactive) return;
      setLat(clickLat);
      setLng(clickLng);
    },
    [interactive],
  );

  return (
    <div className={className}>
      <div
        style={{ height }}
        className="overflow-hidden rounded-xl border border-admin-border"
      >
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
          key={`${defaultLat}-${defaultLng}`} // re-mount if default changes
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {interactive && <ClickHandler onClick={handleMapClick} />}
          <Marker position={[lat, lng]} />
          <Circle
            center={[lat, lng]}
            radius={radiusKm * 1000}
            pathOptions={{
              color: "#c91510",
              fillColor: "#c91510",
              fillOpacity: 0.08,
              weight: 2,
            }}
          />
        </MapContainer>
      </div>

      {/* Coordinates display & radius slider */}
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <div className="text-xs text-text-subtle">
          <span className="font-mono">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <label
            htmlFor="zone-radius"
            className="text-xs font-bold uppercase tracking-wider text-text-subtle"
          >
            Radius
          </label>
          <input
            id="zone-radius"
            type="range"
            min={0.5}
            max={50}
            step={0.5}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
            className="h-1.5 w-28 accent-brand-red"
          />
          <span className="text-xs font-medium text-text-main">
            {radiusKm} km
          </span>
        </div>
      </div>

      {interactive && (
        <p className="mt-1 text-[10px] text-text-subtle">
          Click the map to set the target centre. Drag the slider to adjust the
          delivery / targeting radius.
        </p>
      )}
    </div>
  );
}
