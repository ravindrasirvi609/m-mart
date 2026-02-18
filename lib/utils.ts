import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { STORE } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function getEffectivePrice(price: number, discountPrice: number | null) {
  if (discountPrice === null) {
    return price;
  }

  return Math.min(price, discountPrice);
}

export function calculateDeliveryCharge(subtotal: number) {
  return subtotal >= STORE.freeDeliveryThreshold ? 0 : STORE.baseDeliveryCharge;
}

export function formatOrderStatus(status: string) {
  return status
    .split("_")
    .map((entry) => entry[0].toUpperCase() + entry.slice(1))
    .join(" ");
}

export function sanitizeFileName(fileName: string) {
  return fileName.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
