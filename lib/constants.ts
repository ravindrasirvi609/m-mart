export const STORE = {
  name: "Mmart",
  owner: "Naveen Sirvi",
  location: "Mukai Nagar, Hinjewadi Phase 1, Pune, Maharashtra",
  phone: "8955872627",
  upiId: "my.choice609@okhdfcbank",
  freeDeliveryThreshold: 500,
  baseDeliveryCharge: 30,
} as const;

export const ORDER_STATUS_OPTIONS = [
  "pending",
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "pending_verification",
  "paid",
  "rejected",
] as const;

export type OrderStatus = (typeof ORDER_STATUS_OPTIONS)[number];
export type PaymentStatus = (typeof PAYMENT_STATUS_OPTIONS)[number];

export const PAGE_SIZE = 12;
export const LOW_STOCK_THRESHOLD = 5;
