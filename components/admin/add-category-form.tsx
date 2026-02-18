"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertCategoryAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddCategoryForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, action, isPending] = useActionState(upsertCategoryAction, null);

    useEffect(() => {
        if (state?.ok) {
            toast.success(state.message);
            formRef.current?.reset();
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state]);

    return (
        <form
            ref={formRef}
            action={action}
            className="rounded-2xl border border-white/10 bg-[#181a23] p-4"
        >
            <h2 className="text-lg font-bold text-white">Add Category</h2>
            <div className="mt-3 space-y-3">
                <Input
                    name="name"
                    required
                    placeholder="Category name"
                    className="!bg-[#202332] !text-zinc-100"
                    disabled={isPending}
                />
                <Button type="submit" disabled={isPending}>
                    {isPending ? "Saving..." : "Save Category"}
                </Button>
            </div>
        </form>
    );
}
