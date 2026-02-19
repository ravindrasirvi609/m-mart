"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertCategoryAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

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
            className="rounded-2xl border border-admin-border bg-admin-card p-4"
        >
            <h2 className="text-lg font-bold text-text-main">Add Category</h2>
            <div className="mt-3 space-y-3">
                <Input
                    name="name"
                    required
                    placeholder="Category name"
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />
                <ActionFeedback
                    state={state}
                    successFallback="Category saved successfully."
                    errorFallback="Unable to save category."
                />
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Saving..." : "Save Category"}
                </Button>
            </div>
        </form>
    );
}
