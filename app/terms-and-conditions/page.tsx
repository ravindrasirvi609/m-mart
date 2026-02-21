import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <article className="premium-card space-y-5 p-6 sm:p-7">
        <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Terms & Conditions</h1>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Effective date: February 14, 2026.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          Orders are confirmed only after payment screenshot verification by Mmart admin.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          Delivery timelines are estimates and may vary by traffic, weather, and stock availability.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          Customers must provide accurate delivery address and contact details. Invalid details may
          delay or cancel delivery.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          Refunds for failed or rejected payments are handled manually after verification.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          Mmart reserves the right to cancel suspicious or non-compliant orders.
        </p>
        <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
          By continuing to use the app, you agree to these terms.
        </p>
        <Link href="/" className="text-sm font-bold text-[#c91510] hover:underline">
          Back to home
        </Link>
      </article>
    </main>
  );
}
