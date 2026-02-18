import { getAdminOrders } from "@/lib/queries";
import { DeliveryClient } from "@/components/admin/delivery-client";

export const metadata = {
    title: "Admin Delivery",
};

export default async function AdminDeliveryPage() {
    const orders = await getAdminOrders();

    return (
        <div className="animate-page-enter">
            <DeliveryClient orders={orders} />
        </div>
    );
}
