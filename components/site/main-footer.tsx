import Link from "next/link";
import { Facebook, Instagram, MapPin, Phone, ShoppingBag } from "lucide-react";

import { STORE } from "@/lib/constants";

export function MainFooter() {
  return (
    <footer className="mt-12 bg-gradient-to-r from-[#8f0603] to-[#c30b07] text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-white/20 p-2">
              <ShoppingBag size={18} />
            </div>
            <p className="font-display text-xl font-bold">Mmart</p>
          </div>
          <p className="text-sm text-white/85">
            Premium grocery delivery with fast service, fresh produce, and trusted manual UPI verification.
          </p>
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Quick Links</h3>
          <div className="mt-3 grid gap-2 text-sm">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/products" className="hover:underline">Shop</Link>
            <Link href="/orders" className="hover:underline">Orders</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
            <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:underline">Terms & Conditions</Link>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Categories</h3>
          <div className="mt-3 grid gap-2 text-sm text-white/90">
            <p>Vegetables</p>
            <p>Fruits</p>
            <p>Dairy</p>
            <p>Snacks</p>
          </div>
        </section>

        <section className="space-y-2 text-sm">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">Contact</h3>
          <p className="flex items-start gap-2 text-white/90">
            <MapPin size={16} className="mt-0.5" />
            {STORE.location}
          </p>
          <a href={`tel:${STORE.phone}`} className="flex items-center gap-2 text-white/90 hover:underline">
            <Phone size={16} />
            {STORE.phone}
          </a>
          <div className="mt-2 flex gap-2">
            <a href="#" className="rounded-full bg-white/15 p-2 transition hover:bg-white/25" aria-label="Instagram">
              <Instagram size={16} />
            </a>
            <a href="#" className="rounded-full bg-white/15 p-2 transition hover:bg-white/25" aria-label="Facebook">
              <Facebook size={16} />
            </a>
          </div>
        </section>
      </div>
      <div className="border-t border-white/20 py-3 text-center text-xs text-white/80">
        © {new Date().getFullYear()} Mmart. All rights reserved.
      </div>
    </footer>
  );
}
