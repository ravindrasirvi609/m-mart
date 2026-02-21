"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, Lock, ShieldCheck } from "lucide-react";
import { useState, useTransition } from "react";

import { placeOrderAction } from "@/actions/order-actions";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPublicEnv } from "@/lib/env";
import { showAppToast, triggerHaptic } from "@/lib/mobile/feedback";
import { buildUpiPaymentUrl, buildUpiQrCodeUrl, canAttemptUpiLaunch, openUpiPayment } from "@/lib/mobile/payments";
import { formatCurrency } from "@/lib/utils";
import { STORE } from "@/lib/constants";

const allowedScreenshotTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);
const maxScreenshotSizeBytes = 5 * 1024 * 1024;

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
  const configuredUpiId = getPublicEnv().NEXT_PUBLIC_UPI_ID ?? STORE.upiId;
  const upiPaymentUrl = buildUpiPaymentUrl({
    upiId: configuredUpiId,
    payeeName: STORE.name,
    amount: total,
    note: "Mmart grocery order",
  });
  const upiQrCodeUrl = upiPaymentUrl ? buildUpiQrCodeUrl(upiPaymentUrl) : null;

  const [name, setName] = useState(defaultName);
  const [phone, setPhone] = useState(defaultPhone);
  const [address, setAddress] = useState(defaultAddress);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  const copyUpiId = async () => {
    if (!configuredUpiId) {
      await showAppToast("UPI ID is not configured yet.", "error");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(configuredUpiId);
      } else {
        const input = document.createElement("textarea");
        input.value = configuredUpiId;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.focus();
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      await showAppToast("UPI ID copied.", "success");
    } catch {
      await showAppToast("Unable to copy UPI ID. Please copy it manually.", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
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
          showAppToast("Upload payment screenshot before placing the order.", "error").catch(
            () => undefined,
          );
          triggerHaptic("warning").catch(() => undefined);
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
            await showAppToast(result.error, "error");
            await triggerHaptic("error");
            return;
          }

          clearCart();
          await showAppToast(`Order ${result.orderId.slice(0, 8)} placed successfully`, "success");
          await triggerHaptic("success");
          router.push("/orders");
        });
      }}
    >
      <section className="premium-card space-y-4 p-5">
        <h2 className="font-heading text-xl font-bold">Delivery & Payment</h2>

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

        <div className="rounded-xl bg-[#fff3ec] p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <p className="font-bold text-[#c91510]">Payment Instructions</p>
          <p className="mt-1">Pay via UPI QR and upload a screenshot for manual admin verification.</p>
          <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            Amount: {formatCurrency(total)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <p className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
              UPI ID: {configuredUpiId}
            </p>
            <Button type="button" variant="ghost" className="!px-2.5 !py-1.5 text-xs" onClick={copyUpiId}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy UPI ID"}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                if (!upiPaymentUrl) {
                  showAppToast("UPI deep link is not configured yet.", "error").catch(
                    () => undefined,
                  );
                  return;
                }

                if (!canAttemptUpiLaunch()) {
                  showAppToast("Use your phone to open UPI app, or pay by scanning QR.", "info").catch(
                    () => undefined,
                  );
                  return;
                }

                const opened = openUpiPayment(upiPaymentUrl);
                if (!opened) {
                  showAppToast("Could not open UPI app. Use QR or copy UPI ID.", "error").catch(
                    () => undefined,
                  );
                  return;
                }

                showAppToast("Opening UPI app...", "info").catch(() => undefined);
              }}
            >
              <ExternalLink size={14} />
              Open UPI App
            </Button>
          </div>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Upload Payment Screenshot</span>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            capture="environment"
            required
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              if (!file) {
                setScreenshot(null);
                return;
              }

              if (!allowedScreenshotTypes.has(file.type)) {
                showAppToast("Use PNG, JPG, or WEBP screenshot.", "error").catch(() => undefined);
                event.currentTarget.value = "";
                setScreenshot(null);
                return;
              }

              if (file.size > maxScreenshotSizeBytes) {
                showAppToast("Screenshot must be below 5MB.", "error").catch(() => undefined);
                event.currentTarget.value = "";
                setScreenshot(null);
                return;
              }

              setScreenshot(file);
            }}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-300">
            Accepted: PNG/JPG/WEBP, max 5MB.
            {screenshot ? ` Selected: ${screenshot.name}` : ""}
          </p>
        </label>

        <div className="grid gap-2 rounded-xl border border-[#c91510]/16 bg-white p-3 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          <p className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-emerald-600" /> Secure checkout flow</p>
          <p className="inline-flex items-center gap-2"><Lock size={14} className="text-emerald-600" /> Manual payment verification</p>
        </div>
      </section>

      <aside className="premium-card h-fit space-y-4 p-5 lg:sticky lg:top-24">
        <h2 className="font-heading text-xl font-bold">Order Summary</h2>

        <div className="mx-auto w-fit rounded-2xl border border-[#c91510]/18 bg-white p-2 shadow-[0_0_0_4px_rgba(201,21,16,0.08)]">
          <div className="relative h-52 w-52 overflow-hidden rounded-xl border border-[#c91510]/18 bg-white">
            {upiQrCodeUrl ? (
              <Image src={upiQrCodeUrl} alt="UPI QR Code" fill className="object-contain p-3" unoptimized />
            ) : (
              <Image src="/upi-qr.svg" alt="UPI QR placeholder" fill className="object-contain p-3" />
            )}
          </div>
        </div>

        <div className="space-y-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
          </div>
          <div className="flex justify-between border-t border-[#c91510]/14 pt-3 text-lg font-black text-[#c91510]">
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
