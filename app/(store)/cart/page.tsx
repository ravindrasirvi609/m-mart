import { CartClient } from "@/components/store/cart-client";
import { Reveal } from "@/components/ui/reveal";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5">
          <h1 className="font-display text-3xl font-black tracking-tight">Your Cart</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Review items, apply offers later, and checkout securely.
          </p>
        </section>
      </Reveal>
      <CartClient />
    </div>
  );
}
