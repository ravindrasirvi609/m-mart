import Link from "next/link";

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  baseQuery: URLSearchParams;
};

export function PaginationControls({
  page,
  totalPages,
  baseQuery,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  const prevQuery = new URLSearchParams(baseQuery);
  const nextQuery = new URLSearchParams(baseQuery);
  prevQuery.set("page", String(page - 1));
  nextQuery.set("page", String(page + 1));

  return (
    <div className="premium-card flex items-center justify-between gap-3 p-4">
      {page > 1 ? (
        <Link href={`/products?${prevQuery.toString()}`}>
          <Button variant="outline">Previous</Button>
        </Link>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Previous</span>
      )}

      <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-text-subtle">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Link href={`/products?${nextQuery.toString()}`}>
          <Button variant="outline">Next</Button>
        </Link>
      ) : (
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-400">Next</span>
      )}
    </div>
  );
}
