import Link from "next/link";

import {
  deleteProductAction,
  upsertCategoryAction,
  upsertProductAction,
} from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getAdminProducts } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Admin Products",
};

export default async function AdminProductsPage() {
  const { products, categories } = await getAdminProducts();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <form
          action={upsertCategoryAction}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add Category</h2>
          <Input name="name" required placeholder="Category name" />
          <Button type="submit">Save Category</Button>
        </form>

        <form
          action={upsertProductAction}
          className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Add Product</h2>
          <Input name="name" required placeholder="Product name" />
          <Textarea name="description" required placeholder="Description" rows={3} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="price" type="number" step="0.01" min="0" required placeholder="Price" />
            <Input
              name="discount_price"
              type="number"
              step="0.01"
              min="0"
              placeholder="Discount price"
            />
            <Input name="stock" type="number" min="0" required placeholder="Stock" />
            <Select name="category" required defaultValue="">
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

          <Input name="image_url" type="url" placeholder="Image URL" />
          <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" />

          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input type="checkbox" name="is_active" defaultChecked /> Active
          </label>

          <Button type="submit">Create Product</Button>
        </form>
      </section>

      <section className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Product Inventory</h2>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-500">
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Category</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Stock</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-2 py-2 font-medium">{product.name}</td>
                  <td className="px-2 py-2">{product.category}</td>
                  <td className="px-2 py-2">{formatCurrency(product.price)}</td>
                  <td className="px-2 py-2">{product.stock}</td>
                  <td className="px-2 py-2">{product.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <form action={deleteProductAction}>
                        <input type="hidden" name="id" value={product.id} />
                        <Button variant="danger" type="submit">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
