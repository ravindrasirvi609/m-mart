import { redirect } from "next/navigation";

import { CheckoutForm } from "@/components/store/checkout-form";
import { Reveal } from "@/components/ui/reveal";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const profile = await getUserProfile(user.id);

  if (!user.email) {
    redirect("/login?next=%2Fcheckout");
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5 sm:p-6">
          <h1 className="font-display text-2xl font-black tracking-tight text-text-main sm:text-3xl">
            Secure Checkout
          </h1>
          <p className="mt-1 text-sm font-medium text-text-subtle">
            Confirm delivery details, pay via UPI, and upload screenshot.
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
