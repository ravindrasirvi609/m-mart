import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/store/checkout-form";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  if (!user.email) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Checkout</h1>
      <CheckoutForm
        defaultName={profile?.name || ""}
        defaultPhone={profile?.phone || ""}
        defaultAddress={profile?.address || ""}
      />
    </div>
  );
}
