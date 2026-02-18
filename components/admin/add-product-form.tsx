"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertProductAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/queries";

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
            className="rounded-2xl border border-white/10 bg-[#181a23] p-4"
        >
            <h2 className="text-lg font-bold text-white">Add Product</h2>
            <div className="mt-3 space-y-3">
                <Input
                    name="name"
                    required
                    placeholder="Product name"
                    className="!bg-[#202332] !text-zinc-100"
                    disabled={isPending}
                />
                <Textarea
                    name="description"
                    required
                    placeholder="Description"
                    rows={3}
                    className="!bg-[#202332] !text-zinc-100"
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
                        className="!bg-[#202332] !text-zinc-100"
                        disabled={isPending}
                    />
                    <Input
                        name="discount_price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Discount price"
                        className="!bg-[#202332] !text-zinc-100"
                        disabled={isPending}
                    />
                    <Input
                        name="stock"
                        type="number"
                        min="0"
                        required
                        placeholder="Stock"
                        className="!bg-[#202332] !text-zinc-100"
                        disabled={isPending}
                    />
                    <Select
                        name="category"
                        required
                        defaultValue=""
                        className="!bg-[#202332] !text-zinc-100"
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
                    className="!bg-[#202332] !text-zinc-100"
                    disabled={isPending}
                />
                <Input
                    name="image_file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="!bg-[#202332] !text-zinc-100"
                    disabled={isPending}
                />

                <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" name="is_active" defaultChecked disabled={isPending} /> Active
                </label>

                <Button type="submit" disabled={isPending}>
                    {isPending ? "Creating..." : "Create Product"}
                </Button>
            </div>
        </form>
    );
}
