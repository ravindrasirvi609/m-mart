/**
 * Festival Calendar Engine
 * ========================
 * Auto-detects the currently active Indian festival and returns theme metadata
 * (colors, tags, greeting, gradient) used to dynamically render the homepage.
 *
 * Date ranges use a promotion window — typically 7–10 days before the festival
 * through the festival day itself, so content feels timely rather than premature.
 *
 * Adding a new festival:
 *   1. Append an entry to `FESTIVAL_CALENDAR` below.
 *   2. Add matching product tags via the admin panel or DB seed.
 *   3. The homepage will automatically pick it up — no code deployment needed
 *      for the content, only for new calendar entries.
 *
 * NOTE: Hindu / lunar calendar dates shift each year. Update `dateRange` values
 * annually or integrate a date API (e.g., Calendarific) for automated lookup.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FestivalContext = {
  /** Display name: "Diwali", "Holi" */
  name: string;
  /** URL-safe slug: "diwali-2026" */
  slug: string;
  /** Product tags to match for this festival */
  tags: string[];
  /** One-liner greeting shown in the hero */
  greeting: string;
  /** Tailwind gradient classes for visual theme */
  heroGradient: string;
  /** Primary accent color hex */
  accentColor: string;
  /** Emoji icon for badges / confetti */
  icon: string;
  /** [start, end] of the promotional window (inclusive) */
  dateRange: [Date, Date];
};

// ---------------------------------------------------------------------------
// 2026 Festival Calendar (IST-aware — all dates are midnight IST)
// ---------------------------------------------------------------------------

const FESTIVAL_CALENDAR: FestivalContext[] = [
  // --- January ---
  {
    name: "Makar Sankranti",
    slug: "makar-sankranti-2026",
    tags: ["til", "jaggery", "sweets", "sankranti", "peanuts", "chikki"],
    greeting: "Happy Makar Sankranti! 🪁",
    heroGradient: "from-orange-500 via-amber-400 to-yellow-300",
    accentColor: "#f59e0b",
    icon: "🪁",
    dateRange: [
      new Date("2026-01-07T00:00:00+05:30"),
      new Date("2026-01-14T23:59:59+05:30"),
    ],
  },
  {
    name: "Republic Day",
    slug: "republic-day-2026",
    tags: ["national", "tricolor", "sweets", "snacks", "party"],
    greeting: "Happy Republic Day! 🇮🇳",
    heroGradient: "from-orange-500 via-white to-green-600",
    accentColor: "#16a34a",
    icon: "🇮🇳",
    dateRange: [
      new Date("2026-01-22T00:00:00+05:30"),
      new Date("2026-01-26T23:59:59+05:30"),
    ],
  },

  // --- February ---
  {
    name: "Valentine's Week",
    slug: "valentines-2026",
    tags: ["chocolate", "sweets", "bakery", "gifts", "drinks"],
    greeting: "Spread Love This Valentine's! 💝",
    heroGradient: "from-pink-500 via-rose-400 to-red-500",
    accentColor: "#ec4899",
    icon: "💝",
    dateRange: [
      new Date("2026-02-07T00:00:00+05:30"),
      new Date("2026-02-14T23:59:59+05:30"),
    ],
  },

  // --- March ---
  {
    name: "Holi",
    slug: "holi-2026",
    tags: [
      "colors",
      "sweets",
      "thandai",
      "drinks",
      "snacks",
      "holi",
      "gujiyas",
      "dry-fruits",
    ],
    greeting: "Happy Holi! 🎨 Rang Barse!",
    heroGradient: "from-pink-500 via-purple-500 to-blue-500",
    accentColor: "#a855f7",
    icon: "🎨",
    dateRange: [
      new Date("2026-03-07T00:00:00+05:30"),
      new Date("2026-03-14T23:59:59+05:30"),
    ],
  },

  // --- April ---
  {
    name: "Gudi Padwa",
    slug: "gudi-padwa-2026",
    tags: ["neem", "jaggery", "sweets", "mango", "puran-poli"],
    greeting: "Happy Gudi Padwa! 🚩",
    heroGradient: "from-yellow-500 via-orange-400 to-red-500",
    accentColor: "#ea580c",
    icon: "🚩",
    dateRange: [
      new Date("2026-03-29T00:00:00+05:30"),
      new Date("2026-04-04T23:59:59+05:30"),
    ],
  },
  {
    name: "Eid ul-Fitr",
    slug: "eid-2026",
    tags: [
      "biryani",
      "sweets",
      "dates",
      "dry-fruits",
      "sheer-khurma",
      "vermicelli",
    ],
    greeting: "Eid Mubarak! 🌙",
    heroGradient: "from-emerald-600 via-teal-400 to-cyan-400",
    accentColor: "#10b981",
    icon: "🌙",
    dateRange: [
      new Date("2026-03-27T00:00:00+05:30"),
      new Date("2026-04-02T23:59:59+05:30"),
    ],
  },

  // --- August ---
  {
    name: "Independence Day",
    slug: "independence-day-2026",
    tags: ["national", "tricolor", "sweets", "snacks"],
    greeting: "Happy Independence Day! 🇮🇳",
    heroGradient: "from-orange-500 via-white to-green-600",
    accentColor: "#16a34a",
    icon: "🇮🇳",
    dateRange: [
      new Date("2026-08-11T00:00:00+05:30"),
      new Date("2026-08-15T23:59:59+05:30"),
    ],
  },
  {
    name: "Raksha Bandhan",
    slug: "raksha-bandhan-2026",
    tags: ["sweets", "chocolate", "gifts", "rakhi", "dry-fruits", "mithai"],
    greeting: "Happy Raksha Bandhan! 🎀",
    heroGradient: "from-pink-400 via-fuchsia-500 to-purple-500",
    accentColor: "#d946ef",
    icon: "🎀",
    dateRange: [
      new Date("2026-08-22T00:00:00+05:30"),
      new Date("2026-08-28T23:59:59+05:30"),
    ],
  },

  // --- September ---
  {
    name: "Ganesh Chaturthi",
    slug: "ganesh-chaturthi-2026",
    tags: ["modak", "ladoo", "sweets", "coconut", "ganesh", "puja", "flowers"],
    greeting: "Ganpati Bappa Morya! 🙏",
    heroGradient: "from-orange-500 via-red-400 to-yellow-400",
    accentColor: "#ea580c",
    icon: "🐘",
    dateRange: [
      new Date("2026-08-27T00:00:00+05:30"),
      new Date("2026-09-06T23:59:59+05:30"),
    ],
  },

  // --- October ---
  {
    name: "Navratri",
    slug: "navratri-2026",
    tags: [
      "fasting",
      "sabudana",
      "fruits",
      "kuttu",
      "rajgira",
      "sweets",
      "navratri",
    ],
    greeting: "Shubh Navratri! 🪔",
    heroGradient: "from-red-500 via-orange-400 to-yellow-400",
    accentColor: "#dc2626",
    icon: "🪔",
    dateRange: [
      new Date("2026-10-07T00:00:00+05:30"),
      new Date("2026-10-16T23:59:59+05:30"),
    ],
  },
  {
    name: "Dussehra",
    slug: "dussehra-2026",
    tags: ["sweets", "snacks", "celebration", "dussehra"],
    greeting: "Happy Dussehra! 🏹",
    heroGradient: "from-amber-500 via-orange-500 to-red-600",
    accentColor: "#f59e0b",
    icon: "🏹",
    dateRange: [
      new Date("2026-10-17T00:00:00+05:30"),
      new Date("2026-10-20T23:59:59+05:30"),
    ],
  },

  // --- November ---
  {
    name: "Diwali",
    slug: "diwali-2026",
    tags: [
      "sweets",
      "dry-fruits",
      "gifts",
      "snacks",
      "diya",
      "candles",
      "diwali",
      "mithai",
      "chocolate",
    ],
    greeting: "Happy Diwali! 🪔✨ Festival of Lights",
    heroGradient: "from-amber-400 via-orange-500 to-red-600",
    accentColor: "#f59e0b",
    icon: "🪔",
    dateRange: [
      new Date("2026-10-30T00:00:00+05:30"),
      new Date("2026-11-08T23:59:59+05:30"),
    ],
  },

  // --- December ---
  {
    name: "Christmas",
    slug: "christmas-2026",
    tags: [
      "cake",
      "chocolate",
      "bakery",
      "wine",
      "plum",
      "christmas",
      "gifts",
      "party",
    ],
    greeting: "Merry Christmas! 🎄",
    heroGradient: "from-green-600 via-red-500 to-green-700",
    accentColor: "#dc2626",
    icon: "🎄",
    dateRange: [
      new Date("2026-12-18T00:00:00+05:30"),
      new Date("2026-12-25T23:59:59+05:30"),
    ],
  },
  {
    name: "New Year",
    slug: "new-year-2027",
    tags: ["party", "drinks", "snacks", "cake", "chocolate", "celebration"],
    greeting: "Happy New Year! 🎉",
    heroGradient: "from-indigo-600 via-purple-500 to-pink-500",
    accentColor: "#8b5cf6",
    icon: "🎉",
    dateRange: [
      new Date("2026-12-26T00:00:00+05:30"),
      new Date("2027-01-01T23:59:59+05:30"),
    ],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the currently active festival based on today's date, or `null` if
 * no festival promotion window is open. When multiple festivals overlap
 * (e.g., Navratri → Dussehra), the one that started most recently wins.
 */
export function getActiveFestival(): FestivalContext | null {
  const now = new Date();

  const active = FESTIVAL_CALENDAR.filter(
    (f) => now >= f.dateRange[0] && now <= f.dateRange[1],
  );

  if (active.length === 0) return null;

  // When overlapping, pick the one whose start is closest to today
  active.sort(
    (a, b) =>
      Math.abs(now.getTime() - a.dateRange[0].getTime()) -
      Math.abs(now.getTime() - b.dateRange[0].getTime()),
  );

  return active[0];
}

/**
 * Returns the next upcoming festival (for "Coming soon" teasers).
 */
export function getUpcomingFestival(): FestivalContext | null {
  const now = new Date();

  const upcoming = FESTIVAL_CALENDAR.filter((f) => f.dateRange[0] > now);
  upcoming.sort((a, b) => a.dateRange[0].getTime() - b.dateRange[0].getTime());

  return upcoming[0] ?? null;
}

/**
 * Returns all festivals for the current calendar year (for admin dashboard /
 * planning views).
 */
export function getFestivalsForYear(
  year = new Date().getFullYear(),
): FestivalContext[] {
  return FESTIVAL_CALENDAR.filter((f) => f.dateRange[0].getFullYear() === year);
}
