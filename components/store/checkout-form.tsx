"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { placeOrderAction } from "@/actions/order-actions";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

type CheckoutFormProps = {
  defaultName: string;
  defaultPhone: string;
  defaultAddress: string;
};

export function CheckoutForm({
  defaultName,
  defaultPhone,
  defaultAddress,
}: CheckoutFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { items, subtotal, deliveryCharge, total, clearCart } = useCart();
  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);
  const [screenshot, setScreenshot] = useState<File | null>(null);

  if (items.length === 0) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Add items to cart before checkout.
        </p>
        <Button className="mt-4" onClick={() => router.push("/products")}>Browse Products</Button>
      </div>
    );
  }

  return (
    <form
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
      onSubmit={(event) => {
        event.preventDefault();

        if (!screenshot) {
          toast.error("Upload payment screenshot before placing the order.");
          return;
        }

        const cartPayload = items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        }));

        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);
        formData.append("address", address);
        formData.append("payment_screenshot", screenshot);
        formData.append("cart_payload", JSON.stringify(cartPayload));

        startTransition(async () => {
          const result = await placeOrderAction(formData);

          if (!result.ok) {
            toast.error(result.error);
            return;
          }

          clearCart();
          toast.success(`Order ${result.orderId.slice(0, 8)} placed successfully`);
          router.push("/orders");
        });
      }}
    >
      <section className="premium-card space-y-4 p-5">
        <h2 className="font-heading text-xl font-bold">Delivery Address</h2>

        <Input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Full name"
        />

        <Input
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Phone number"
        />

        <Textarea
          required
          rows={4}
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          placeholder="Complete delivery address"
        />

        <div className="rounded-xl bg-red-50 p-4 text-sm text-zinc-700">
          <p className="font-bold text-[#e10600]">Payment Instructions</p>
          <p className="mt-1">Pay via UPI QR and upload screenshot for manual admin verification.</p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Upload Payment Screenshot</span>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setScreenshot(file);
            }}
          />
        </label>

        <div className="grid gap-2 rounded-xl border border-red-100 bg-white p-3 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-600" /> Secure checkout flow</p>
          <p className="inline-flex items-center gap-2"><Lock size={14} className="text-emerald-600" /> Manual payment verification</p>
        </div>
      </section>

      <aside className="premium-card h-fit space-y-4 p-5">
        <h2 className="font-heading text-xl font-bold">Order Summary</h2>

        <div className="mx-auto w-fit rounded-2xl border border-red-200 bg-white p-2 shadow-[0_0_0_4px_rgba(225,6,0,0.08)]">
          <div className="relative h-52 w-52 overflow-hidden rounded-xl border border-red-100 bg-white">
            <Image src="/upi-qr.svg" alt="UPI QR Code" fill className="object-contain p-3" />
          </div>
        </div>

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
          </div>
          <div className="flex justify-between border-t border-red-100 pt-3 text-lg font-black text-[#e10600]">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <p className="rounded-xl bg-zinc-100 p-3 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          Initial status: <strong>Payment Pending Verification</strong>
        </p>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Placing Order..." : "Place Order"}
        </Button>
      </aside>
    </form>
  );
}
