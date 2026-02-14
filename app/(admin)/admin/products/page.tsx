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
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <form
          action={upsertCategoryAction}
          className="rounded-2xl border border-white/10 bg-[#181a23] p-4"
        >
          <h2 className="text-lg font-bold text-white">Add Category</h2>
          <div className="mt-3 space-y-3">
            <Input name="name" required placeholder="Category name" className="!bg-[#202332] !text-zinc-100" />
            <Button type="submit">Save Category</Button>
          </div>
        </form>

        <form
          action={upsertProductAction}
          className="rounded-2xl border border-white/10 bg-[#181a23] p-4"
        >
          <h2 className="text-lg font-bold text-white">Add Product</h2>
          <div className="mt-3 space-y-3">
            <Input name="name" required placeholder="Product name" className="!bg-[#202332] !text-zinc-100" />
            <Textarea name="description" required placeholder="Description" rows={3} className="!bg-[#202332] !text-zinc-100" />

            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="price" type="number" step="0.01" min="0" required placeholder="Price" className="!bg-[#202332] !text-zinc-100" />
              <Input
                name="discount_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="Discount price"
                className="!bg-[#202332] !text-zinc-100"
              />
              <Input name="stock" type="number" min="0" required placeholder="Stock" className="!bg-[#202332] !text-zinc-100" />
              <Select name="category" required defaultValue="" className="!bg-[#202332] !text-zinc-100">
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

            <Input name="image_url" type="url" placeholder="Image URL" className="!bg-[#202332] !text-zinc-100" />
            <Input name="image_file" type="file" accept="image/png,image/jpeg,image/webp" className="!bg-[#202332] !text-zinc-100" />

            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" name="is_active" defaultChecked /> Active
            </label>

            <Button type="submit">Create Product</Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#181a23] p-4">
        <h2 className="text-lg font-bold text-white">Product Inventory</h2>

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="text-zinc-400">
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
                <tr key={product.id} className="border-t border-white/10 text-zinc-100">
                  <td className="px-2 py-2 font-semibold">{product.name}</td>
                  <td className="px-2 py-2">{product.category}</td>
                  <td className="px-2 py-2">{formatCurrency(product.price)}</td>
                  <td className="px-2 py-2">{product.stock}</td>
                  <td className="px-2 py-2">{product.is_active ? "Active" : "Inactive"}</td>
                  <td className="px-2 py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${product.id}`}>
                        <Button variant="outline">Edit</Button>
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
