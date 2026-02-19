"use client";

import { useState } from "react";
import {
  Search,
  MoreVertical,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: keyof T;
  onSearch?: (value: string) => void;
  onAction?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  isLoading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  searchKey,
  onSearch,
  onAction,
  renderActions,
  isLoading,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData =
    searchTerm && searchKey
      ? data.filter((item) =>
          String(item[searchKey as keyof T])
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        )
      : data;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full flex-1 sm:max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            size={16}
          />
          <input
            type="text"
            placeholder={`Search ${searchKey ? String(searchKey) : "..."}`}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="h-10 w-full rounded-xl border border-admin-border bg-admin-card pl-10 pr-4 text-sm text-text-main focus:border-brand-red/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-admin-border bg-admin-card px-3 py-2 text-sm font-medium text-text-subtle hover:text-text-main transition-all sm:flex-none">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`mobile-loading-${idx}`}
              className="animate-pulse rounded-2xl border border-admin-border bg-admin-card p-4"
            >
              <div className="mb-3 h-4 w-2/3 rounded bg-white/5" />
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-5/6 rounded bg-white/5" />
                <div className="h-3 w-2/3 rounded bg-white/5" />
              </div>
            </div>
          ))
        ) : filteredData.length === 0 ? (
          <div className="rounded-2xl border border-admin-border bg-admin-card px-4 py-10 text-center text-sm text-text-subtle">
            No results found.
          </div>
        ) : (
          filteredData.map((item, rowIdx) => (
            <div
              key={(item as { id?: string }).id ?? `mobile-row-${rowIdx}`}
              className="rounded-2xl border border-admin-border bg-admin-card p-4"
            >
              <div className="space-y-3">
                {columns.map((column, colIdx) => (
                  <div key={`mobile-col-${rowIdx}-${colIdx}`} className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                      {column.header}
                    </p>
                    <div className="text-sm text-text-main">
                      {column.cell
                        ? column.cell(item)
                        : String(item[column.accessorKey as keyof T])}
                    </div>
                  </div>
                ))}
              </div>
              {(renderActions || onAction) && (
                <div className="mt-4 border-t border-admin-border pt-3">
                  {renderActions ? (
                    <div className="flex justify-end">{renderActions(item)}</div>
                  ) : (
                    <button
                      onClick={() => onAction?.(item)}
                      className="ml-auto flex rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-text-main transition-colors"
                      aria-label="Open row actions"
                    >
                      <MoreVertical size={18} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-admin-border bg-admin-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-admin-border bg-white/[0.02]">
                {columns.map((column, idx) => (
                  <th
                    key={idx}
                    className="px-6 py-4 font-bold text-text-main uppercase tracking-wider text-[11px]"
                  >
                    {column.header}
                  </th>
                ))}
                <th className="px-6 py-4 font-bold text-text-main uppercase tracking-wider text-[11px] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`table-loading-${i}`} className="animate-pulse">
                    {columns.map((_, colIdx) => (
                      <td key={colIdx} className="px-6 py-4">
                        <div className="h-4 w-2/3 rounded bg-white/5" />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      <div className="ml-auto h-4 w-8 rounded bg-white/5" />
                    </td>
                  </tr>
                ))
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-12 text-center text-text-subtle"
                  >
                    No results found.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, rowIdx) => (
                  <tr
                    key={(item as { id?: string }).id ?? `table-row-${rowIdx}`}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {columns.map((column, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-6 py-4 text-text-subtle group-hover:text-text-main"
                      >
                        {column.cell
                          ? column.cell(item)
                          : String(item[column.accessorKey as keyof T])}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right">
                      {renderActions ? (
                        renderActions(item)
                      ) : (
                        <button
                          onClick={() => onAction?.(item)}
                          className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-text-main transition-colors"
                          aria-label="Open row actions"
                        >
                          <MoreVertical size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-admin-border bg-admin-card px-4 py-3 sm:px-6 sm:py-4">
        <p className="text-xs text-text-subtle">
          Showing{" "}
          <span className="font-bold text-text-main">{filteredData.length}</span>{" "}
          results
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-lg border border-admin-border p-1.5 text-text-subtle hover:text-text-main disabled:opacity-50"
            disabled
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="rounded-lg border border-admin-border p-1.5 text-text-subtle hover:text-text-main disabled:opacity-50"
            disabled
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
