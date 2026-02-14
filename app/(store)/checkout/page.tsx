import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/store/checkout-form";
import { Reveal } from "@/components/ui/reveal";
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
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5">
          <h1 className="font-display text-3xl font-black tracking-tight">Secure Checkout</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Complete address, pay through UPI QR, and upload screenshot for instant processing.
          </p>
        </section>
      </Reveal>
      <CheckoutForm
        defaultName={profile?.name || ""}
        defaultPhone={profile?.phone || ""}
        defaultAddress={profile?.address || ""}
      />
    </div>
  );
}
