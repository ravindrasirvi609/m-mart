import { CartClient } from "@/components/store/cart-client";
import { Reveal } from "@/components/ui/reveal";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5 sm:p-6">
          <h1 className="font-display text-3xl font-black tracking-tight text-text-main">Your Cart</h1>
          <p className="mt-1 text-sm font-medium text-text-subtle">
            Review items and move to secure checkout.
          </p>
        </section>
      </Reveal>
      <CartClient />
    </div>
  );
}
