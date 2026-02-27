"use client";

import { useState } from "react";
import { Plus, Image, Pencil } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/ui/button";
import { BannerForm } from "@/components/admin/banner-form";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import type { BannerRow } from "@/lib/queries";

interface BannersClientProps {
  banners: BannerRow[];
}

export function BannersClient({ banners }: BannersClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<BannerRow | null>(null);

  const columns = [
    {
      header: "Banner",
      accessorKey: "title",
      cell: (item: BannerRow) => (
        <div className="flex items-center gap-3">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.title}
              className="h-10 w-16 rounded-lg object-cover ring-1 ring-admin-border"
            />
          ) : (
            <div className="flex h-10 w-16 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red">
              <Image size={18} />
            </div>
          )}
          <div>
            <p className="font-bold text-text-main">{item.title}</p>
            {item.subtitle && (
              <p className="text-[11px] text-text-subtle line-clamp-1">
                {item.subtitle}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      accessorKey: "location_area",
      cell: (item: BannerRow) => (
        <span className="text-xs text-text-subtle">
          {item.location_area || "All areas"}
        </span>
      ),
    },
    {
      header: "Schedule",
      accessorKey: "starts_at",
      cell: (item: BannerRow) => {
        const start = new Date(item.starts_at);
        const end = new Date(item.ends_at);
        const now = new Date();
        const isLive = now >= start && now <= end && item.is_active;
        return (
          <div className="space-y-1">
            <p className="text-xs text-text-subtle">
              {start.toLocaleDateString()} – {end.toLocaleDateString()}
            </p>
            {isLive && (
              <Badge variant="success">
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: "Order",
      accessorKey: "sort_order",
      cell: (item: BannerRow) => (
        <span className="font-mono text-xs text-text-subtle">
          {item.sort_order}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (item: BannerRow) => (
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
            Banners
          </h1>
          <p className="text-xs text-text-subtle sm:text-sm">
            Manage homepage carousel banners and promotional images.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 sm:w-auto"
        >
          <Plus size={18} />
          <span>New Banner</span>
        </Button>
      </div>

      <DataTable
        data={banners}
        columns={columns}
        searchKey="title"
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditBanner(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-amber-400 transition-colors"
              title="Edit banner"
            >
              <Pencil size={16} />
            </button>
            <DeleteEntityButton
              id={item.id}
              entityName="banner"
              action="deleteBanner"
            />
          </div>
        )}
      />

      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Banner"
        description="Add a new promotional banner for the homepage carousel."
      >
        <BannerForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!editBanner}
        onClose={() => setEditBanner(null)}
        title="Edit Banner"
        description="Update banner details and schedule."
      >
        {editBanner && (
          <BannerForm
            banner={editBanner}
            onSuccess={() => setEditBanner(null)}
          />
        )}
      </Modal>
    </div>
  );
}
