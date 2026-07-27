// ── Sonakase pricing — single source of truth ─────────────────────────
// Every price on every surface (pages, emails, payment intents) must come
// from this module. No dollar literals anywhere else.

export type TierId = "countertop" | "longtable" | "fullspread";

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
    id: "countertop",
    name: "Countertop",
    minGuests: 8,
    maxGuests: 16,
    perGuest: 135,
    eventMinimum: 1300,
    deposit: 400,
    tagline: "A dinner party. One chef, everything set out on your kitchen counter.",
  },
  {
    id: "longtable",
    name: "Long Table",
    minGuests: 17,
    maxGuests: 30,
    perGuest: 115,
    eventMinimum: 2160, // 16 × $135 — top of Countertop band
    deposit: 750,
    tagline: "A bigger crowd. Two chefs and a longer spread.",
  },
  {
    id: "fullspread",
    name: "Full Spread",
    minGuests: 31,
    maxGuests: 50,
    perGuest: 95,
    eventMinimum: 3450, // 30 × $115 — top of Long Table band
    deposit: 1100,
    tagline: "Large events. Three chefs and a full display.",
  },
] as const;

/** Bookable range. Below MIN_GUESTS books at the Countertop minimum; above MAX_GUESTS goes to the contact form. */
export const MIN_GUESTS = 8;
export const MAX_GUESTS = 50;

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
 * Tier for a guest count. Counts under MIN_GUESTS resolve to Countertop
 * (still bookable — the event minimum covers them). Over MAX_GUESTS
 * returns null: route to the contact form.
 */
export function tierForGuests(guests: number): Tier | null {
  const g = Math.floor(guests);
  if (!Number.isFinite(g) || g < 1) return null;
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
 * edges. Because Countertop's low edge is floored by the event minimum,
 * the range communicates the minimum without a separate line.
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
