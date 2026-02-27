import { getAdminProductTags } from "@/lib/queries";
import { ProductTagsClient } from "@/components/admin/product-tags-client";

export const metadata = { title: "Admin Product Tags" };

export default async function AdminProductTagsPage() {
  const { tags, products } = await getAdminProductTags();

  return (
    <div className="animate-page-enter">
      <ProductTagsClient tags={tags} products={products} />
    </div>
  );
}
