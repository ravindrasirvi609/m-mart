import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-[#cf251e]/18 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-500 focus:border-[#c91510] focus:ring-4 focus:ring-[#c91510]/14 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-400",
        className,
      )}
      {...props}
    />
  );
}
