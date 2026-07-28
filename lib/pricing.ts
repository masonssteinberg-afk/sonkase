// ── Sonakase pricing — single source of truth ─────────────────────────
// Every price on every surface (pages, emails, payment intents) must come
// from this module. No dollar literals anywhere else.

export type TierId = "kitchentable" | "countertop" | "longtable" | "fullspread";

export interface Tier {
  id: TierId;
  name: string;
  minGuests: number;
  maxGuests: number;
  perGuest: number;          // dollars per head
  /**
   * Hard floor for the event total, applied per EVENT (not per guest).
   * Set to the top-of-band total of the tier below, so crossing a tier
   * boundary never lowers the price (total is monotonic in guest count).
   */
  eventMinimum: number;
  deposit: number;           // flat deposit in dollars, charged at booking
  /** One-line format description shown on tier cards. */
  tagline: string;
}

export const TIERS: readonly Tier[] = [
  {
    id: "kitchentable",
    name: "Kitchen Table",
    minGuests: 2,
    maxGuests: 5,
    perGuest: 215,
    eventMinimum: 650,
    deposit: 250,
    tagline: "An intimate dinner. One chef at your kitchen table.",
  },
  {
    id: "countertop",
    name: "Countertop",
    minGuests: 6,
    maxGuests: 12,
    perGuest: 185,
    eventMinimum: 1110, // 6 × $185 — floor for the band
    deposit: 400,
    tagline: "A dinner party around the counter. One chef, cutting in front of your guests.",
  },
  {
    id: "longtable",
    name: "Long Table",
    minGuests: 13,
    maxGuests: 24,
    perGuest: 145,
    eventMinimum: 2220, // 12 × $185 — top of Countertop band, keeps totals monotonic
    deposit: 700,
    tagline: "A larger crowd. A full spread laid out down the table.",
  },
  {
    id: "fullspread",
    name: "Full Spread",
    minGuests: 25,
    maxGuests: 50,
    perGuest: 110,
    eventMinimum: 3480, // 24 × $145 — top of Long Table band
    deposit: 1100,
    tagline: "Large events. Multiple chefs and a full display.",
  },
] as const;

/** Bookable range. Below MIN_GUESTS is invalid; above MAX_GUESTS goes to the contact form. */
export const MIN_GUESTS = 2;
export const MAX_GUESTS = 50;

/** Lowest published event price across all tiers (for "from $X" copy). */
export const FROM_PRICE = Math.min(...TIERS.map((t) => t.eventMinimum));

// The menu itself is never itemized — it is the chef's choice at every
// tier. Only the categories, quantity, and extras below are promised.
export const MENU_LINE = "rolls, nigiri, sashimi, and more";
export const PIECES_PER_GUEST = 16;
export const EVENT_INCLUDES: readonly string[] = [
  "Edamame appetizer",
  "Plates, chopsticks & serviceware",
] as const;

export interface Quote {
  tier: Tier;
  guests: number;
  total: number;            // max(guests × perGuest, eventMinimum) — minimum applied once per event
  deposit: number;
  balance: number;          // due at the event
  minimumApplied: boolean;  // true when the event minimum set the total
}

/**
 * Tier for a guest count. Below MIN_GUESTS is invalid (null); above
 * MAX_GUESTS returns null too (route to the contact form). Every count
 * from MIN_GUESTS to MAX_GUESTS maps to a tier and books directly.
 */
export function tierForGuests(guests: number): Tier | null {
  const g = Math.floor(guests);
  if (!Number.isFinite(g) || g < MIN_GUESTS) return null;
  if (g > MAX_GUESTS) return null;
  return TIERS.find((t) => g <= t.maxGuests) ?? null;
}

/** Total + deposit for a guest count, or null when out of bookable range. */
export function quoteForGuests(guests: number): Quote | null {
  const tier = tierForGuests(guests);
  if (!tier) return null;
  const g = Math.floor(guests);
  const raw = g * tier.perGuest;
  const total = Math.max(raw, tier.eventMinimum);
  return {
    tier,
    guests: g,
    total,
    deposit: tier.deposit,
    balance: total - tier.deposit,
    minimumApplied: total > raw,
  };
}

/**
 * Low and high event totals for a tier — the quoted totals at the band
 * edges. Each tier's low edge is floored by its event minimum, so the low
 * equals the tier's "starting at" price.
 */
export function tierTotalRange(tier: Tier): { low: number; high: number } {
  const low  = quoteForGuests(tier.minGuests);
  const high = quoteForGuests(tier.maxGuests);
  if (!low || !high) throw new Error(`tier ${tier.id} band is outside the bookable range`);
  return { low: low.total, high: high.total };
}

/**
 * Total after a promo discount. The event minimum is applied LAST — after
 * every discount — so no booking ever settles below its tier floor.
 * e.g. 10-guest Countertop with 20% off: max(1350 − 270, 1300) = 1300.
 */
export function totalAfterDiscount(quote: Quote, discountAmount: number): number {
  const d = Math.max(0, Number(discountAmount) || 0);
  return Math.max(quote.total - d, quote.tier.eventMinimum);
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
