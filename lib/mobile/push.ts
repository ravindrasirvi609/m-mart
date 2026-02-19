import { getCapacitorPlugin } from "@/lib/mobile/capacitor";

type PushNotificationsPlugin = {
  checkPermissions: () => Promise<{ receive: "prompt" | "denied" | "granted" }>;
  requestPermissions: () => Promise<{ receive: "prompt" | "denied" | "granted" }>;
  register: () => Promise<void>;
  addListener: (
    eventName: "registration" | "registrationError" | "pushNotificationReceived",
    listener: (payload: unknown) => void,
  ) => Promise<{ remove: () => Promise<void> }>;
};

export async function initializePushNotifications() {
  const pushNotifications = getCapacitorPlugin<PushNotificationsPlugin>(
    "PushNotifications",
  );

  if (!pushNotifications) {
    return { available: false as const, enabled: false as const };
  }

  let permissionStatus = await pushNotifications.checkPermissions();
  if (permissionStatus.receive === "prompt") {
    permissionStatus = await pushNotifications.requestPermissions();
  }

  if (permissionStatus.receive !== "granted") {
    console.warn("Push notification permission was not granted.");
    return { available: true as const, enabled: false as const };
  }

  await pushNotifications.register();

  await pushNotifications.addListener("registration", (payload) => {
    const value =
      typeof payload === "object" &&
      payload !== null &&
      "value" in payload &&
      typeof (payload as { value: unknown }).value === "string"
        ? (payload as { value: string }).value
        : "Push token received (non-string payload)";
    const tokenValue = value;
    console.info("Push token ready:", tokenValue);
  });

  await pushNotifications.addListener("registrationError", (error) => {
    console.error("Push registration error:", error);
  });

  await pushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.info("Push notification received:", notification);
  });

  return { available: true as const, enabled: true as const };
}
