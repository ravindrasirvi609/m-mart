"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Check for updates periodically (every 60 minutes)
        const checkForUpdates = () => {
          registration.update().catch(() => {
            // Silently ignore update check failures
          });
        };

        const updateInterval = setInterval(checkForUpdates, 60 * 60 * 1000);

        // When a new SW is found, tell it to activate immediately
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available — activate it
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // Reload page when new SW takes control
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (refreshing) return;
          refreshing = true;
          window.location.reload();
        });

        return () => clearInterval(updateInterval);
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}
