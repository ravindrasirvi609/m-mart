import type { SupportedStorage } from "@supabase/supabase-js";

import { getCapacitorPlugin } from "@/lib/mobile/capacitor";

type PreferencesPlugin = {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
};

const memoryStorage = new Map<string, string>();

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function createSupabaseAuthStorage(): SupportedStorage {
  return {
    getItem: async (key) => {
      const preferences = getCapacitorPlugin<PreferencesPlugin>("Preferences");
      if (preferences) {
        const { value } = await preferences.get({ key });
        return value;
      }

      const localStorage = getLocalStorage();
      if (localStorage) {
        return localStorage.getItem(key);
      }

      return memoryStorage.get(key) ?? null;
    },
    setItem: async (key, value) => {
      const preferences = getCapacitorPlugin<PreferencesPlugin>("Preferences");
      if (preferences) {
        await preferences.set({ key, value });
        return;
      }

      const localStorage = getLocalStorage();
      if (localStorage) {
        localStorage.setItem(key, value);
        return;
      }

      memoryStorage.set(key, value);
    },
    removeItem: async (key) => {
      const preferences = getCapacitorPlugin<PreferencesPlugin>("Preferences");
      if (preferences) {
        await preferences.remove({ key });
        return;
      }

      const localStorage = getLocalStorage();
      if (localStorage) {
        localStorage.removeItem(key);
        return;
      }

      memoryStorage.delete(key);
    },
  };
}
