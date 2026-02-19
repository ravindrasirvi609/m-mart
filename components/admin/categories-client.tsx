"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Button } from "@/components/ui/button";
import { AddCategoryForm } from "@/components/admin/add-category-form";
import type { Category } from "@/lib/queries";

interface CategoriesClientProps {
    categories: Category[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const columns = [
        {
            header: "Category Name",
            accessorKey: "name",
            cell: (category: Category) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                        <Tag size={16} />
                    </div>
                    <span className="font-bold text-text-main">{category.name}</span>
                </div>
            ),
        },
        {
            header: "ID",
            accessorKey: "id",
            cell: (category: Category) => (
                <span className="font-mono text-[11px] text-text-subtle">
                    {category.id}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-heading text-xl sm:text-2xl font-black text-text-main">Categories</h1>
                    <p className="text-xs sm:text-sm text-text-subtle">Organize your products into categories.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 w-full sm:w-auto"
                >
                    <Plus size={18} />
                    <span>Add Category</span>
                </Button>
            </div>

            <DataTable
                data={categories}
                columns={columns}
                searchKey="name"
            />

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add Category"
                description="Create a new classification for your products."
            >
                <AddCategoryForm />
            </Modal>
        </div>
    );
}
