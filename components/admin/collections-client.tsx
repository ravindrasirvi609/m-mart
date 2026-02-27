"use client";

import { useState } from "react";
import { Plus, FolderOpen, Pencil, Package } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/ui/button";
import { CollectionForm } from "@/components/admin/collection-form";
import { CollectionProductsForm } from "@/components/admin/collection-products-form";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import type { CollectionRow, Product } from "@/lib/queries";

type ProductLite = Pick<
  Product,
  "id" | "name" | "image_url" | "price" | "discount_price"
>;

interface CollectionsClientProps {
  collections: CollectionRow[];
  products: ProductLite[];
}

export function CollectionsClient({
  collections,
  products,
}: CollectionsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCollection, setEditCollection] = useState<CollectionRow | null>(
    null,
  );
  const [productsCollection, setProductsCollection] =
    useState<CollectionRow | null>(null);

  const columns = [
    {
      header: "Collection",
      accessorKey: "name",
      cell: (item: CollectionRow) => (
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
            style={{
              backgroundColor: item.bg_color || "rgba(225, 6, 0, 0.15)",
              color: item.bg_color ? "#fff" : "var(--brand-red)",
            }}
          >
            <FolderOpen size={18} />
          </div>
          <div>
            <p className="font-bold text-text-main">{item.name}</p>
            {item.description && (
              <p className="text-[11px] text-text-subtle line-clamp-1">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Slug",
      accessorKey: "slug",
      cell: (item: CollectionRow) => (
        <span className="font-mono text-xs text-text-subtle">{item.slug}</span>
      ),
    },
    {
      header: "Icon",
      accessorKey: "icon_name",
      cell: (item: CollectionRow) => (
        <span className="text-xs text-text-subtle">
          {item.icon_name || "—"}
        </span>
      ),
    },
    {
      header: "Order",
      accessorKey: "sort_order",
      cell: (item: CollectionRow) => (
        <span className="font-mono text-xs text-text-subtle">
          {item.sort_order}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (item: CollectionRow) => (
        <Badge variant={item.is_active ? "success" : "outline"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
            Collections
          </h1>
          <p className="text-xs text-text-subtle sm:text-sm">
            Curate themed product collections for the homepage.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 sm:w-auto"
        >
          <Plus size={18} />
          <span>New Collection</span>
        </Button>
      </div>

      <DataTable
        data={collections}
        columns={columns}
        searchKey="name"
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProductsCollection(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-blue-400 transition-colors"
              title="Manage products"
            >
              <Package size={16} />
            </button>
            <button
              onClick={() => setEditCollection(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-amber-400 transition-colors"
              title="Edit collection"
            >
              <Pencil size={16} />
            </button>
            <DeleteEntityButton
              id={item.id}
              entityName="collection"
              action="deleteCollection"
            />
          </div>
        )}
      />

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Collection"
        description="Create a new themed product collection."
      >
        <CollectionForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editCollection}
        onClose={() => setEditCollection(null)}
        title="Edit Collection"
        description="Update collection details."
      >
        {editCollection && (
          <CollectionForm
            collection={editCollection}
            onSuccess={() => setEditCollection(null)}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!productsCollection}
        onClose={() => setProductsCollection(null)}
        title={`Products — ${productsCollection?.name ?? ""}`}
        description="Select products to include in this collection."
      >
        {productsCollection && (
          <CollectionProductsForm
            collectionId={productsCollection.id}
            allProducts={products}
            onSuccess={() => setProductsCollection(null)}
          />
        )}
      </Modal>
    </div>
  );
}
