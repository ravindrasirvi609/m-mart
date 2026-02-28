"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useRealtimeChannel } from "@/lib/hooks/use-realtime";
import type { RealtimePayload } from "@/lib/hooks/use-realtime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackingData = {
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  deliveryArea: string | null;
  storeLat: number;
  storeLng: number;
  customerLat: number | null;
  customerLng: number | null;
  driverLat: number | null;
  driverLng: number | null;
  driverHeading: number | null;
  driverSpeed: number | null;
  estimatedArrival: string | null;
  agentName: string | null;
  agentPhone: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  trackingUpdatedAt: string | null;
};

export type TimelineEntry = {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  note: string | null;
  createdAt: string;
};

export type UseOrderTrackingReturn = {
  tracking: TrackingData | null;
  timeline: TimelineEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * `useOrderTracking` — subscribes to live delivery tracking for a specific
 * order. Fetches initial tracking data via RPC, then listens for realtime
 * updates on both `delivery_tracking` and `orders` tables.
 */
export function useOrderTracking(orderId: string): UseOrderTrackingReturn {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const trackingRef = useRef(tracking);

  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  // -----------------------------------------------------------------------
  // Fetch tracking data via RPC
  // -----------------------------------------------------------------------
  const fetchTracking = useCallback(async () => {
    try {
      const [trackingResult, timelineResult] = await Promise.all([
        supabase.rpc("get_order_tracking", {
          p_order_id: orderId,
        } as never),
        supabase.rpc("get_order_timeline", {
          p_order_id: orderId,
        } as never),
      ]);

      if (trackingResult.error) {
        setError("Unable to load tracking information.");
        setLoading(false);
        return;
      }

      const rows = trackingResult.data as Array<Record<string, unknown>>;
      if (rows && rows.length > 0) {
        const row = rows[0];
        setTracking({
          orderId: row.order_id as string,
          orderStatus: row.order_status as string,
          paymentStatus: row.payment_status as string,
          deliveryArea: row.delivery_area as string | null,
          storeLat: row.store_lat as number,
          storeLng: row.store_lng as number,
          customerLat: row.customer_lat as number | null,
          customerLng: row.customer_lng as number | null,
          driverLat: row.driver_lat as number | null,
          driverLng: row.driver_lng as number | null,
          driverHeading: row.driver_heading as number | null,
          driverSpeed: row.driver_speed as number | null,
          estimatedArrival: row.estimated_arrival as string | null,
          agentName: row.agent_name as string | null,
          agentPhone: row.agent_phone as string | null,
          outForDeliveryAt: row.out_for_delivery_at as string | null,
          deliveredAt: row.delivered_at as string | null,
          trackingUpdatedAt: row.tracking_updated_at as string | null,
        });
      }

      if (!timelineResult.error && timelineResult.data) {
        const entries = (
          timelineResult.data as Array<Record<string, unknown>>
        ).map((entry) => ({
          id: entry.id as string,
          orderStatus: entry.order_status as string,
          paymentStatus: entry.payment_status as string,
          note: entry.note as string | null,
          createdAt: entry.created_at as string,
        }));
        setTimeline(entries);
      }

      setError(null);
    } catch {
      setError("Failed to load tracking data.");
    } finally {
      setLoading(false);
    }
  }, [supabase, orderId]);

  // Initial fetch
  useEffect(() => {
    fetchTracking();
  }, [fetchTracking]);

  // -----------------------------------------------------------------------
  // Realtime: listen to delivery_tracking changes for this order
  // -----------------------------------------------------------------------
  const handleTrackingChange = useCallback(
    (payload: RealtimePayload<"delivery_tracking">) => {
      if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
        const row = payload.new as Record<string, unknown>;
        if (row.order_id !== orderId) return;

        setTracking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            driverLat: row.latitude as number,
            driverLng: row.longitude as number,
            driverHeading: (row.heading as number) ?? null,
            driverSpeed: (row.speed as number) ?? null,
            estimatedArrival: (row.estimated_arrival as string) ?? null,
            trackingUpdatedAt: (row.updated_at as string) ?? null,
          };
        });
      }
    },
    [orderId],
  );

  useRealtimeChannel({
    channelName: `tracking-${orderId}`,
    table: "delivery_tracking",
    event: "*",
    onPayload: handleTrackingChange,
  });

  // -----------------------------------------------------------------------
  // Realtime: listen to order status changes
  // -----------------------------------------------------------------------
  const handleOrderChange = useCallback(
    (payload: RealtimePayload<"orders">) => {
      if (payload.eventType === "UPDATE") {
        const row = payload.new as Record<string, unknown>;
        if (row.id !== orderId) return;

        setTracking((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            orderStatus: row.order_status as string,
            paymentStatus: row.payment_status as string,
            deliveredAt: (row.delivered_at as string) ?? null,
            outForDeliveryAt: (row.out_for_delivery_at as string) ?? null,
          };
        });

        // Re-fetch timeline when order status changes
        fetchTracking();
      }
    },
    [orderId, fetchTracking],
  );

  useRealtimeChannel({
    channelName: `order-tracking-${orderId}`,
    table: "orders",
    event: "UPDATE",
    onPayload: handleOrderChange,
  });

  // -----------------------------------------------------------------------
  // Polling fallback — every 15 seconds for active deliveries
  // -----------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const status = trackingRef.current?.orderStatus;
      if (status === "out_for_delivery" || status === "preparing") {
        fetchTracking();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchTracking]);

  return {
    tracking,
    timeline,
    loading,
    error,
    refresh: fetchTracking,
  };
}
