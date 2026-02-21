import Link from "next/link";
import { Facebook, Instagram, MapPin, Phone, ShoppingBag } from "lucide-react";

import { STORE } from "@/lib/constants";

export function MainFooter() {
  return (
    <footer className="mt-14 border-t border-[#b41611]/20 bg-gradient-to-br from-[#8f120f] via-[#b41511] to-[#d12618] text-white">
      <div className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/15 p-2">
              <ShoppingBag size={18} />
            </div>
            <p className="font-display text-xl font-bold">Mmart</p>
          </div>
          <p className="text-sm leading-6 text-white/85">
            Grocery shopping with fast dispatch, high-quality essentials, and secure payment confirmation.
          </p>
        </section>

        <section>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Shop</h3>
          <div className="mt-3 grid gap-2 text-sm text-white/95">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/products" className="hover:text-white">Browse Products</Link>
            <Link href="/cart" className="hover:text-white">Cart</Link>
            <Link href="/checkout" className="hover:text-white">Checkout</Link>
          </div>
        </section>

        <section>
          <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Account</h3>
          <div className="mt-3 grid gap-2 text-sm text-white/95">
            <Link href="/orders" className="hover:text-white">My Orders</Link>
            <Link href="/profile" className="hover:text-white">Profile</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-white">Terms & Conditions</Link>
          </div>
        </section>

        <section className="space-y-3 text-sm">
          <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/85">Contact</h3>
          <p className="flex items-start gap-2 text-white/92">
            <MapPin size={16} className="mt-0.5 shrink-0" />
            {STORE.location}
          </p>
          <a href={`tel:${STORE.phone}`} className="flex items-center gap-2 text-white/92 hover:text-white">
            <Phone size={16} />
            {STORE.phone}
          </a>

          <div className="mt-3 flex gap-2">
            <a href="#" className="rounded-full bg-white/15 p-2 transition hover:bg-white/25" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="rounded-full bg-white/15 p-2 transition hover:bg-white/25" aria-label="Facebook">
              <Facebook size={16} />
            </a>
          </div>
        </section>
      </div>

      <div className="border-t border-white/20 py-3 text-center text-xs font-medium text-white/82">
        © {new Date().getFullYear()} Mmart. Built for a smooth online shopping experience.
      </div>
    </footer>
  );
}
