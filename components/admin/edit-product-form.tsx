"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { upsertProductAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category, Product } from "@/lib/queries";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";

export function EditProductForm({
    product,
    categories,
}: {
    product: Product;
    categories: Category[];
}) {
    const [state, action, isPending] = useActionState(upsertProductAction, null);
    const router = useRouter();

    useEffect(() => {
        if (state?.ok) {
            toast.success(state.message);
            // Wait a bit then redirect back to product list
            setTimeout(() => {
                router.push("/admin/products");
            }, 1000);
        } else if (state?.error) {
            toast.error(state.error);
        }
    }, [state, router]);

    return (
        <div className="mx-auto w-full max-w-4xl space-y-4">
            <div className="space-y-1">
                <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
                    Edit Product
                </h1>
                <p className="text-xs text-text-subtle sm:text-sm">
                    Update inventory details, pricing, and visibility.
                </p>
            </div>

            <form
                action={action}
                className="space-y-3 rounded-2xl border border-admin-border bg-admin-card p-4 sm:p-5"
            >
                <input type="hidden" name="id" value={product.id} />

                <Input
                    name="name"
                    required
                    defaultValue={product.name}
                    className="!bg-white/5 !text-text-main"
                    disabled={isPending}
                />
                <Textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={product.description}
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
                        defaultValue={product.price}
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Input
                        name="discount_price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={product.discount_price ?? ""}
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Input
                        name="stock"
                        type="number"
                        min="0"
                        required
                        defaultValue={product.stock}
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    />
                    <Select
                        name="category"
                        required
                        defaultValue={product.category}
                        className="!bg-white/5 !text-text-main"
                        disabled={isPending}
                    >
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
                    defaultValue={product.image_url}
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
                    <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={product.is_active}
                        disabled={isPending}
                        className="accent-brand-red"
                    />
                    Active
                </label>

                <ActionFeedback
                    state={state}
                    successFallback="Product updated successfully."
                    errorFallback="Unable to update product."
                />

                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                    {isPending ? "Saving..." : "Save Changes"}
                </Button>
            </form>
        </div>
    );
}
