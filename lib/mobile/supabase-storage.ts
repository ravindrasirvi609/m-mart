import type { SupportedStorage } from "@supabase/supabase-js";

import { getCapacitorPlugin } from "@/lib/mobile/capacitor";

type PreferencesPlugin = {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
};

const memoryStorage = new Map<string, string>();

export function createSupabaseAuthStorage(): SupportedStorage {
  return {
    getItem: async (key) => {
      const preferences = getCapacitorPlugin<PreferencesPlugin>("Preferences");
      if (preferences) {
        const { value } = await preferences.get({ key });
        return value;
      }

      return memoryStorage.get(key) ?? null;
    },
    setItem: async (key, value) => {
      const preferences = getCapacitorPlugin<PreferencesPlugin>("Preferences");
      if (preferences) {
        await preferences.set({ key, value });
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

      memoryStorage.delete(key);
    },
  };
}
