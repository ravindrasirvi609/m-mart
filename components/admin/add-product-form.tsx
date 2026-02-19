"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertProductAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/queries";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

export function AddProductForm({ categories }: { categories: Category[] }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, action, isPending] = useActionState(upsertProductAction, null);

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
            <h2 className="text-lg font-bold text-text-main">Add Product</h2>
            <div className="mt-3 space-y-3">
                <Input
                    name="name"
                    required
                    placeholder="Product name"
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />
                <Textarea
                    name="description"
                    required
                    placeholder="Description"
                    rows={3}
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Price"
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Input
                        name="discount_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Discount price"
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Input
                        name="stock"
                        type="number"
                        min="0"
                        required
                        placeholder="Stock"
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Select
                        name="category"
                        required
                        defaultValue=""
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    >
                        <option value="" disabled>
                            Select category
                        </option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.name}>
                                {category.name}
                            </option>
                        ))}
                    </Select>
                </div>

                <Input
                    name="image_url"
                    type="url"
                    placeholder="Image URL"
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />
                <Input
                    name="image_file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />

                <label className="flex items-center gap-2 text-sm text-text-subtle">
                    <input type="checkbox" name="is_active" defaultChecked disabled={isPending} className="accent-brand-red" /> Active
                </label>

                <ActionFeedback
                    state={state}
                    successFallback="Product created successfully."
                    errorFallback="Unable to save product."
                />

                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Creating..." : "Create Product"}
                </Button>
            </div>
        </form>
    );
}
