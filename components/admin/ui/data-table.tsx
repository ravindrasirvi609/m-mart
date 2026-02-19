"use client";

import { useState } from "react";
import { Search, ChevronDown, MoreVertical, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function DataTable<T>({ data, columns, searchKey, onSearch, onAction, renderActions, isLoading }: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = searchTerm && searchKey
        ? data.filter((item) =>
            String(item[searchKey as keyof T]).toLowerCase().includes(searchTerm.toLowerCase())
        )
        : data;

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" size={16} />
                    <input
                        type="text"
                        placeholder={`Search ${searchKey ? String(searchKey) : '...'}`}
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

            <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-admin-border bg-white/[0.02]">
                                {columns.map((column, idx) => (
                                    <th key={idx} className="px-6 py-4 font-bold text-text-main uppercase tracking-wider text-[11px]">
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
                                    <tr key={i} className="animate-pulse">
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
                                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-text-subtle">
                                        No results found.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-white/[0.02] transition-colors group">
                                        {columns.map((column, colIdx) => (
                                            <td key={colIdx} className="px-6 py-4 text-text-subtle group-hover:text-text-main">
                                                {column.cell ? column.cell(item) : String(item[column.accessorKey as keyof T])}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            {renderActions ? (
                                                renderActions(item)
                                            ) : (
                                                <button
                                                    onClick={() => onAction?.(item)}
                                                    className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-text-main transition-colors"
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

                <div className="flex items-center justify-between border-t border-admin-border bg-white/[0.01] px-6 py-4">
                    <p className="text-xs text-text-subtle">
                        Showing <span className="font-bold text-text-main">{filteredData.length}</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="rounded-lg border border-admin-border p-1.5 text-text-subtle hover:text-text-main disabled:opacity-50" disabled>
                            <ChevronLeft size={18} />
                        </button>
                        <button className="rounded-lg border border-admin-border p-1.5 text-text-subtle hover:text-text-main disabled:opacity-50" disabled>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
