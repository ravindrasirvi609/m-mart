import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: string }) {
  const colorClass =
    status === "paid" || status === "delivered"
      ? "bg-emerald-100 text-emerald-700"
      : status === "rejected" || status === "cancelled"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-800";

  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", colorClass)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
