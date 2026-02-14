import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "paid" || status === "delivered"
      ? "bg-emerald-100 text-emerald-700 pulse-success"
      : status === "rejected" || status === "cancelled"
        ? "bg-rose-100 text-rose-700"
        : "bg-orange-100 text-orange-800";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em]",
        tone,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
