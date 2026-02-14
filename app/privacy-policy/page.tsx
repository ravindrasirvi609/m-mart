import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <article className="premium-card space-y-5 p-6">
        <h1 className="font-display text-3xl font-black tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Effective date: February 14, 2026.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Mmart collects account details, delivery address, order history, and payment proof images
          only to process and deliver grocery orders.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Data is processed securely using Supabase and protected with role-based access. Payment
          screenshots are used only for manual UPI verification.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          We do not sell personal information. Data may be shared only with service providers
          required for order fulfillment, communication, and infrastructure.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          For privacy requests, contact us via the profile/support channel in the app or at the
          store phone number listed in footer.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          By using Mmart, you agree to this policy.
        </p>
        <Link href="/" className="text-sm font-semibold text-[#e10600] hover:underline">
          Back to home
        </Link>
      </article>
    </main>
  );
}
