"use client";

import { useState } from "react";
import { Plus, MapPin, Pencil, Clock } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/ui/button";
import { ServiceAreaForm } from "@/components/admin/service-area-form";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import type { ServiceAreaRow } from "@/lib/queries";

interface ServiceAreasClientProps {
  serviceAreas: ServiceAreaRow[];
}

export function ServiceAreasClient({ serviceAreas }: ServiceAreasClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editArea, setEditArea] = useState<ServiceAreaRow | null>(null);

  const activeCount = serviceAreas.filter((a) => a.is_active).length;

  const columns = [
    {
      header: "Area",
      accessorKey: "area_name",
      cell: (item: ServiceAreaRow) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <MapPin size={18} />
          </div>
          <div>
            <p className="font-bold text-text-main">{item.area_name}</p>
            <p className="text-[11px] text-text-subtle">
              {item.city}
              {item.pincode && ` • ${item.pincode}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Delivery ETA",
      accessorKey: "delivery_eta_minutes",
      cell: (item: ServiceAreaRow) => (
        <div className="flex items-center gap-1.5 text-xs text-text-subtle">
          <Clock size={14} />
          <span>{item.delivery_eta_minutes} min</span>
        </div>
      ),
    },
    {
      header: "Order",
      accessorKey: "sort_order",
      cell: (item: ServiceAreaRow) => (
        <span className="font-mono text-xs text-text-subtle">
          {item.sort_order}
        </span>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: (item: ServiceAreaRow) => (
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
            Service Areas
          </h1>
          <p className="text-xs text-text-subtle sm:text-sm">
            Manage delivery zones and estimated delivery times.{" "}
            <span className="font-medium text-emerald-400">
              {activeCount} active
            </span>{" "}
            of {serviceAreas.length} areas.
          </p>
        </div>
        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 sm:w-auto"
        >
          <Plus size={18} />
          <span>Add Area</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Total Areas
          </p>
          <p className="mt-1 text-2xl font-black text-text-main">
            {serviceAreas.length}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Active
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Avg ETA
          </p>
          <p className="mt-1 text-2xl font-black text-text-main">
            {serviceAreas.length > 0
              ? Math.round(
                  serviceAreas.reduce(
                    (sum, a) => sum + a.delivery_eta_minutes,
                    0,
                  ) / serviceAreas.length,
                )
              : 0}{" "}
            <span className="text-sm font-medium text-text-subtle">min</span>
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Cities
          </p>
          <p className="mt-1 text-2xl font-black text-text-main">
            {new Set(serviceAreas.map((a) => a.city)).size}
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={serviceAreas}
        columns={columns}
        searchKey="area_name"
        renderActions={(item) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditArea(item)}
              className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-amber-400 transition-colors"
              title="Edit service area"
            >
              <Pencil size={16} />
            </button>
            <DeleteEntityButton
              id={item.id}
              entityName="service area"
              action="deleteServiceArea"
            />
          </div>
        )}
      />

      {/* Add Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Service Area"
        description="Add a new delivery zone with estimated delivery time."
      >
        <ServiceAreaForm onSuccess={() => setIsAddOpen(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editArea}
        onClose={() => setEditArea(null)}
        title="Edit Service Area"
        description="Update delivery zone details."
      >
        {editArea && (
          <ServiceAreaForm
            serviceArea={editArea}
            onSuccess={() => setEditArea(null)}
          />
        )}
      </Modal>
    </div>
  );
}
