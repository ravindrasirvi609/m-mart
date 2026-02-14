type CapacitorPlugin = Record<string, (...args: unknown[]) => unknown>;

type CapacitorWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    getPlatform?: () => string;
    Plugins?: Record<string, CapacitorPlugin>;
  };
};

const ALLOWED_WEB_DEEP_LINK_HOSTS = new Set([
  "localhost:3000",
  "mmart4u.com",
  "www.mmart4u.com",
]);
const DEEP_LINK_SCHEME = (process.env.NEXT_PUBLIC_DEEP_LINK_SCHEME ?? "mmart").toLowerCase();

function getWindow() {
  return window as CapacitorWindow;
}

export function isNativeApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(getWindow().Capacitor?.isNativePlatform?.());
}

export function getCapacitorPlugin<T>(name: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return (getWindow().Capacitor?.Plugins?.[name] as T | undefined) ?? null;
}

export function resolveDeepLinkPath(url: string) {
  try {
    const parsed = new URL(url);

    if (
      parsed.protocol === `${DEEP_LINK_SCHEME}:` ||
      parsed.protocol === "mmart:" ||
      parsed.protocol === "com.mmart.store:"
    ) {
      const combinedPath = parsed.host
        ? `/${parsed.host}${parsed.pathname === "/" ? "" : parsed.pathname}`
        : parsed.pathname;

      if (combinedPath.startsWith("/auth/callback")) {
        return `${combinedPath}${parsed.search}${parsed.hash}`;
      }

      return `${combinedPath}${parsed.search}${parsed.hash}`;
    }

    if (
      (parsed.protocol === "http:" || parsed.protocol === "https:") &&
      ALLOWED_WEB_DEEP_LINK_HOSTS.has(parsed.host)
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }

    return null;
  } catch {
    return null;
  }
}
