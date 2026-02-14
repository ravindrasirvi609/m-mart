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
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {page > 1 ? (
        <Link href={`/products?${prevQuery.toString()}`}>
          <Button variant="secondary">Previous</Button>
        </Link>
      ) : (
        <span className="text-sm text-zinc-400">Previous</span>
      )}

      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Link href={`/products?${nextQuery.toString()}`}>
          <Button variant="secondary">Next</Button>
        </Link>
      ) : (
        <span className="text-sm text-zinc-400">Next</span>
      )}
    </div>
  );
}
