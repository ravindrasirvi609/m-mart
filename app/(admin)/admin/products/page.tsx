import Link from "next/link";

import { AddCategoryForm } from "@/components/admin/add-category-form";
import { AddProductForm } from "@/components/admin/add-product-form";
import { DeleteProductButton } from "@/components/admin/delete-product-form";
import { Button } from "@/components/ui/button";
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
        <AddCategoryForm />
        <AddProductForm categories={categories} />
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
                      <DeleteProductButton productId={product.id} />
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
