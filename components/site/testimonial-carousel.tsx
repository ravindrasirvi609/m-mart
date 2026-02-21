"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";

const testimonials = [
  {
    name: "Priya Jadhav",
    text: "Super fast delivery and vegetables are always fresh. The checkout flow is very smooth.",
  },
  {
    name: "Rohit Patil",
    text: "UPI screenshot verification was simple and I got live order updates. Very reliable service.",
  },
  {
    name: "Neha Kulkarni",
    text: "Premium app feel. Great offers and quality products. My weekly grocery app from now on.",
  },
];

export function TestimonialCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % testimonials.length);
    }, 4500);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="overflow-hidden">
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {testimonials.map((item) => (
          <article key={item.name} className="w-full shrink-0 px-1">
            <div className="premium-card soft-red-panel rounded-2xl p-6">
              <div className="mb-2 flex gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={15} fill="currentColor" />
                ))}
              </div>
              <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-200">“{item.text}”</p>
              <p className="mt-4 text-sm font-black text-[#c91510]">{item.name}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {testimonials.map((item, dotIndex) => (
          <button
            key={item.name}
            onClick={() => setIndex(dotIndex)}
            className={`h-2.5 rounded-full transition-all ${
              dotIndex === index ? "w-8 bg-[#c91510]" : "w-2.5 bg-[#e9b2a6]"
            }`}
            aria-label={`Go to testimonial ${dotIndex + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
