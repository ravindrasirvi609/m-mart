import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description: "Learn how Mmart collects, uses, shares, and protects your information.",
};

const sections = [
  {
    title: "1. Information we collect",
    points: [
      "Account information such as your name, phone number, and login credentials.",
      "Order information including products purchased, quantities, pricing, and delivery preferences.",
      "Delivery information such as address details and contact instructions.",
      "Payment verification data, including UPI transaction references and payment proof screenshots uploaded in the app.",
      "Support and communication records when you contact us for help.",
    ],
  },
  {
    title: "2. How we use your information",
    points: [
      "To process, verify, pack, and deliver your orders.",
      "To confirm payments and prevent fraudulent transactions.",
      "To communicate order updates, delivery status, and service notices.",
      "To improve app performance, inventory planning, and customer experience.",
      "To comply with legal, tax, accounting, and regulatory obligations.",
    ],
  },
  {
    title: "3. How we share information",
    points: [
      "We do not sell your personal information.",
      "Data may be shared with trusted service providers (such as hosting, communications, and delivery operations) strictly for order fulfillment.",
      "Information may be disclosed when required by law, legal process, or government request.",
    ],
  },
  {
    title: "4. Data storage and security",
    points: [
      "Mmart uses secure infrastructure and role-based access controls to restrict internal access.",
      "Data is stored on trusted platforms used to operate our service (including Supabase-powered backend services).",
      "While we apply reasonable safeguards, no digital system can be guaranteed 100% secure.",
    ],
  },
  {
    title: "5. Data retention",
    points: [
      "Order and transaction records are retained for operational, legal, and accounting purposes.",
      "Payment proof images are retained only as long as needed for verification, dispute handling, and audit requirements.",
      "When data is no longer necessary, we delete or anonymize it where practical.",
    ],
  },
  {
    title: "6. Your privacy choices",
    points: [
      "You may request correction of inaccurate profile or address information.",
      "You may request account deletion, subject to legal or transactional retention requirements.",
      "You may contact us for questions about how your data is collected or used.",
    ],
  },
  {
    title: "7. Children’s privacy",
    points: [
      "Mmart services are not intended for children under 18 years of age.",
      "We do not knowingly collect personal information directly from children.",
    ],
  },
  {
    title: "8. Updates to this policy",
    points: [
      "We may update this Privacy Policy from time to time to reflect business, legal, or technical changes.",
      "The updated version and effective date will be posted on this page.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <article className="premium-card space-y-6 p-6 sm:p-7">
        <header className="space-y-3">
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Privacy Policy
          </h1>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Effective date: February 25, 2026
          </p>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            This Privacy Policy describes how Mmart collects, uses, stores, and protects personal
            information when you use our website and mobile app.
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
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">9. Contact us</h2>
          <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            For privacy-related requests, please contact support through your profile/support channel
            in the app or via the store contact details shown in the website footer.
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
