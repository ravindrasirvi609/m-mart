import Link from "next/link";
import { SearchX } from "lucide-react";

export default function AdminNotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[45vh] max-w-xl flex-col items-center justify-center rounded-2xl border border-admin-border bg-admin-card p-6 text-center sm:p-8">
      <div className="rounded-full border border-admin-border bg-white/5 p-3 text-text-subtle">
        <SearchX size={22} />
      </div>
      <h1 className="mt-4 font-heading text-2xl font-black text-text-main">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-text-subtle">
        The admin page or resource you requested does not exist.
      </p>
      <Link
        href="/admin"
        className="mt-5 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#ff3b30] to-[#e10600] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_10px_26px_rgba(225,6,0,0.3)] transition-shadow hover:shadow-[0_14px_30px_rgba(225,6,0,0.4)]"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
