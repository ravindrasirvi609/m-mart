"use client";

import { toast } from "sonner";

import { getCapacitorPlugin, isNativeApp } from "@/lib/mobile/capacitor";

type ToastVariant = "success" | "error" | "info";

type ToastPlugin = {
  show: (options: {
    text: string;
    duration?: "short" | "long";
    position?: "top" | "center" | "bottom";
  }) => Promise<void>;
};

type HapticsPlugin = {
  impact: (options: { style: "LIGHT" | "MEDIUM" | "HEAVY" }) => Promise<void>;
  notification: (options: { type: "SUCCESS" | "WARNING" | "ERROR" }) => Promise<void>;
};

export async function showAppToast(message: string, variant: ToastVariant = "info") {
  if (isNativeApp()) {
    const nativeToast = getCapacitorPlugin<ToastPlugin>("Toast");
    if (nativeToast) {
      await nativeToast.show({ text: message, duration: "short", position: "bottom" });
      return;
    }
  }

  if (variant === "success") {
    toast.success(message);
    return;
  }

  if (variant === "error") {
    toast.error(message);
    return;
  }

  toast(message);
}

export async function triggerHaptic(kind: "light" | "success" | "warning" | "error" = "light") {
  if (!isNativeApp()) {
    return;
  }

  const haptics = getCapacitorPlugin<HapticsPlugin>("Haptics");
  if (!haptics) {
    return;
  }

  if (kind === "light") {
    await haptics.impact({ style: "LIGHT" });
    return;
  }

  if (kind === "success") {
    await haptics.notification({ type: "SUCCESS" });
    return;
  }

  if (kind === "warning") {
    await haptics.notification({ type: "WARNING" });
    return;
  }

  await haptics.notification({ type: "ERROR" });
}
