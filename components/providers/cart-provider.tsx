"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { calculateDeliveryCharge, getEffectivePrice } from "@/lib/utils";

type CartItem = {
  id: string;
  name: string;
  image_url: string;
  price: number;
  discount_price: number | null;
  stock: number;
  quantity: number;
};

type AddCartItem = Omit<CartItem, "quantity">;

type CartContextValue = {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  totalItems: number;
  addItem: (item: AddCartItem) => void;
  removeItem: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "mmart-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      window.localStorage.removeItem(storageKey);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((acc, item) => {
      const unitPrice = getEffectivePrice(item.price, item.discount_price);
      return acc + unitPrice * item.quantity;
    }, 0);

    const deliveryCharge = calculateDeliveryCharge(subtotal);

    return {
      items,
      subtotal,
      deliveryCharge,
      total: subtotal + deliveryCharge,
      totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
      addItem(item) {
        setItems((previous) => {
          const existing = previous.find((entry) => entry.id === item.id);

          if (!existing) {
            return [...previous, { ...item, quantity: 1 }];
          }

          return previous.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  quantity: Math.min(entry.quantity + 1, entry.stock),
                }
              : entry,
          );
        });
      },
      removeItem(id) {
        setItems((previous) => previous.filter((item) => item.id !== id));
      },
      setQuantity(id, quantity) {
        setItems((previous) =>
          previous
            .map((item) => {
              if (item.id !== id) {
                return item;
              }

              return { ...item, quantity: Math.min(Math.max(quantity, 1), item.stock) };
            })
            .filter((item) => item.quantity > 0),
        );
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return context;
}
