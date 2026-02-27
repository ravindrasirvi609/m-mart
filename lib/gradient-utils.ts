/**
 * Converts Tailwind gradient class notation to an inline CSS gradient string.
 *
 * Supported input formats:
 *   "from-green-600 to-yellow-500"
 *   "from-orange-500 via-red-400 to-yellow-400"
 *   "from-green-600-to-yellow-500"   ← typo-safe (hyphens instead of spaces)
 *
 * Falls back to the raw value if it:
 *   - Already looks like a CSS gradient string (starts with "linear-gradient", "#", "rgb", "hsl")
 *   - Cannot be parsed
 */

const TAILWIND_COLORS: Record<string, string> = {
  // Slate
  "slate-50": "#f8fafc",
  "slate-100": "#f1f5f9",
  "slate-200": "#e2e8f0",
  "slate-300": "#cbd5e1",
  "slate-400": "#94a3b8",
  "slate-500": "#64748b",
  "slate-600": "#475569",
  "slate-700": "#334155",
  "slate-800": "#1e293b",
  "slate-900": "#0f172a",
  // Gray
  "gray-50": "#f9fafb",
  "gray-100": "#f3f4f6",
  "gray-200": "#e5e7eb",
  "gray-300": "#d1d5db",
  "gray-400": "#9ca3af",
  "gray-500": "#6b7280",
  "gray-600": "#4b5563",
  "gray-700": "#374151",
  "gray-800": "#1f2937",
  "gray-900": "#111827",
  // Zinc
  "zinc-50": "#fafafa",
  "zinc-100": "#f4f4f5",
  "zinc-200": "#e4e4e7",
  "zinc-300": "#d4d4d8",
  "zinc-400": "#a1a1aa",
  "zinc-500": "#71717a",
  "zinc-600": "#52525b",
  "zinc-700": "#3f3f46",
  "zinc-800": "#27272a",
  "zinc-900": "#18181b",
  // Red
  "red-50": "#fef2f2",
  "red-100": "#fee2e2",
  "red-200": "#fecaca",
  "red-300": "#fca5a5",
  "red-400": "#f87171",
  "red-500": "#ef4444",
  "red-600": "#dc2626",
  "red-700": "#b91c1c",
  "red-800": "#991b1b",
  "red-900": "#7f1d1d",
  // Orange
  "orange-50": "#fff7ed",
  "orange-100": "#ffedd5",
  "orange-200": "#fed7aa",
  "orange-300": "#fdba74",
  "orange-400": "#fb923c",
  "orange-500": "#f97316",
  "orange-600": "#ea580c",
  "orange-700": "#c2410c",
  "orange-800": "#9a3412",
  "orange-900": "#7c2d12",
  // Amber
  "amber-50": "#fffbeb",
  "amber-100": "#fef3c7",
  "amber-200": "#fde68a",
  "amber-300": "#fcd34d",
  "amber-400": "#fbbf24",
  "amber-500": "#f59e0b",
  "amber-600": "#d97706",
  "amber-700": "#b45309",
  "amber-800": "#92400e",
  "amber-900": "#78350f",
  // Yellow
  "yellow-50": "#fefce8",
  "yellow-100": "#fef9c3",
  "yellow-200": "#fef08a",
  "yellow-300": "#fde047",
  "yellow-400": "#facc15",
  "yellow-500": "#eab308",
  "yellow-600": "#ca8a04",
  "yellow-700": "#a16207",
  "yellow-800": "#854d0e",
  "yellow-900": "#713f12",
  // Lime
  "lime-50": "#f7fee7",
  "lime-100": "#ecfccb",
  "lime-300": "#bef264",
  "lime-400": "#a3e635",
  "lime-500": "#84cc16",
  "lime-600": "#65a30d",
  "lime-700": "#4d7c0f",
  // Green
  "green-50": "#f0fdf4",
  "green-100": "#dcfce7",
  "green-200": "#bbf7d0",
  "green-300": "#86efac",
  "green-400": "#4ade80",
  "green-500": "#22c55e",
  "green-600": "#16a34a",
  "green-700": "#15803d",
  "green-800": "#166534",
  "green-900": "#14532d",
  // Emerald
  "emerald-50": "#ecfdf5",
  "emerald-100": "#d1fae5",
  "emerald-300": "#6ee7b7",
  "emerald-400": "#34d399",
  "emerald-500": "#10b981",
  "emerald-600": "#059669",
  "emerald-700": "#047857",
  "emerald-800": "#065f46",
  // Teal
  "teal-400": "#2dd4bf",
  "teal-500": "#14b8a6",
  "teal-600": "#0d9488",
  "teal-700": "#0f766e",
  // Cyan
  "cyan-400": "#22d3ee",
  "cyan-500": "#06b6d4",
  "cyan-600": "#0891b2",
  // Sky
  "sky-400": "#38bdf8",
  "sky-500": "#0ea5e9",
  "sky-600": "#0284c7",
  // Blue
  "blue-400": "#60a5fa",
  "blue-500": "#3b82f6",
  "blue-600": "#2563eb",
  "blue-700": "#1d4ed8",
  "blue-800": "#1e40af",
  // Indigo
  "indigo-400": "#818cf8",
  "indigo-500": "#6366f1",
  "indigo-600": "#4f46e5",
  "indigo-700": "#4338ca",
  // Violet
  "violet-400": "#a78bfa",
  "violet-500": "#8b5cf6",
  "violet-600": "#7c3aed",
  // Purple
  "purple-400": "#c084fc",
  "purple-500": "#a855f7",
  "purple-600": "#9333ea",
  "purple-700": "#7e22ce",
  // Fuchsia
  "fuchsia-400": "#e879f9",
  "fuchsia-500": "#d946ef",
  "fuchsia-600": "#c026d3",
  // Pink
  "pink-300": "#f9a8d4",
  "pink-400": "#f472b6",
  "pink-500": "#ec4899",
  "pink-600": "#db2777",
  "pink-700": "#be185d",
  // Rose
  "rose-400": "#fb7185",
  "rose-500": "#f43f5e",
  "rose-600": "#e11d48",
  // Special keywords
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
};

/**
 * Resolves a Tailwind color token (e.g. "green-600") to its hex value.
 * Returns the token itself if unknown (CSS might handle it natively).
 */
function resolveColor(token: string): string {
  return TAILWIND_COLORS[token] ?? token;
}

/**
 * Parses a Tailwind gradient string (e.g. "from-green-600 via-white to-yellow-500")
 * and returns an equivalent CSS `linear-gradient()` string.
 *
 * Returns `null` if the input doesn't match a Tailwind gradient pattern.
 */
function parseTailwindGradient(value: string): string | null {
  // Normalise: handle both hyphenated ("from-green-600-to-yellow-500")
  // and space-separated ("from-green-600 to-yellow-500") inputs.
  // Replace "-to-" and "-via-" (the separator dash) with a space + keyword.
  const normalised = value
    .replace(/-(to-|via-)([a-z])/g, " $1$2") // "600-to-y" → "600 to-y"
    .replace(/\s+/g, " ")
    .trim();

  const parts = normalised.split(/\s+/);

  let from: string | null = null;
  let via: string | null = null;
  let to: string | null = null;

  for (const part of parts) {
    if (part.startsWith("from-")) {
      from = resolveColor(part.slice(5));
    } else if (part.startsWith("via-")) {
      via = resolveColor(part.slice(4));
    } else if (part.startsWith("to-")) {
      to = resolveColor(part.slice(3));
    }
  }

  if (!from || !to) return null;

  const stops = via ? [from, via, to] : [from, to];
  return `linear-gradient(135deg, ${stops.join(", ")})`;
}

/**
 * Converts a gradient value (Tailwind or raw CSS) to a CSS `background` style value.
 *
 * - If it looks like a CSS gradient/colour already → returns as-is (raw CSS passthrough)
 * - If it looks like Tailwind notation → converts to `linear-gradient(...)`
 * - Falls back to returning the raw value unchanged
 */
export function resolveGradientStyle(
  raw: string | null | undefined,
): string | null {
  if (!raw || !raw.trim()) return null;

  const trimmed = raw.trim();

  // Already a CSS value — pass through directly
  if (
    trimmed.startsWith("linear-gradient") ||
    trimmed.startsWith("radial-gradient") ||
    trimmed.startsWith("conic-gradient") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb") ||
    trimmed.startsWith("hsl")
  ) {
    return trimmed;
  }

  // Tailwind gradient notation
  if (trimmed.includes("from-")) {
    const converted = parseTailwindGradient(trimmed);
    if (converted) return converted;
  }

  // Unknown — return as-is (might be a valid CSS color name)
  return trimmed;
}
