import { CartClient } from "@/components/store/cart-client";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Your Cart</h1>
      <CartClient />
    </div>
  );
}
