"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateOrderStatusAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/lib/constants";

interface UpdateOrderStatusFormProps {
    orderId: string;
    paymentStatus: string;
    orderStatus: string;
}

export function UpdateOrderStatusForm({
    orderId,
    paymentStatus,
    orderStatus,
}: UpdateOrderStatusFormProps) {
    const [state, formAction, isPending] = useActionState(updateOrderStatusAction, null);

    useEffect(() => {
        if (state?.ok) {
            toast.success(state.message || "Order status updated.");
        } else if (state?.ok === false) {
            toast.error(state.error || "Failed to update order status.");
        }
    }, [state]);

    return (
        <form action={formAction} className="grid gap-3 sm:grid-cols-3">
            <input type="hidden" name="order_id" value={orderId} />

            <Select
                name="payment_status"
                defaultValue={paymentStatus}
                className="!bg-[#202332] !text-zinc-100"
                disabled={isPending}
            >
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                    </option>
                ))}
            </Select>

            <Select
                name="order_status"
                defaultValue={orderStatus}
                className="!bg-[#202332] !text-zinc-100"
                disabled={isPending}
            >
                {ORDER_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                        {status.replace(/_/g, " ")}
                    </option>
                ))}
            </Select>

            <Button type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update Status"}
            </Button>
        </form>
    );
}
