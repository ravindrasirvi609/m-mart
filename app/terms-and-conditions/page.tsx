import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <article className="premium-card space-y-5 p-6">
        <h1 className="font-display text-3xl font-black tracking-tight">Terms & Conditions</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Effective date: February 14, 2026.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Orders are confirmed only after payment screenshot verification by Mmart admin.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Delivery timelines are estimates and may vary by traffic, weather, and stock availability.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Customers must provide accurate delivery address and contact details. Invalid details may
          delay or cancel delivery.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Refunds for failed or rejected payments are handled manually after verification.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Mmart reserves the right to cancel suspicious or non-compliant orders.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          By continuing to use the app, you agree to these terms.
        </p>
        <Link href="/" className="text-sm font-semibold text-[#e10600] hover:underline">
          Back to home
        </Link>
      </article>
    </main>
  );
}
