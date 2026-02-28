import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/store/product-detail-view";
import { getProductById } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailView
      product={{
        ...product,
        image_urls: product.image_urls as string[] | undefined,
        product_highlights: product.product_highlights as
          | Record<string, string>
          | null
          | undefined,
      }}
    />
  );
}
