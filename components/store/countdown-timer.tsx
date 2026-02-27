"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";

type CountdownTimerProps = {
  /** ISO string of the campaign end date */
  endsAt: string;
  /** Optional label prefix, e.g. "Sale ends in" */
  label?: string;
  /** Compact mode for inline use */
  compact?: boolean;
  className?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function calculateTimeLeft(endsAt: string): TimeLeft {
  const diff = new Date(endsAt).getTime() - Date.now();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export function CountdownTimer({
  endsAt,
  label = "Ends in",
  compact = false,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(endsAt),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [endsAt]);

  if (timeLeft.expired) {
    return null;
  }

  const segments = [
    { value: timeLeft.days, unit: "d" },
    { value: timeLeft.hours, unit: "h" },
    { value: timeLeft.minutes, unit: "m" },
    { value: timeLeft.seconds, unit: "s" },
  ].filter((s) => !compact || s.value > 0 || s.unit === "m" || s.unit === "s");

  if (compact) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-bold",
          className,
        )}
      >
        <Clock size={12} />
        {label} {segments.map((s) => `${s.value}${s.unit}`).join(" ")}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex items-center gap-1.5 text-sm font-bold text-white/90">
        <Clock size={14} />
        <span>{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {segments.map((segment) => (
          <div key={segment.unit} className="flex items-center gap-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-sm font-black tabular-nums backdrop-blur-sm">
              {String(segment.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-bold uppercase text-white/70">
              {segment.unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
