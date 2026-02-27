/**
 * Time & Day Context Engine
 * ==========================
 * Provides contextual product suggestions based on the current time of day
 * and day of the week. Returns labels, product tags, and emoji decorations
 * that are used by the homepage to render dynamic "Good Morning" / "Weekend
 * Party" sections without any database lookups.
 *
 * All times are in IST (UTC+5:30) since the store operates in Pune, India.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContextSuggestion = {
  /** Display label: "Good Morning! ☀️ Breakfast Essentials" */
  label: string;
  /** Product tags to filter by (matched against product_tags table) */
  tags: string[];
  /** Emoji for visual badge */
  icon: string;
};

// ---------------------------------------------------------------------------
// Time-of-Day Context
// ---------------------------------------------------------------------------

/**
 * Returns a contextual suggestion based on the current hour (IST).
 * Designed for the homepage "Suggested for you right now" section.
 */
export function getTimeContext(): ContextSuggestion {
  const hour = getISTHour();

  if (hour >= 5 && hour < 9) {
    return {
      label: "Good Morning! Breakfast Essentials",
      tags: ["breakfast", "dairy", "bread", "eggs", "milk", "tea", "coffee"],
      icon: "☀️",
    };
  }

  if (hour >= 9 && hour < 11) {
    return {
      label: "Mid-Morning Cravings",
      tags: ["snacks", "biscuits", "fruits", "juice", "namkeen"],
      icon: "🍪",
    };
  }

  if (hour >= 11 && hour < 14) {
    return {
      label: "Lunch Time! Quick Meal Picks",
      tags: ["rice", "dal", "atta", "spices", "vegetables", "oil", "masala"],
      icon: "🍛",
    };
  }

  if (hour >= 14 && hour < 17) {
    return {
      label: "Afternoon Refreshments",
      tags: ["drinks", "juice", "ice-cream", "fruits", "cold-drinks"],
      icon: "🧃",
    };
  }

  if (hour >= 17 && hour < 20) {
    return {
      label: "Evening Snacks & Chai Time",
      tags: ["snacks", "tea", "biscuits", "namkeen", "pakora", "samosa"],
      icon: "🍵",
    };
  }

  // 20:00 – 04:59
  return {
    label: "Dinner Prep Essentials",
    tags: ["vegetables", "spices", "rice", "oil", "paneer", "atta", "dal"],
    icon: "🍲",
  };
}

// ---------------------------------------------------------------------------
// Day-of-Week Context
// ---------------------------------------------------------------------------

/**
 * Returns a contextual suggestion based on what day it is.
 * Adds a secondary row to the homepage for day-specific promotions.
 */
export function getDayContext(): ContextSuggestion {
  const day = getISTDay();

  const dayMap: Record<number, ContextSuggestion> = {
    0: {
      label: "Sunday Brunch Specials",
      tags: ["breakfast", "brunch", "bakery", "eggs", "juice", "fruits"],
      icon: "🍳",
    },
    1: {
      label: "Monday Meal Prep",
      tags: ["vegetables", "rice", "dal", "oil", "spices", "atta"],
      icon: "🥗",
    },
    2: {
      label: "Tuesday Fresh Picks",
      tags: ["vegetables", "fruits", "dairy", "salad"],
      icon: "🥬",
    },
    3: {
      label: "Midweek Restock",
      tags: ["essentials", "oil", "atta", "sugar", "salt", "cleaning"],
      icon: "📦",
    },
    4: {
      label: "Thursday Health Picks",
      tags: ["organic", "millets", "dry-fruits", "honey", "oats", "nuts"],
      icon: "💪",
    },
    5: {
      label: "Friday Night Treats",
      tags: ["snacks", "drinks", "party", "frozen", "ice-cream", "chips"],
      icon: "🍕",
    },
    6: {
      label: "Weekend Party Essentials",
      tags: ["drinks", "snacks", "party", "frozen", "bakery", "chocolate"],
      icon: "🎉",
    },
  };

  return (
    dayMap[day] ?? { label: "Today's Picks", tags: ["essentials"], icon: "🛒" }
  );
}

// ---------------------------------------------------------------------------
// Seasonal Context (based on month)
// ---------------------------------------------------------------------------

export type SeasonContext = {
  season: "summer" | "monsoon" | "winter" | "spring";
  label: string;
  tags: string[];
};

/**
 * Returns the current Indian season with product tag filters.
 */
export function getSeasonContext(): SeasonContext {
  const month = new Date().getMonth(); // 0-indexed

  if (month >= 2 && month <= 4) {
    // March – May
    return {
      season: "summer",
      label: "Beat the Heat! Summer Essentials",
      tags: [
        "summer",
        "cold-drinks",
        "ice-cream",
        "mango",
        "watermelon",
        "juice",
        "lassi",
      ],
    };
  }

  if (month >= 5 && month <= 8) {
    // June – September
    return {
      season: "monsoon",
      label: "Monsoon Comfort Food",
      tags: ["monsoon", "tea", "pakora", "soup", "ginger", "honey", "maggi"],
    };
  }

  if (month >= 9 && month <= 11) {
    // October – December (festive + winter start)
    return {
      season: "winter",
      label: "Winter Warmers",
      tags: [
        "winter",
        "soup",
        "hot-chocolate",
        "gajak",
        "rewari",
        "peanuts",
        "jaggery",
      ],
    };
  }

  // January – February
  return {
    season: "winter",
    label: "Winter Comfort Picks",
    tags: [
      "winter",
      "soup",
      "hot-chocolate",
      "gajar-halwa",
      "dry-fruits",
      "jaggery",
    ],
  };
}

// ---------------------------------------------------------------------------
// IST Helpers (UTC+5:30)
// ---------------------------------------------------------------------------

function getISTHour(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  // IST = UTC + 5:30
  let istHour = utcHour + 5;
  if (utcMinute + 30 >= 60) istHour += 1;
  return istHour % 24;
}

function getISTDay(): number {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // IST could be the next day after 18:30 UTC
  const totalMinutes = utcHour * 60 + utcMinute + 330; // +5:30
  if (totalMinutes >= 1440) {
    return (utcDay + 1) % 7;
  }
  return utcDay;
}
