import { getAdminProducts } from "@/lib/queries";
import { CategoriesClient } from "@/components/admin/categories-client";

export const metadata = {
    title: "Admin Categories",
};

export default async function AdminCategoriesPage() {
    const { categories } = await getAdminProducts();

    return (
        <div className="animate-page-enter">
            <CategoriesClient categories={categories} />
        </div>
    );
}
