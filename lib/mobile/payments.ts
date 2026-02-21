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

export function canAttemptUpiLaunch() {
  if (typeof window === "undefined") {
    return false;
  }

  return /android|iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function buildAndroidIntentUrl(upiUrl: string) {
  if (!upiUrl.startsWith("upi://")) {
    return upiUrl;
  }

  return upiUrl.replace("upi://", "intent://") + "#Intent;scheme=upi;end";
}

export function openUpiPayment(url: string) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const isAndroid = /android/i.test(window.navigator.userAgent);
    let pageHidden = false;
    const onVisibilityChange = () => {
      if (document.hidden) {
        pageHidden = true;
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange, {
      passive: true,
    });

    window.location.href = url;

    if (isAndroid) {
      const intentUrl = buildAndroidIntentUrl(url);
      window.setTimeout(() => {
        if (!pageHidden) {
          window.location.href = intentUrl;
        }
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }, 900);
    } else {
      window.setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }, 1200);
    }

    return true;
  } catch {
    return false;
  }
}
