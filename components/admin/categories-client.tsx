"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Button } from "@/components/ui/button";
import { AddCategoryForm } from "@/components/admin/add-category-form";

interface CategoriesClientProps {
    categories: any[];
}

export function CategoriesClient({ categories }: CategoriesClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const columns = [
        {
            header: "Category Name",
            accessorKey: "name",
            cell: (category: any) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
                        <Tag size={16} />
                    </div>
                    <span className="font-bold text-white">{category.name}</span>
                </div>
            ),
        },
        {
            header: "ID",
            accessorKey: "id",
            cell: (category: any) => (
                <span className="font-mono text-[11px] text-text-subtle">
                    {category.id}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-black text-white">Categories</h1>
                    <p className="text-sm text-text-subtle">Organize your products into categories.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-brand-red font-bold text-white hover:bg-brand-red/90"
                >
                    <Plus size={18} />
                    Add Category
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
