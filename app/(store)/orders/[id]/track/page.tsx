import { OrderTrackingView } from "@/components/store/order-tracking-view";
import { requireUser } from "@/lib/auth";

export const metadata = {
  title: "Track Order",
};

interface TrackOrderPageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackOrderPage({ params }: TrackOrderPageProps) {
  await requireUser("/orders");
  const { id } = await params;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <OrderTrackingView orderId={id} />
    </div>
  );
}
