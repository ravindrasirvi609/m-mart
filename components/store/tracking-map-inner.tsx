"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ---------------------------------------------------------------------------
// Fix Leaflet default icon paths (CDN)
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
// Custom icons
// ---------------------------------------------------------------------------
function createIcon(emoji: string, size: number = 32) {
  return L.divIcon({
    html: `<div style="font-size:${size}px;line-height:1;text-align:center;">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const storeIcon = createIcon("🏪", 30);
const customerIcon = createIcon("📍", 30);
const driverIcon = createIcon("🛵", 34);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface TrackingMapProps {
  storeLat: number;
  storeLng: number;
  customerLat: number | null;
  customerLng: number | null;
  driverLat: number | null;
  driverLng: number | null;
  driverHeading: number | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function TrackingMapInner({
  storeLat,
  storeLng,
  customerLat,
  customerLng,
  driverLat,
  driverLng,
  driverHeading,
}: TrackingMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const storeMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [storeLat, storeLng],
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Store marker
    storeMarkerRef.current = L.marker([storeLat, storeLng], { icon: storeIcon })
      .addTo(map)
      .bindPopup("<strong>Mmart Store</strong>");

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update customer marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || customerLat === null || customerLng === null) return;

    if (customerMarkerRef.current) {
      customerMarkerRef.current.setLatLng([customerLat, customerLng]);
    } else {
      customerMarkerRef.current = L.marker([customerLat, customerLng], {
        icon: customerIcon,
      })
        .addTo(map)
        .bindPopup("<strong>Delivery Location</strong>");
    }
  }, [customerLat, customerLng]);

  // Update driver marker with smooth animation
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverLat === null || driverLng === null) return;

    const rotatedIcon =
      driverHeading !== null
        ? L.divIcon({
            html: `<div style="font-size:34px;line-height:1;text-align:center;transform:rotate(${driverHeading}deg);transition:transform 0.5s ease;">🛵</div>`,
            className: "",
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          })
        : driverIcon;

    if (driverMarkerRef.current) {
      // Smooth move animation
      const current = driverMarkerRef.current.getLatLng();
      const target = L.latLng(driverLat, driverLng);
      const steps = 20;
      const latStep = (target.lat - current.lat) / steps;
      const lngStep = (target.lng - current.lng) / steps;
      let step = 0;

      const animate = () => {
        step++;
        if (step <= steps && driverMarkerRef.current) {
          driverMarkerRef.current.setLatLng([
            current.lat + latStep * step,
            current.lng + lngStep * step,
          ]);
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);

      driverMarkerRef.current.setIcon(rotatedIcon);
    } else {
      driverMarkerRef.current = L.marker([driverLat, driverLng], {
        icon: rotatedIcon,
      })
        .addTo(map)
        .bindPopup("<strong>Delivery Driver</strong>");
    }

    // Fit bounds to include all markers
    const bounds = L.latLngBounds([
      [storeLat, storeLng],
      [driverLat, driverLng],
    ]);
    if (customerLat !== null && customerLng !== null) {
      bounds.extend([customerLat, customerLng]);
    }
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }, [
    driverLat,
    driverLng,
    driverHeading,
    storeLat,
    storeLng,
    customerLat,
    customerLng,
  ]);

  // Fit bounds on initial load if no driver
  useEffect(() => {
    const map = mapRef.current;
    if (!map || driverLat !== null) return;

    if (customerLat !== null && customerLng !== null) {
      const bounds = L.latLngBounds([
        [storeLat, storeLng],
        [customerLat, customerLng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [storeLat, storeLng, customerLat, customerLng, driverLat]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-2xl"
      style={{ minHeight: "300px" }}
    />
  );
}
