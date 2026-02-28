import { getDeliveryDashboardData } from "@/lib/queries";
import { DeliveryClient } from "@/components/admin/delivery-client-v2";

export const metadata = {
  title: "Admin Delivery",
};

export default async function AdminDeliveryPage() {
  const { orders, agents } = await getDeliveryDashboardData();

  return (
    <div className="animate-page-enter">
      <DeliveryClient orders={orders} agents={agents} />
    </div>
  );
}
