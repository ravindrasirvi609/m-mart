"use client";

import { useState } from "react";
import { Plus, Megaphone, Pencil, Package } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/admin/campaign-form";
import { CampaignProductsForm } from "@/components/admin/campaign-products-form";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import type { CampaignRow, Product } from "@/lib/queries";

type ProductLite = Pick<
  Product,
  "id" | "name" | "image_url" | "price" | "discount_price"
>;

interface CampaignsClientProps {
  campaigns: CampaignRow[];
  products: ProductLite[];
}

const typeVariantMap: Record<
  string,
  "success" | "warning" | "info" | "error" | "default"
> = {
  festival: "warning",
  seasonal: "info",
  flash_sale: "error",
  weekly: "success",
  custom: "default",
};

export function CampaignsClient({ campaigns, products }: CampaignsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<CampaignRow | null>(null);
  const [productsCampaign, setProductsCampaign] = useState<CampaignRow | null>(
    null,
  );

  const columns = [
    {
      header: "Campaign",
      accessorKey: "name",
      cell: (item: CampaignRow) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-red/10 text-brand-red">
            <Megaphone size={18} />
          </div>
          <div>
            <p className="font-bold text-text-main">{item.name}</p>
            <p className="text-[11px] text-text-subtle">{item.hero_title}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "campaign_type",
      cell: (item: CampaignRow) => (
        <Badge variant={typeVariantMap[item.campaign_type] ?? "default"}>
          {item.campaign_type.replace("_", " ")}
        </Badge>
      ),
    },
    {
      header: "Schedule",
      accessorKey: "starts_at",
      cell: (item: CampaignRow) => {
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
      header: "Priority",
      accessorKey: "priority",
      cell: (item: CampaignRow) => (
        <span className="font-mono text-xs text-text-subtle">
          {item.priority}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (item: CampaignRow) => (
        <Badge variant={item.is_active ? "success" : "outline"}>
          {item.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
            Campaigns
          </h1>
          <p className="text-xs text-text-subtle sm:text-sm">
            Manage festival sales, flash deals, and promotional campaigns.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 sm:w-auto"
        >
          <Plus size={18} />
          <span>New Campaign</span>
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={campaigns}
        columns={columns}
        searchKey="name"
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setProductsCampaign(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-blue-400 transition-colors"
              title="Manage products"
            >
              <Package size={16} />
            </button>
            <button
              onClick={() => setEditCampaign(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-amber-400 transition-colors"
              title="Edit campaign"
            >
              <Pencil size={16} />
            </button>
            <DeleteEntityButton
              id={item.id}
              entityName="campaign"
              action="deleteCampaign"
            />
          </div>
        )}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create Campaign"
        description="Set up a new promotional campaign with hero section and schedule."
      >
        <CampaignForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editCampaign}
        onClose={() => setEditCampaign(null)}
        title="Edit Campaign"
        description="Update campaign details and schedule."
      >
        {editCampaign && (
          <CampaignForm
            campaign={editCampaign}
            onSuccess={() => setEditCampaign(null)}
          />
        )}
      </Modal>

      {/* Products Modal */}
      <Modal
        isOpen={!!productsCampaign}
        onClose={() => setProductsCampaign(null)}
        title={`Products — ${productsCampaign?.name ?? ""}`}
        description="Select products to include in this campaign."
      >
        {productsCampaign && (
          <CampaignProductsForm
            campaignId={productsCampaign.id}
            allProducts={products}
            onSuccess={() => setProductsCampaign(null)}
          />
        )}
      </Modal>
    </div>
  );
}
