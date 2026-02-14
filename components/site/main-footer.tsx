import { STORE } from "@/lib/constants";

export function MainFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-zinc-600 sm:px-6 dark:text-zinc-300">
        <p className="font-medium text-zinc-900 dark:text-zinc-100">
          {STORE.name} • {STORE.location}
        </p>
        <a href={`tel:${STORE.phone}`} className="underline underline-offset-4">
          Call {STORE.phone}
        </a>
      </div>
    </footer>
  );
}
