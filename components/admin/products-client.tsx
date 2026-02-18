"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Edit2, Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Modal } from "@/components/admin/ui/modal";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/admin/delete-product-form";
import { AddProductForm } from "@/components/admin/add-product-form";

interface ProductsClientProps {
    products: any[];
    categories: any[];
}

export function ProductsClient({ products, categories }: ProductsClientProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const columns = [
        {
            header: "Product",
            accessorKey: "name",
            cell: (product: any) => (
                <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-admin-border">
                        <Image
                            src={product.image_url || "/placeholder-product.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-bold text-white">{product.name}</p>
                        <p className="text-[10px] text-text-subtle uppercase tracking-wider">{product.category}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Price",
            accessorKey: "price",
            cell: (product: any) => (
                <div className="flex flex-col">
                    <span className="font-bold text-white">{formatCurrency(product.price)}</span>
                    {product.discount_price && (
                        <span className="text-[10px] text-brand-red line-through">
                            {formatCurrency(product.discount_price)}
                        </span>
                    )}
                </div>
            ),
        },
        {
            header: "Stock",
            accessorKey: "stock",
            cell: (product: any) => {
                const isLow = product.stock <= 5;
                return (
                    <div className="flex flex-col gap-1">
                        <span className={isLow ? "font-bold text-rose-400" : "font-medium text-white"}>
                            {product.stock} units
                        </span>
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
                            <div
                                className={isLow ? "h-full bg-rose-500" : "h-full bg-emerald-500"}
                                style={{ width: `${Math.min((product.stock / 20) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                );
            },
        },
        {
            header: "Status",
            accessorKey: "is_active",
            cell: (product: any) => (
                <Badge variant={product.is_active ? "success" : "outline"}>
                    {product.is_active ? "Active" : "Inactive"}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-black text-white">Product Inventory</h1>
                    <p className="text-sm text-text-subtle">Manage your store products and stock levels.</p>
                </div>
                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 rounded-xl bg-brand-red font-bold text-white hover:bg-brand-red/90"
                >
                    <Plus size={18} />
                    New Product
                </Button>
            </div>

            <DataTable
                data={products}
                columns={columns}
                searchKey="name"
                renderActions={(product) => (
                    <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                            <button className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-white transition-colors">
                                <Edit2 size={16} />
                            </button>
                        </Link>
                        <DeleteProductButton productId={product.id} />
                    </div>
                )}
            />

            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Add New Product"
                description="Create a new item in your inventory."
            >
                <AddProductForm categories={categories} />
            </Modal>
        </div>
    );
}
