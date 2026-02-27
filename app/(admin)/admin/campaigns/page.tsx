import { getAdminCampaigns } from "@/lib/queries";
import { CampaignsClient } from "@/components/admin/campaigns-client";

export const metadata = { title: "Admin Campaigns" };

export default async function AdminCampaignsPage() {
  const { campaigns, products } = await getAdminCampaigns();

  return (
    <div className="animate-page-enter">
      <CampaignsClient campaigns={campaigns} products={products} />
    </div>
  );
}
