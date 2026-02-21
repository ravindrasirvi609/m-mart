"use client";

import { useMemo, useState, type ButtonHTMLAttributes, type MouseEvent } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

type Ripple = {
  id: number;
  x: number;
  y: number;
  size: number;
};

const variantMap: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#ff6a3f] to-[#c91510] text-white shadow-[0_12px_24px_rgba(201,21,16,0.3)] hover:shadow-[0_16px_30px_rgba(201,21,16,0.38)]",
  secondary:
    "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-[#fff1ed] dark:text-zinc-200 dark:hover:bg-zinc-800",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  outline:
    "bg-transparent text-[#c91510] ring-1 ring-[#c91510]/35 hover:bg-[#fff2ef] dark:text-[#ff7f5f] dark:ring-[#ff7f5f]/35 dark:hover:bg-zinc-800",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  onClick,
  children,
  ...props
}: ButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const baseClass = useMemo(
    () =>
      cn(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-bold tracking-[0.02em] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c91510]/45 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.985]",
        variantMap[variant],
      ),
    [variant],
  );

  const triggerRipple = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const id = Date.now();
    setRipples((current) => [...current, { id, x, y, size }]);

    window.setTimeout(() => {
      setRipples((current) => current.filter((ripple) => ripple.id !== id));
    }, 500);
  };

  return (
    <button
      type={type}
      className={cn(baseClass, className)}
      onClick={(event) => {
        triggerRipple(event);
        onClick?.(event);
      }}
      {...props}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute rounded-full bg-white/35 animate-[ping_0.5s_ease-out]"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
    </button>
  );
}
