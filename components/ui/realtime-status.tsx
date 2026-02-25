"use client";

import { cn } from "@/lib/utils";
import type { RealtimeStatus } from "@/lib/hooks/use-realtime";

const statusConfig: Record<
    RealtimeStatus,
    { color: string; label: string }
> = {
    connected: { color: "bg-emerald-500", label: "Live" },
    connecting: { color: "bg-amber-500 animate-pulse", label: "Connecting..." },
    disconnected: { color: "bg-red-500", label: "Offline" },
};

export function RealtimeStatusDot({
    status,
    onRetry,
    className,
}: {
    status: RealtimeStatus;
    onRetry?: () => void;
    className?: string;
}) {
    const config = statusConfig[status];

    return (
        <span
            className={cn("inline-flex items-center gap-1.5", className)}
            title={`Realtime: ${config.label}`}
        >
            <span
                className={cn("inline-block h-2 w-2 rounded-full", config.color)}
            />
            <span className="text-[10px] font-medium opacity-70">
                {config.label}
            </span>
            {status === "disconnected" && onRetry && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRetry();
                    }}
                    className="ml-0.5 text-[10px] font-semibold text-amber-500 hover:text-amber-400 underline underline-offset-2 transition-colors"
                >
                    Retry
                </button>
            )}
        </span>
    );
}
