"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { deleteProductAction } from "@/actions/admin-actions";

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
        <form
            action={action}
            onSubmit={(event) => {
                const confirmed = window.confirm("Delete this product permanently?");
                if (!confirmed) {
                    event.preventDefault();
                }
            }}
        >
            <input type="hidden" name="id" value={productId} />
            <button
                type="submit"
                disabled={isPending}
                className="rounded-lg p-2 text-text-subtle hover:bg-rose-500/10 hover:text-rose-500 transition-colors disabled:opacity-50"
                title="Delete Product"
                aria-label="Delete product"
            >
                <Trash2 size={16} />
            </button>
            <span className="sr-only" role="status" aria-live="polite">
                {state?.ok ? state.message : state?.error || ""}
            </span>
        </form>
    );
}
