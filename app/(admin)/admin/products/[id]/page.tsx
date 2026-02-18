import { notFound } from "next/navigation";

import { EditProductForm } from "@/components/admin/edit-product-form";
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

  return <EditProductForm product={product} categories={categories} />;
}
