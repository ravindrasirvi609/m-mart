"use client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Package,
  Phone,
  RefreshCw,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useOrderTracking } from "@/lib/hooks/use-order-tracking";
import type {
  TrackingData,
  TimelineEntry,
} from "@/lib/hooks/use-order-tracking";
import { TrackingMap } from "@/components/store/tracking-map";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { formatOrderStatus } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Order progress steps
// ---------------------------------------------------------------------------
const ORDER_STEPS = [
  { key: "pending", label: "Order Placed", icon: Package },
  { key: "paid", label: "Payment Verified", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing", icon: Clock },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function getStepIndex(status: string): number {
  if (status === "cancelled") return -1;
  const idx = ORDER_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

// ---------------------------------------------------------------------------
// ETA formatter
// ---------------------------------------------------------------------------
function formatETA(eta: string | null): string | null {
  if (!eta) return null;
  const target = new Date(eta);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Arriving now";
  const minutes = Math.ceil(diffMs / 60000);
  if (minutes <= 1) return "~1 min away";
  return `~${minutes} min away`;
}

// ---------------------------------------------------------------------------
// Time ago
// ---------------------------------------------------------------------------
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString("en-IN");
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------
function OrderProgressBar({ status }: { status: string }) {
  const currentStep = getStepIndex(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = !isCancelled && index <= currentStep;
          const isCurrent = !isCancelled && index === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                    isCurrent
                      ? "border-[#c91510] bg-[#c91510] text-white shadow-lg shadow-red-200 dark:shadow-red-900/30"
                      : isCompleted
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-600 dark:bg-zinc-800"
                  }`}
                >
                  <Icon size={14} />
                </div>
                <span
                  className={`mt-1.5 text-center text-[10px] font-semibold leading-tight ${
                    isCurrent
                      ? "text-[#c91510]"
                      : isCompleted
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-400 dark:text-zinc-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < ORDER_STEPS.length - 1 && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full ${
                    !isCancelled && index < currentStep
                      ? "bg-emerald-500"
                      : "bg-zinc-200 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {isCancelled && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 dark:bg-red-950/20">
          <XCircle size={16} className="text-red-500" />
          <span className="text-sm font-semibold text-red-700 dark:text-red-400">
            This order has been cancelled
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------
function OrderTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-text-main">Order Timeline</h3>
      <div className="relative space-y-0">
        {entries.map((entry, index) => (
          <div key={entry.id} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex w-4 flex-col items-center">
              <div
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  index === entries.length - 1
                    ? "bg-[#c91510]"
                    : "bg-zinc-300 dark:bg-zinc-600"
                }`}
              />
              {index < entries.length - 1 && (
                <div className="w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              )}
            </div>
            {/* Content */}
            <div className="pb-4">
              <p className="text-xs font-bold text-text-main">
                {formatOrderStatus(entry.orderStatus)}
                {entry.paymentStatus !== "pending_verification" &&
                  ` · Payment: ${formatOrderStatus(entry.paymentStatus)}`}
              </p>
              {entry.note && (
                <p className="mt-0.5 text-xs text-text-subtle">{entry.note}</p>
              )}
              <p className="mt-0.5 text-[10px] text-text-subtle">
                {new Date(entry.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Driver Info Card
// ---------------------------------------------------------------------------
function DriverInfoCard({ tracking }: { tracking: TrackingData }) {
  const eta = formatETA(tracking.estimatedArrival);

  if (!tracking.agentName && !tracking.driverLat) return null;

  return (
    <div className="rounded-2xl border border-[#c91510]/10 bg-gradient-to-r from-[#fff4ef] to-white p-4 dark:from-zinc-800 dark:to-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c91510] text-white">
            <User size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-text-main">
              {tracking.agentName ?? "Delivery Driver"}
            </p>
            {tracking.agentPhone && (
              <a
                href={`tel:${tracking.agentPhone}`}
                className="flex items-center gap-1 text-xs font-medium text-[#c91510] hover:underline"
              >
                <Phone size={10} />
                {tracking.agentPhone}
              </a>
            )}
          </div>
        </div>

        {eta && (
          <div className="text-right">
            <p className="text-lg font-black text-[#c91510]">{eta}</p>
            <p className="text-[10px] font-semibold text-text-subtle">ETA</p>
          </div>
        )}
      </div>

      {tracking.driverSpeed !== null && tracking.driverSpeed > 0 && (
        <div className="mt-3 flex items-center gap-4 border-t border-[#c91510]/10 pt-3">
          <div className="flex items-center gap-1 text-xs text-text-subtle">
            <Navigation size={12} className="text-[#c91510]" />
            <span className="font-semibold">
              {tracking.driverSpeed.toFixed(1)} km/h
            </span>
          </div>
          {tracking.trackingUpdatedAt && (
            <div className="text-xs text-text-subtle">
              Updated {timeAgo(tracking.trackingUpdatedAt)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface OrderTrackingViewProps {
  orderId: string;
}

export function OrderTrackingView({ orderId }: OrderTrackingViewProps) {
  const { tracking, timeline, loading, error, refresh } =
    useOrderTracking(orderId);

  const shortId = useMemo(() => orderId.slice(0, 8).toUpperCase(), [orderId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-[300px] rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-24 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm font-medium text-text-subtle">
          {error ?? "Tracking information not available."}
        </p>
        <Button className="mt-4" variant="outline" onClick={refresh}>
          <RefreshCw size={14} />
          Retry
        </Button>
      </div>
    );
  }

  const isActiveDelivery = tracking.orderStatus === "out_for_delivery";
  const showMap =
    isActiveDelivery ||
    tracking.orderStatus === "delivered" ||
    (tracking.customerLat !== null && tracking.customerLng !== null);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 text-text-subtle transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-heading text-xl font-black text-text-main">
              Order #{shortId}
            </h1>
            <div className="mt-0.5 flex items-center gap-2">
              <StatusPill status={tracking.orderStatus} />
              <StatusPill status={tracking.paymentStatus} />
            </div>
          </div>
        </div>

        <Button variant="ghost" onClick={refresh}>
          <RefreshCw size={14} />
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="premium-card p-4">
        <OrderProgressBar status={tracking.orderStatus} />
      </div>

      {/* Live Map */}
      {showMap && (
        <div className="premium-card overflow-hidden p-0">
          <div className="relative">
            {isActiveDelivery && tracking.driverLat && (
              <div className="absolute left-3 top-3 z-[1000] flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                LIVE
              </div>
            )}
            <div className="h-[300px] sm:h-[350px]">
              <TrackingMap
                storeLat={tracking.storeLat}
                storeLng={tracking.storeLng}
                customerLat={tracking.customerLat}
                customerLng={tracking.customerLng}
                driverLat={tracking.driverLat}
                driverLng={tracking.driverLng}
                driverHeading={tracking.driverHeading}
              />
            </div>
          </div>

          {/* Map legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[10px] font-semibold text-text-subtle dark:border-zinc-700 dark:bg-zinc-900">
            <span>🏪 Store</span>
            <span>📍 Delivery</span>
            {tracking.driverLat && <span>🛵 Driver</span>}
            {tracking.deliveryArea && (
              <span className="ml-auto flex items-center gap-1">
                <MapPin size={10} />
                {tracking.deliveryArea}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Driver Info */}
      {isActiveDelivery && <DriverInfoCard tracking={tracking} />}

      {/* Delivered success message */}
      {tracking.orderStatus === "delivered" && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/30 dark:bg-emerald-950/20">
          <CheckCircle2 size={24} className="shrink-0 text-emerald-500" />
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              Order Delivered!
            </p>
            {tracking.deliveredAt && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Delivered at{" "}
                {new Date(tracking.deliveredAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="premium-card p-4">
          <OrderTimeline entries={timeline} />
        </div>
      )}

      {/* Delivery info footer */}
      {tracking.outForDeliveryAt && (
        <div className="text-center text-xs text-text-subtle">
          Out for delivery since{" "}
          {new Date(tracking.outForDeliveryAt).toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
