"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GeoPosition = {
  latitude: number;
  longitude: number;
  accuracy: number; // metres
};

export type GeoStatus =
  | "idle" // Not yet requested
  | "requesting" // Permission dialog visible or position acquiring
  | "granted" // Successfully obtained
  | "denied" // User denied permission
  | "unavailable" // API not available or device says no
  | "timeout" // Timed out
  | "error"; // Any other failure

export type UseGeolocationReturn = {
  /** Current GPS position (null until granted) */
  position: GeoPosition | null;
  /** Current status of the geolocation request */
  status: GeoStatus;
  /** Human-readable error message */
  errorMessage: string | null;
  /** Request the user's position (triggers browser prompt if needed) */
  requestPosition: () => void;
  /** Whether the browser/device supports geolocation */
  isSupported: boolean;
};

// ---------------------------------------------------------------------------
// Capacitor Geolocation plugin shape (lazy-loaded)
// ---------------------------------------------------------------------------
type CapacitorGeoPlugin = {
  getCurrentPosition: (opts?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }) => Promise<{
    coords: { latitude: number; longitude: number; accuracy: number };
  }>;
};

function getCapacitorGeoPlugin(): CapacitorGeoPlugin | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return (cap.Plugins?.Geolocation as CapacitorGeoPlugin | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// Storage key for remembering permission state across visits
// ---------------------------------------------------------------------------
const GEO_PERMISSION_KEY = "mmart_geo_permission";

/**
 * Reads the persisted permission state.
 * Returns "granted", "denied", or null (never asked / unknown).
 */
function getStoredPermission(): "granted" | "denied" | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(GEO_PERMISSION_KEY);
  if (v === "granted" || v === "denied") return v;
  return null;
}

function setStoredPermission(state: "granted" | "denied") {
  try {
    localStorage.setItem(GEO_PERMISSION_KEY, state);
  } catch {
    // Quota exceeded — ignore
  }
}

function clearStoredPermission() {
  try {
    localStorage.removeItem(GEO_PERMISSION_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Permissions API helper
// ---------------------------------------------------------------------------

/**
 * Query the browser's actual permission state for geolocation.
 * Returns "granted", "denied", "prompt", or null if the API is unavailable.
 */
async function queryBrowserPermission(): Promise<
  "granted" | "denied" | "prompt" | null
> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      return null;
    }
    const result = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return result.state as "granted" | "denied" | "prompt";
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * `useGeolocation` — Cross-platform geolocation hook.
 *
 * On native Capacitor apps: uses @capacitor/geolocation.
 * On web: uses `navigator.geolocation`.
 *
 * Remembers permission state in localStorage to avoid re-prompting.
 * Provides imperative `requestPosition()` to trigger user prompt.
 */
export function useGeolocation(): UseGeolocationReturn {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestedRef = useRef(false);

  const isSupported =
    typeof window !== "undefined" &&
    ("geolocation" in navigator || !!getCapacitorGeoPlugin());

  // Auto-resolve if user previously granted (silent re-fetch)
  useEffect(() => {
    if (status !== "idle") return;
    const stored = getStoredPermission();
    if (stored === "granted" && !requestedRef.current) {
      requestedRef.current = true;
      acquirePosition(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acquirePosition = useCallback(async (silent = false) => {
    setStatus("requesting");
    setErrorMessage(null);

    // 1) Try Capacitor native plugin first
    const cap = getCapacitorGeoPlugin();
    if (cap) {
      try {
        const result = await cap.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
        });
        const pos: GeoPosition = {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        };
        setPosition(pos);
        setStatus("granted");
        setStoredPermission("granted");
        return;
      } catch {
        // Fall through to browser API
      }
    }

    // 2) Browser API
    if (!navigator.geolocation) {
      setStatus("unavailable");
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    // 2a) Check browser's actual permission state via Permissions API
    //     If the browser has permanently denied it, skip getCurrentPosition
    //     (it would silently fail without showing a dialog).
    if (!silent) {
      const browserState = await queryBrowserPermission();
      if (browserState === "denied") {
        setStatus("denied");
        setErrorMessage(
          "Location is blocked by your browser. Please enable location access in your browser settings (tap the lock/info icon in the address bar), then try again.",
        );
        setStoredPermission("denied");
        return;
      }
      // If "prompt" or "granted" or unknown → proceed with getCurrentPosition
    }

    navigator.geolocation.getCurrentPosition(
      (geo) => {
        const pos: GeoPosition = {
          latitude: geo.coords.latitude,
          longitude: geo.coords.longitude,
          accuracy: geo.coords.accuracy,
        };
        setPosition(pos);
        setStatus("granted");
        setStoredPermission("granted");
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setStatus("denied");
            setErrorMessage(
              "Location permission denied. Please enable location in your browser settings (tap the lock/info icon in the address bar) and try again.",
            );
            setStoredPermission("denied");
            break;
          case err.POSITION_UNAVAILABLE:
            setStatus("unavailable");
            setErrorMessage(
              "Location information is unavailable. Please try again.",
            );
            break;
          case err.TIMEOUT:
            setStatus("timeout");
            setErrorMessage("Location request timed out. Please try again.");
            break;
          default:
            setStatus("error");
            setErrorMessage(
              "An unknown error occurred while fetching location.",
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15_000,
        // Use maximumAge: 0 for explicit user requests to force a fresh prompt;
        // Use 60s cache for silent auto-resolve.
        maximumAge: silent ? 60_000 : 0,
      },
    );
  }, []);

  const requestPosition = useCallback(() => {
    requestedRef.current = true;
    // Clear any stale "denied" state from localStorage so that if the user
    // has since reset their browser permissions, we re-try properly.
    clearStoredPermission();
    acquirePosition(false);
  }, [acquirePosition]);

  return {
    position,
    status,
    errorMessage,
    requestPosition,
    isSupported,
  };
}
