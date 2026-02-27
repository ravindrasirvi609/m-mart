import { getAdminCollections } from "@/lib/queries";
import { CollectionsClient } from "@/components/admin/collections-client";

export const metadata = { title: "Admin Collections" };

export default async function AdminCollectionsPage() {
  const { collections, products } = await getAdminCollections();

  return (
    <div className="animate-page-enter">
      <CollectionsClient collections={collections} products={products} />
    </div>
  );
}
