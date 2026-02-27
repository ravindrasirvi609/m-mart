import { getAdminBanners } from "@/lib/queries";
import { BannersClient } from "@/components/admin/banners-client";

export const metadata = { title: "Admin Banners" };

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <div className="animate-page-enter">
      <BannersClient banners={banners} />
    </div>
  );
}
