"use client";

import dynamic from "next/dynamic";

const TrackingMapInner = dynamic(
  () =>
    import("@/components/store/tracking-map-inner").then(
      (mod) => mod.TrackingMapInner,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[300px] items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
        <div className="animate-pulse text-sm font-medium text-text-subtle">
          Loading map...
        </div>
      </div>
    ),
  },
);

interface TrackingMapProps {
  storeLat: number;
  storeLng: number;
  customerLat: number | null;
  customerLng: number | null;
  driverLat: number | null;
  driverLng: number | null;
  driverHeading: number | null;
}

export function TrackingMap(props: TrackingMapProps) {
  return <TrackingMapInner {...props} />;
}
