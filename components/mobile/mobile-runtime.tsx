"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { NoInternetScreen } from "@/components/mobile/no-internet-screen";
import { InstallAppPrompt } from "@/components/pwa/install-app-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import {
  getCapacitorPlugin,
  isNativeApp,
  resolveDeepLinkPath,
} from "@/lib/mobile/capacitor";
import { initializePushNotifications } from "@/lib/mobile/push";
import { handleSupabaseAuthDeepLink } from "@/lib/mobile/supabase-deep-link";

const PULL_TO_REFRESH_THRESHOLD = 90;

type AppPlugin = {
  getLaunchUrl?: () => Promise<{ url: string | null }>;
  addListener: (
    eventName: "appUrlOpen",
    listener: (event: { url: string }) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

type NetworkPlugin = {
  getStatus: () => Promise<{ connected: boolean }>;
  addListener: (
    eventName: "networkStatusChange",
    listener: (status: { connected: boolean }) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

type StatusBarPlugin = {
  setOverlaysWebView: (options: { overlay: boolean }) => Promise<void>;
  setBackgroundColor: (options: { color: string }) => Promise<void>;
  setStyle: (options: { style: "DARK" | "LIGHT" }) => Promise<void>;
};

type SplashScreenPlugin = {
  hide: () => Promise<void>;
};

export function MobileRuntime() {
  const [isOnline, setIsOnline] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startTouchYRef = useRef<number | null>(null);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    pullDistanceRef.current = pullDistance;
  }, [pullDistance]);

  useEffect(() => {
    isRefreshingRef.current = isRefreshing;
  }, [isRefreshing]);

  useEffect(() => {
    const refreshOnlineState = () => setIsOnline(window.navigator.onLine);
    refreshOnlineState();

    window.addEventListener("online", refreshOnlineState);
    window.addEventListener("offline", refreshOnlineState);

    const network = getCapacitorPlugin<NetworkPlugin>("Network");
    let removeNetworkListener: (() => Promise<void>) | null = null;

    if (network) {
      network
        .getStatus()
        .then((status) => setIsOnline(status.connected))
        .catch(() => undefined);

      network
        .addListener("networkStatusChange", (status) => setIsOnline(status.connected))
        .then((listener) => {
          removeNetworkListener = listener.remove;
        })
        .catch(() => undefined);
    }

    return () => {
      window.removeEventListener("online", refreshOnlineState);
      window.removeEventListener("offline", refreshOnlineState);
      if (removeNetworkListener) {
        removeNetworkListener().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    const isStandalone =
      isNativeApp() || window.matchMedia("(display-mode: standalone)").matches;

    if (!isStandalone) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      swipeStartXRef.current = touch.clientX;
      swipeStartYRef.current = touch.clientY;
    };

    const handleTouchEnd = (event: TouchEvent) => {
      const startX = swipeStartXRef.current;
      const startY = swipeStartYRef.current;
      const touch = event.changedTouches[0];

      swipeStartXRef.current = null;
      swipeStartYRef.current = null;

      if (!touch || startX === null || startY === null) {
        return;
      }

      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      if (startX <= 24 && deltaX > 100 && deltaY < 50 && window.history.length > 1) {
        window.history.back();
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    const statusBar = getCapacitorPlugin<StatusBarPlugin>("StatusBar");
    const splashScreen = getCapacitorPlugin<SplashScreenPlugin>("SplashScreen");

    statusBar?.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    statusBar?.setBackgroundColor({ color: "#E10600" }).catch(() => undefined);
    statusBar?.setStyle({ style: "DARK" }).catch(() => undefined);

    window.setTimeout(() => {
      splashScreen?.hide().catch(() => undefined);
    }, 420);
  }, []);

  useEffect(() => {
    initializePushNotifications().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    const appPlugin = getCapacitorPlugin<AppPlugin>("App");
    if (!appPlugin) {
      return;
    }

    let removeListener: (() => Promise<void>) | null = null;

    const processOpenedUrl = async (url: string) => {
      const authResult = await handleSupabaseAuthDeepLink(url);
      if (authResult.handled) {
        if (authResult.error) {
          const encodedError = encodeURIComponent(authResult.error);
          window.location.assign(`/login?error=${encodedError}`);
          return;
        }

        window.location.assign(authResult.nextPath ?? "/");
        return;
      }

      const path = resolveDeepLinkPath(url);
      if (path) {
        window.location.assign(path);
      }
    };

    const launchUrlPromise = appPlugin.getLaunchUrl?.();
    if (launchUrlPromise) {
      launchUrlPromise
        .then((launchUrl) => {
          if (launchUrl?.url) {
            void processOpenedUrl(launchUrl.url);
          }
        })
        .catch(() => undefined);
    }

    appPlugin
      .addListener("appUrlOpen", ({ url }) => {
        void processOpenedUrl(url);
      })
      .then((listener) => {
        removeListener = listener.remove;
      })
      .catch(() => undefined);

    return () => {
      if (removeListener) {
        removeListener().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    const isStandalone =
      isNativeApp() || window.matchMedia("(display-mode: standalone)").matches;

    if (!isStandalone) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0 || isRefreshingRef.current) {
        startTouchYRef.current = null;
        return;
      }

      startTouchYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (startTouchYRef.current === null || window.scrollY > 0) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startTouchYRef.current;
      if (delta <= 0) {
        setPullDistance(0);
        return;
      }

      const distance = Math.min(delta, 120);
      pullDistanceRef.current = distance;
      setPullDistance(distance);
      event.preventDefault();
    };

    const handleTouchEnd = () => {
      if (
        pullDistanceRef.current >= PULL_TO_REFRESH_THRESHOLD &&
        !isRefreshingRef.current
      ) {
        isRefreshingRef.current = true;
        setIsRefreshing(true);
        window.location.reload();
        return;
      }

      startTouchYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <>
      <ServiceWorkerRegister />
      <InstallAppPrompt />

      <div
        className="mobile-refresh-indicator"
        style={{
          opacity: isRefreshing || pullDistance > 8 ? 1 : 0,
          transform: `translate(-50%, ${Math.min(pullDistance, 90) - 98}px)`,
        }}
      >
        <Loader2 size={14} className={isRefreshing ? "animate-spin" : ""} />
        <span>{isRefreshing ? "Refreshing..." : "Pull to refresh"}</span>
      </div>

      {!isOnline ? <NoInternetScreen /> : null}
    </>
  );
}
