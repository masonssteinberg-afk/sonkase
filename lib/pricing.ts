// ── Sonakase pricing — single source of truth ─────────────────────────
// Every price on every surface (pages, emails, payment intents) must come
// from this module. No dollar literals anywhere else.

export type TierId = "kitchentable" | "countertop" | "longtable" | "fullspread";

/** One set of rates for a tier. Every tier carries a `standard` and a `launch` set. */
export interface TierRates {
  perGuest: number;   // dollars per head
  minimum: number;    // event floor: total = max(perGuest × guests, minimum)
  deposit: number;    // flat deposit charged at booking
}

export interface Tier {
  id: TierId;
  name: string;
  minGuests: number;
  maxGuests: number;
  /** Displayed struck-through rate. */
  standard: TierRates;
  /** Founding rate — what is actually charged while LAUNCH_ACTIVE. */
  launch: TierRates;
  /** One-line format description shown on tier cards. */
  tagline: string;
}

// ── Founding-rate launch ──────────────────────────────────────────────
// While LAUNCH_ACTIVE, every total/minimum/deposit calculates from each
// tier's `launch` rates and the standard rate shows struck through.
// Flip LAUNCH_ACTIVE to false to restore standard pricing everywhere with
// no other edits and no strike-through.
export const LAUNCH_ACTIVE = true;
export const LAUNCH_ENDS = "2026-10-31";

export const TIERS: readonly Tier[] = [
  {
    id: "kitchentable",
    name: "Kitchen Table",
    minGuests: 2,
    maxGuests: 5,
    standard: { perGuest: 135, minimum: 450, deposit: 150 },
    launch:   { perGuest: 85,  minimum: 275, deposit: 75 },
    tagline: "An intimate dinner. One chef at your kitchen table.",
  },
  {
    id: "countertop",
    name: "Countertop",
    minGuests: 6,
    maxGuests: 12,
    standard: { perGuest: 115, minimum: 690, deposit: 200 },
    launch:   { perGuest: 75,  minimum: 450, deposit: 125 },
    tagline: "A dinner party around the counter. One chef, cutting in front of your guests.",
  },
  {
    id: "longtable",
    name: "Long Table",
    minGuests: 13,
    maxGuests: 24,
    standard: { perGuest: 95, minimum: 1235, deposit: 350 },
    launch:   { perGuest: 65, minimum: 845,  deposit: 250 },
    tagline: "A larger crowd. A full spread laid out down the table.",
  },
  {
    id: "fullspread",
    name: "Full Spread",
    minGuests: 25,
    maxGuests: 50,
    standard: { perGuest: 80, minimum: 2000, deposit: 500 },
    launch:   { perGuest: 55, minimum: 1375, deposit: 350 },
    tagline: "Large events. Multiple chefs and a full display.",
  },
] as const;

/** Effective rates for a tier — launch while active, otherwise standard. Every consumer reads through this. */
export function effectiveRates(tier: Tier): TierRates {
  return LAUNCH_ACTIVE ? tier.launch : tier.standard;
}

/** Bookable range. Below MIN_GUESTS is invalid; above MAX_GUESTS goes to the contact form. */
export const MIN_GUESTS = 2;
export const MAX_GUESTS = 50;

/** Lowest published event price across all tiers (for "from $X" copy). */
export const FROM_PRICE = Math.min(...TIERS.map((t) => effectiveRates(t).minimum));

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
  total: number;            // max(guests × effective perGuest, effective minimum)
  deposit: number;          // effective deposit
  balance: number;          // due at the event
  minimumApplied: boolean;  // true when the minimum set the total
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
  const r = effectiveRates(tier);
  const raw = g * r.perGuest;
  const total = Math.max(raw, r.minimum);
  return {
    tier,
    guests: g,
    total,
    deposit: r.deposit,
    balance: total - r.deposit,
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
 * Total after a promo discount. The effective minimum is applied LAST —
 * after every discount — so no booking ever settles below its tier floor.
 */
export function totalAfterDiscount(quote: Quote, discountAmount: number): number {
  const d = Math.max(0, Number(discountAmount) || 0);
  return Math.max(quote.total - d, effectiveRates(quote.tier).minimum);
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
