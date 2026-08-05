// ── Sonakase pricing — single source of truth ─────────────────────────
// Every price on every surface (pages, emails, payment intents) must come
// from this module. No dollar literals anywhere else.
//
// The model is two BOARDS, not guest-count tiers. The guest chooses a menu
// (Full or Short); the per-guest rate is flat within a board. An event
// minimum floors small parties, a flat deposit reserves any booking, and a
// second-chef fee applies to large parties.

export type BoardId = "full" | "short";

/** One set of rates for a board. Every board carries a `standard` and a `launch` set. */
export interface BoardRates {
  perGuest: number;   // dollars per head
  minimum: number;    // event floor: base total = max(perGuest × guests, minimum)
}

/**
 * A board's nigiri offering. Either `fixed` to a set list (guest can't
 * change it) or the guest's `choice` of `count` styles from `options`.
 * Exactly one of fixed/options is set.
 */
export interface NigiriMenu {
  count: number;                    // how many nigiri styles come with the board
  fixed?: readonly string[];        // locked to these exact fish
  options?: readonly string[];      // guest picks `count` from these
}

export interface Board {
  id: BoardId;
  name: string;
  /** One-line menu description shown in the quote finder and booking flow. */
  menu: string;
  /** Number of roll styles — drives the roll icons on the board card. */
  rolls: number;
  /** Nigiri offering — fixed to a set list, or the guest's choice from options. */
  nigiri: NigiriMenu;
  /** Displayed struck-through rate. */
  standard: BoardRates;
  /** Founding rate — what is actually charged while LAUNCH_ACTIVE. */
  launch: BoardRates;
  /** One-line tagline shown in the booking flow. */
  tagline: string;
}

// ── Founding-rate launch ──────────────────────────────────────────────
// While LAUNCH_ACTIVE, every total/minimum calculates from each board's
// `launch` rates and the standard rate shows struck through. Flip
// LAUNCH_ACTIVE to false to restore standard pricing everywhere with no
// other edits and no strike-through.
export const LAUNCH_ACTIVE = true;
export const LAUNCH_ENDS = "2026-10-31";

// The two boards. Per-guest rates and minimums are final for each rate set.
export const BOARDS: readonly Board[] = [
  {
    id: "full",
    name: "Full Board",
    menu: "Your choice of nigiri and six roll styles",
    rolls: 6,
    nigiri: { count: 4, options: ["Salmon", "Tuna", "Yellowtail", "Eel", "Spicy tuna", "Shrimp"] },
    standard: { perGuest: 135, minimum: 850 },
    launch:   { perGuest: 95,  minimum: 600 },
    tagline: "The full counter, built in front of your guests.",
  },
  {
    id: "short",
    name: "Short Board",
    menu: "Salmon & tuna nigiri and four roll styles",
    rolls: 4,
    nigiri: { count: 2, fixed: ["Salmon", "Tuna"] },
    standard: { perGuest: 95, minimum: 600 },
    launch:   { perGuest: 65, minimum: 410 },
    tagline: "A focused spread of the essentials.",
  },
] as const;

/** Bookable range. Below MIN_GUESTS is invalid; above MAX_GUESTS goes to the contact form. */
export const MIN_GUESTS = 4;
export const MAX_GUESTS = 50;

/** Flat deposit charged at booking — same on every board and both rate sets. Balance due day of service. */
export const DEPOSIT = 200;

// ── Second chef ───────────────────────────────────────────────────────
// A party ABOVE this many guests needs a second chef; a flat fee is added
// on top of the per-guest total. It is a labor cost, so it is the same at
// launch and standard rates and is never touched by promo discounts.
export const SECOND_CHEF_THRESHOLD = 24;
export const SECOND_CHEF_FEE = 250;

/** Effective rates for a board — launch while active, otherwise standard. Every consumer reads through this. */
export function effectiveRates(board: Board): BoardRates {
  return LAUNCH_ACTIVE ? board.launch : board.standard;
}

export function boardById(id: string): Board | null {
  return BOARDS.find((b) => b.id === id) ?? null;
}

/** Lowest published event price across all boards (for "from $X" copy). */
export const FROM_PRICE = Math.min(...BOARDS.map((b) => effectiveRates(b).minimum));

// Both boards include the same serviceware; the menu itself is never
// itemized beyond the board's roll/nigiri counts — it is the chef's choice.
export const EVENT_INCLUDES: readonly string[] = [
  "Platters",
  "Chopsticks",
  "Small plates",
] as const;

export interface Quote {
  board: Board;
  guests: number;
  perGuest: number;         // effective per-guest rate
  baseTotal: number;        // max(guests × perGuest, minimum) — before the second-chef fee
  secondChefFee: number;    // 0, or SECOND_CHEF_FEE for parties above the threshold
  total: number;            // baseTotal + secondChefFee
  deposit: number;          // flat DEPOSIT
  balance: number;          // due at the event
  minimumApplied: boolean;  // true when the minimum set the base total
  secondChefApplied: boolean;
}

/** True when a guest count is inside the directly-bookable range. */
export function isBookable(guests: number): boolean {
  const g = Math.floor(guests);
  return Number.isFinite(g) && g >= MIN_GUESTS && g <= MAX_GUESTS;
}

/**
 * Total + deposit for a board at a guest count, or null when out of the
 * bookable range. The event minimum floors the per-guest total; the
 * second-chef fee is added on top for large parties.
 */
export function quoteForBoard(boardId: string, guests: number): Quote | null {
  const board = boardById(boardId);
  if (!board || !isBookable(guests)) return null;
  const g = Math.floor(guests);
  const r = effectiveRates(board);
  const raw = g * r.perGuest;
  const baseTotal = Math.max(raw, r.minimum);
  const secondChefFee = g > SECOND_CHEF_THRESHOLD ? SECOND_CHEF_FEE : 0;
  const total = baseTotal + secondChefFee;
  return {
    board,
    guests: g,
    perGuest: r.perGuest,
    baseTotal,
    secondChefFee,
    total,
    deposit: DEPOSIT,
    balance: total - DEPOSIT,
    minimumApplied: baseTotal > raw,
    secondChefApplied: secondChefFee > 0,
  };
}

/** Every board's quote for a guest count, or null when out of range. Same order as BOARDS. */
export function quotesForGuests(guests: number): Quote[] | null {
  if (!isBookable(guests)) return null;
  return BOARDS.map((b) => quoteForBoard(b.id, guests)!);
}

/**
 * Low and high event totals for a board across the bookable range — the low
 * is the board's "starting at" price (its event minimum), the high is a full
 * house. Used for card copy.
 */
export function boardTotalRange(board: Board): { low: number; high: number } {
  const low  = quoteForBoard(board.id, MIN_GUESTS);
  const high = quoteForBoard(board.id, MAX_GUESTS);
  if (!low || !high) throw new Error(`board ${board.id} range is outside the bookable range`);
  return { low: low.total, high: high.total };
}

/**
 * Total after a promo discount. The discount reduces the per-guest base
 * total only; the event minimum floors it (applied LAST, so no booking
 * settles below its board floor) and the second-chef fee is added back on
 * top untouched.
 */
export function totalAfterDiscount(quote: Quote, discountAmount: number): number {
  const d = Math.max(0, Number(discountAmount) || 0);
  const flooredBase = Math.max(quote.baseTotal - d, effectiveRates(quote.board).minimum);
  return flooredBase + quote.secondChefFee;
}

export function formatUSD(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
