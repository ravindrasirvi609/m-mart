"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { deleteProductAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";

export function DeleteProductButton({ productId }: { productId: string }) {
    const [state, action, isPending] = useActionState(deleteProductAction, null);

    useEffect(() => {
        if (state?.ok) {
            toast.success(state.message);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form action={action}>
            <input type="hidden" name="id" value={productId} />
            <Button variant="danger" type="submit" disabled={isPending}>
                {isPending ? "Deleting..." : "Delete"}
            </Button>
        </form>
    );
}
