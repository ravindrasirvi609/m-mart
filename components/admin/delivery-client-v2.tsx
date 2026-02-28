"use client";

import {
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Plus,
  Trash2,
  Truck,
  User,
  UserCheck,
} from "lucide-react";
import { useActionState, useState } from "react";

import {
  assignDeliveryAgentAction,
  createDeliveryAgentAction,
  deleteDeliveryAgentAction,
  updateDriverLocationAction,
} from "@/actions/admin-actions";
import { Badge } from "@/components/admin/ui/badge";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { DeliveryAgentRow, DeliveryDashboardOrder } from "@/lib/queries";
import type { Database } from "@/lib/supabase/types";

type OrderAddress =
  Database["public"]["Tables"]["orders"]["Row"]["delivery_address"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type OrderUser =
  | { name?: string | null; phone?: string | null }
  | Array<{ name?: string | null; phone?: string | null }>
  | null;

function getOrderUser(users: OrderUser) {
  if (Array.isArray(users)) return users[0] ?? null;
  return users;
}

function getAddressLabel(address: OrderAddress) {
  if (typeof address === "string") return address;
  if (
    address &&
    typeof address === "object" &&
    !Array.isArray(address) &&
    "address" in address
  ) {
    const value = address.address;
    return typeof value === "string" && value.trim().length > 0 ? value : "N/A";
  }
  return "N/A";
}

// ---------------------------------------------------------------------------
// Add Agent Modal
// ---------------------------------------------------------------------------
function AddAgentModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    createDeliveryAgentAction,
    null,
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Delivery Agent">
      <form action={formAction} className="space-y-4">
        <Input name="name" placeholder="Agent name" required />
        <Input name="phone" placeholder="Phone number" required />

        {state && !state.ok && (
          <p className="text-xs font-semibold text-red-600">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Adding..." : "Add Agent"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Assign Agent Modal
// ---------------------------------------------------------------------------
function AssignAgentModal({
  open,
  onClose,
  orderId,
  agents,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
  agents: DeliveryAgentRow[];
}) {
  const [state, formAction, isPending] = useActionState(
    assignDeliveryAgentAction,
    null,
  );

  return (
    <Modal isOpen={open} onClose={onClose} title="Assign Delivery Agent">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="order_id" value={orderId} />

        {agents.length === 0 ? (
          <p className="text-sm text-text-subtle">
            No active delivery agents. Add one first.
          </p>
        ) : (
          <div className="space-y-2">
            {agents.map((agent) => (
              <label
                key={agent.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-admin-border p-3 transition-colors has-[:checked]:border-[#c91510] has-[:checked]:bg-[#fff4ef] dark:has-[:checked]:bg-zinc-800"
              >
                <input
                  type="radio"
                  name="agent_id"
                  value={agent.id}
                  className="accent-[#c91510]"
                  required
                />
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-700">
                  <User size={14} />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main">
                    {agent.name}
                  </p>
                  <p className="text-xs text-text-subtle">{agent.phone}</p>
                </div>
              </label>
            ))}
          </div>
        )}

        {state && !state.ok && (
          <p className="text-xs font-semibold text-red-600">{state.error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending || agents.length === 0}>
            {isPending ? "Assigning..." : "Assign"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Broadcast Location Modal
// ---------------------------------------------------------------------------
function BroadcastLocationModal({
  open,
  onClose,
  orderId,
}: {
  open: boolean;
  onClose: () => void;
  orderId: string;
}) {
  const [broadcasting, setBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const broadcastCurrentLocation = async () => {
    setBroadcasting(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        },
      );

      const formData = new FormData();
      formData.append("order_id", orderId);
      formData.append("lat", String(position.coords.latitude));
      formData.append("lng", String(position.coords.longitude));
      if (position.coords.heading !== null) {
        formData.append("heading", String(position.coords.heading));
      }
      if (position.coords.speed !== null) {
        formData.append("speed", String(position.coords.speed * 3.6)); // m/s → km/h
      }

      const result = await updateDriverLocationAction(formData);
      if (result.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error ?? "Failed to update location.");
      }
    } catch {
      setError("Unable to get GPS location. Check permissions.");
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Update Driver Location">
      <div className="space-y-4">
        <p className="text-sm text-text-subtle">
          Share the delivery driver&apos;s current GPS location so the customer
          can track their order in real-time.
        </p>

        <Button
          onClick={broadcastCurrentLocation}
          disabled={broadcasting}
          className="w-full"
        >
          <Navigation
            size={14}
            className={broadcasting ? "animate-pulse" : ""}
          />
          {broadcasting
            ? "Getting Location..."
            : success
              ? "Location Updated ✓"
              : "Send Current Location"}
        </Button>

        {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

        <p className="text-[10px] text-text-subtle">
          Tip: Open this page on the driver&apos;s phone and tap the button
          while in transit to update the customer&apos;s live map.
        </p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface DeliveryClientProps {
  orders: DeliveryDashboardOrder[];
  agents: DeliveryAgentRow[];
}

export function DeliveryClient({ orders, agents }: DeliveryClientProps) {
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [broadcastOrderId, setBroadcastOrderId] = useState<string | null>(null);

  const preparingCount = orders.filter(
    (o) => o.order_status === "preparing",
  ).length;
  const outForDeliveryCount = orders.filter(
    (o) => o.order_status === "out_for_delivery",
  ).length;
  const deliveredCount = orders.filter(
    (o) => o.order_status === "delivered",
  ).length;

  const deliveryOrders = orders.filter(
    (order) =>
      order.order_status === "out_for_delivery" ||
      order.order_status === "delivered" ||
      order.order_status === "preparing",
  );

  const agentMap = new Map(agents.map((a) => [a.id, a]));

  const columns = [
    {
      header: "Order",
      accessorKey: "id",
      cell: (order: DeliveryDashboardOrder) => (
        <span className="font-mono text-xs font-bold text-text-main">
          #{order.id.split("-")[0]}
        </span>
      ),
    },
    {
      header: "Customer",
      accessorKey: "users",
      cell: (order: DeliveryDashboardOrder) => {
        const user = getOrderUser(order.users);
        return (
          <div>
            <p className="font-bold text-text-main">{user?.name || "Guest"}</p>
            <p className="max-w-[150px] truncate text-[10px] text-text-subtle">
              {user?.phone}
            </p>
          </div>
        );
      },
    },
    {
      header: "Address",
      accessorKey: "delivery_address",
      cell: (order: DeliveryDashboardOrder) => (
        <div>
          <span className="block max-w-[200px] truncate text-[11px] text-text-subtle">
            {getAddressLabel(order.delivery_address)}
          </span>
          {order.delivery_area && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#c91510]">
              <MapPin size={9} />
              {order.delivery_area}
            </span>
          )}
        </div>
      ),
    },
    {
      header: "Agent",
      accessorKey: "assigned_agent_id",
      cell: (order: DeliveryDashboardOrder) => {
        const agent = order.assigned_agent_id
          ? agentMap.get(order.assigned_agent_id)
          : null;

        if (agent) {
          return (
            <div className="flex items-center gap-1.5">
              <UserCheck size={12} className="text-emerald-500" />
              <div>
                <p className="text-xs font-bold text-text-main">{agent.name}</p>
                <p className="text-[10px] text-text-subtle">{agent.phone}</p>
              </div>
            </div>
          );
        }

        return (
          <Button
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => setAssignOrderId(order.id)}
          >
            <User size={10} />
            Assign
          </Button>
        );
      },
    },
    {
      header: "Status",
      accessorKey: "order_status",
      cell: (order: DeliveryDashboardOrder) => {
        let variant: "warning" | "success" | "outline" = "outline";
        let Icon = Clock;

        if (order.order_status === "delivered") {
          variant = "success";
          Icon = CheckCircle;
        } else if (order.order_status === "out_for_delivery") {
          variant = "warning";
          Icon = Truck;
        }

        return (
          <Badge variant={variant} className="flex w-fit items-center gap-1.5">
            <Icon size={12} />
            {order.order_status.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      header: "Actions",
      accessorKey: "actions",
      cell: (order: DeliveryDashboardOrder) => {
        if (order.order_status !== "out_for_delivery") return null;

        return (
          <Button
            variant="outline"
            className="h-7 text-[10px]"
            onClick={() => setBroadcastOrderId(order.id)}
          >
            <Navigation size={10} />
            Update GPS
          </Button>
        );
      },
    },
    {
      header: "Date",
      accessorKey: "created_at",
      cell: (order: DeliveryDashboardOrder) => (
        <span className="text-xs">{formatDate(order.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
          Delivery Management
        </h1>
        <p className="text-xs text-text-subtle sm:text-sm">
          Assign drivers, track deliveries, and broadcast live location.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Preparing
          </p>
          <p className="mt-2 text-2xl font-black text-text-main">
            {preparingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Out for Delivery
          </p>
          <p className="mt-2 text-2xl font-black text-amber-500">
            {outForDeliveryCount}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Delivered Today
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-500">
            {deliveredCount}
          </p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
            Active Agents
          </p>
          <p className="mt-2 text-2xl font-black text-blue-500">
            {agents.length}
          </p>
        </div>
      </div>

      {/* Agents section */}
      <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-main">Delivery Agents</h2>
          <Button variant="outline" onClick={() => setShowAddAgent(true)}>
            <Plus size={12} />
            Add Agent
          </Button>
        </div>

        {agents.length === 0 ? (
          <p className="mt-4 text-center text-sm text-text-subtle">
            No delivery agents yet. Add your first driver.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Orders table */}
      <DataTable data={deliveryOrders} columns={columns} searchKey="id" />

      {/* Modals */}
      <AddAgentModal
        open={showAddAgent}
        onClose={() => setShowAddAgent(false)}
      />
      {assignOrderId && (
        <AssignAgentModal
          open
          onClose={() => setAssignOrderId(null)}
          orderId={assignOrderId}
          agents={agents}
        />
      )}
      {broadcastOrderId && (
        <BroadcastLocationModal
          open
          onClose={() => setBroadcastOrderId(null)}
          orderId={broadcastOrderId}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agent Card
// ---------------------------------------------------------------------------
function AgentCard({ agent }: { agent: DeliveryAgentRow }) {
  const [, formAction, isPending] = useActionState(
    deleteDeliveryAgentAction,
    null,
  );

  return (
    <div className="flex items-center justify-between rounded-xl border border-admin-border bg-white p-3 dark:bg-zinc-900">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff4ef] dark:bg-zinc-800">
          <User size={14} className="text-[#c91510]" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-main">{agent.name}</p>
          <p className="flex items-center gap-1 text-[10px] text-text-subtle">
            <Phone size={9} />
            {agent.phone}
          </p>
        </div>
      </div>
      <form action={formAction}>
        <input type="hidden" name="id" value={agent.id} />
        <Button
          variant="ghost"
          className="h-7 w-7 p-0 text-red-400 hover:text-red-600"
          disabled={isPending}
        >
          <Trash2 size={12} />
        </Button>
      </form>
    </div>
  );
}
