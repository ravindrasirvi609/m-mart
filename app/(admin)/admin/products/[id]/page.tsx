import { notFound } from "next/navigation";

import { upsertProductAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAdminProductById } from "@/lib/queries";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, categories } = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <form
      action={upsertProductAction}
      className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Edit Product</h1>

      <input type="hidden" name="id" value={product.id} />

      <Input name="name" required defaultValue={product.name} />
      <Textarea name="description" required rows={4} defaultValue={product.description} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={product.price}
        />
        <Input
          name="discount_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={product.discount_price ?? ""}
        />
        <Input name="stock" type="number" min="0" required defaultValue={product.stock} />
        <Select name="category" required defaultValue={product.category}>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>

      <Input name="image_url" type="url" defaultValue={product.image_url} />
      <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" />

      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <input type="checkbox" name="is_active" defaultChecked={product.is_active} /> Active
      </label>

      <Button type="submit">Save Changes</Button>
    </form>
  );
}
