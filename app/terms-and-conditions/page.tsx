import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions",
  description: "The terms that govern use of Mmart services, orders, and deliveries.",
};

const sections = [
  {
    title: "1. Acceptance of terms",
    points: [
      "By using Mmart, you agree to these Terms & Conditions and our Privacy Policy.",
      "If you do not agree with these terms, you should not use the service.",
    ],
  },
  {
    title: "2. Account and eligibility",
    points: [
      "You must provide accurate profile, delivery, and contact information.",
      "You are responsible for maintaining the confidentiality of your account credentials.",
      "Mmart may suspend accounts involved in misuse, fraud, or policy violations.",
    ],
  },
  {
    title: "3. Product availability and pricing",
    points: [
      "Product listings are subject to stock availability and may change without prior notice.",
      "Prices, discounts, and offers can be updated at any time before order confirmation.",
      "In case of listing or pricing errors, Mmart reserves the right to cancel or adjust affected orders.",
    ],
  },
  {
    title: "4. Orders and payment verification",
    points: [
      "Orders are considered confirmed only after payment verification by Mmart.",
      "When required, customers must upload valid payment proof for UPI/manual confirmation.",
      "Mmart may reject or cancel orders with invalid, incomplete, or suspicious payment details.",
    ],
  },
  {
    title: "5. Delivery terms",
    points: [
      "Delivery timelines are estimates and can vary due to demand, weather, traffic, or stock delays.",
      "Customers must ensure someone is available to receive the order at the provided address.",
      "Repeated failed delivery attempts due to incorrect address or unreachable contact may lead to order cancellation.",
    ],
  },
  {
    title: "6. Cancellations, refunds, and returns",
    points: [
      "Order cancellation may not be available once processing or dispatch has started.",
      "Refunds for failed or duplicate payments are processed after manual verification.",
      "For quality issues, damaged items, or missing products, customers should report the issue promptly via support.",
    ],
  },
  {
    title: "7. User responsibilities",
    points: [
      "You agree not to misuse the platform, interfere with operations, or submit fraudulent information.",
      "You must use the service only for lawful purposes and in compliance with applicable regulations.",
    ],
  },
  {
    title: "8. Limitation of liability",
    points: [
      "Mmart is not liable for indirect, incidental, or consequential losses arising from service usage.",
      "Our liability for any claim related to an order is limited to the amount paid for that specific order, to the extent permitted by law.",
    ],
  },
  {
    title: "9. Modifications to terms",
    points: [
      "Mmart may revise these Terms & Conditions to reflect operational or legal updates.",
      "Revised terms become effective once posted on this page with an updated effective date.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <article className="premium-card space-y-6 p-6 sm:p-7">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Terms & Conditions
          </h1>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Effective date: February 25, 2026
          </p>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            These Terms & Conditions govern your access to and use of Mmart services, including
            browsing products, placing orders, making payments, and receiving deliveries.
          </p>
        </header>

        <section className="space-y-5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {section.title}
              </h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">10. Contact us</h2>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            If you have questions about these terms or need support with an order, please contact
            us through the support option in your profile or the store contact details in the
            website footer.
          </p>
        </section>

        <div>
          <Link href="/" className="text-sm font-bold text-[#c91510] hover:underline">
            Back to home
          </Link>
        </div>
      </article>
    </main>
  );
}
