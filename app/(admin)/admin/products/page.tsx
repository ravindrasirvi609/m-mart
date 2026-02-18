import { getAdminProducts } from "@/lib/queries";
import { ProductsClient } from "@/components/admin/products-client";

export const metadata = {
  title: "Admin Products",
};

export default async function AdminProductsPage() {
  const { products, categories } = await getAdminProducts();

  return (
    <div className="animate-page-enter">
      <ProductsClient products={products} categories={categories} />
    </div>
  );
}
