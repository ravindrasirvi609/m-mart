"use client";

type BuildUpiUrlInput = {
  upiId?: string;
  payeeName: string;
  amount: number;
  note?: string;
};

export function buildUpiPaymentUrl({
  upiId,
  payeeName,
  amount,
  note = "Mmart order payment",
}: BuildUpiUrlInput) {
  if (!upiId) {
    return null;
  }

  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amount.toFixed(2),
    tn: note,
    cu: "INR",
  });

  return `upi://pay?${params.toString()}`;
}

export function openUpiPayment(url: string) {
  if (typeof window === "undefined") {
    return false;
  }

  window.location.href = url;
  return true;
}
