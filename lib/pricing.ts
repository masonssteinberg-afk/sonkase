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
    menu: "Six roll styles of your choice, plus chef's-choice nigiri",
    rolls: 6,
    nigiri: { count: 4, options: ["Salmon", "Tuna", "Yellowtail", "Eel", "Spicy tuna", "Shrimp"] },
    standard: { perGuest: 135, minimum: 850 },
    launch:   { perGuest: 95,  minimum: 600 },
    tagline: "The full counter, built in front of your guests.",
  },
  {
    id: "short",
    name: "Short Board",
    menu: "Four roll styles of your choice, plus chef's-choice nigiri",
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

// ── Menu: the roll library ────────────────────────────────────────────
// The guest builds their board from these at booking. Nothing here carries
// a price — the board's per-guest rate covers the whole selection; a guest
// picks ROLL_ALLOWANCE styles for their board.
//
//  · `contains`    — screenable ingredients, surfaced for allergy review.
//  · `cooked`      — true when the roll carries NO raw fish (safe for the
//                    no-raw-fish crowd): the three cooked rolls plus, by
//                    virtue of having no seafood at all, the vegetarian one.
//  · `vegetarian`  — true when the roll contains no seafood.
//  · `available`   — gates a roll out of the picker without deleting it;
//                    past bookings keep their choice via the name snapshot.
export interface Roll {
  id: string;
  name: string;
  description: string;
  contains: readonly string[];
  cooked: boolean;
  vegetarian: boolean;
  available: boolean;
}

export const ROLL_LIBRARY: readonly Roll[] = [
  {
    id: "california",
    name: "California",
    description: "Crab salad, cucumber, avocado. Topped with crunchy fried onion.",
    contains: ["crab", "cucumber", "avocado", "fried onion", "mayonnaise"],
    cooked: true, vegetarian: false, available: true,
  },
  {
    id: "salmon-avocado",
    name: "Salmon Avocado",
    description: "Salmon, cucumber, avocado.",
    contains: ["salmon", "cucumber", "avocado"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "spicy-tuna",
    name: "Spicy Tuna",
    description: "Spicy tuna, cucumber. Topped with scallion and spicy mayo.",
    contains: ["tuna", "cucumber", "scallion", "spicy mayo", "mayonnaise", "egg"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "rainbow",
    name: "Rainbow",
    description: "California base topped with salmon, tuna, yellowtail, and avocado.",
    contains: ["crab", "cucumber", "avocado", "salmon", "tuna", "yellowtail", "mayonnaise"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "spider",
    name: "Spider",
    description: "Soft shell crab, cucumber, avocado. Topped with eel sauce and masago.",
    contains: ["soft shell crab", "cucumber", "avocado", "eel sauce", "masago", "soy", "wheat"],
    cooked: true, vegetarian: false, available: true,
  },
  {
    id: "sonakase",
    name: "Sonakase Roll",
    description: "Shrimp, cucumber, salmon, avocado. Topped with tuna, fresh wasabi, and masago.",
    contains: ["shrimp", "cucumber", "salmon", "avocado", "tuna", "wasabi", "masago"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "dragon",
    name: "Dragon",
    description: "California base of crab salad, cucumber, and avocado. Topped with eel and eel sauce.",
    contains: ["crab", "cucumber", "avocado", "eel", "eel sauce", "mayonnaise", "soy", "wheat"],
    cooked: true, vegetarian: false, available: true,
  },
  {
    id: "philadelphia",
    name: "Philadelphia",
    description: "Salmon, cream cheese, cucumber.",
    contains: ["salmon", "cream cheese", "cucumber", "dairy"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "torched-yellowtail",
    name: "Torched Yellowtail",
    description: "Tuna, avocado, jalapeño. Topped with torched yellowtail and kewpie mayo.",
    contains: ["tuna", "avocado", "jalapeño", "yellowtail", "kewpie mayo", "mayonnaise", "egg"],
    cooked: false, vegetarian: false, available: true,
  },
  {
    id: "garden",
    name: "Garden",
    description: "Avocado, cucumber, jalapeño. Topped with spicy mayo and sesame.",
    contains: ["avocado", "cucumber", "jalapeño", "spicy mayo", "mayonnaise", "egg", "sesame"],
    cooked: true, vegetarian: true, available: true,
  },
] as const;

export function rollById(id: string): Roll | null {
  return ROLL_LIBRARY.find((r) => r.id === id) ?? null;
}

// ── Menu: nigiri ──────────────────────────────────────────────────────
// Full Board guests choose NIGIRI_ALLOWANCE styles from these six. Short
// Board is a fixed salmon & tuna pairing with no selection.
export const NIGIRI_OPTIONS: readonly string[] = [
  "Salmon", "Tuna", "Yellowtail", "Eel", "Spicy tuna", "Shrimp",
] as const;

/** Short Board's locked nigiri pairing. */
export const SHORT_BOARD_NIGIRI: readonly string[] = ["Salmon", "Tuna"] as const;

/** Roll seed for the Short Board "chef's selection" shortcut (4 = the Short allowance). */
export const SHORT_BOARD_DEFAULTS: readonly string[] = [
  "california", "salmon-avocado", "spicy-tuna", "rainbow",
] as const;

/** How many roll styles a board includes: Full 6, Short 4. */
export function ROLL_ALLOWANCE(boardId: string): number {
  return boardId === "short" ? 4 : 6;
}

/**
 * A board's nigiri offering. Full: pick `count` from `options` (selectable).
 * Short: a `fixed` pairing, no selection.
 */
export interface NigiriAllowance {
  count: number;
  selectable: boolean;
  options?: readonly string[];
  fixed?: readonly string[];
}
export function NIGIRI_ALLOWANCE(boardId: string): NigiriAllowance {
  if (boardId === "short") {
    return { count: SHORT_BOARD_NIGIRI.length, selectable: false, fixed: SHORT_BOARD_NIGIRI };
  }
  return { count: 4, selectable: true, options: NIGIRI_OPTIONS };
}

/**
 * The "chef's selection" one-tap fill. Short uses the authored defaults;
 * Full takes the first `allowance` available rolls and the first `count`
 * nigiri in list order — deterministic, so it never depends on render state.
 */
export function chefsSelection(boardId: string): { rolls: string[]; nigiri: string[] } {
  const nig = NIGIRI_ALLOWANCE(boardId);
  if (boardId === "short") {
    return { rolls: [...SHORT_BOARD_DEFAULTS], nigiri: [...SHORT_BOARD_NIGIRI] };
  }
  const rolls = ROLL_LIBRARY.filter((r) => r.available).slice(0, ROLL_ALLOWANCE(boardId)).map((r) => r.id);
  return { rolls, nigiri: (nig.options ?? NIGIRI_OPTIONS).slice(0, nig.count).map((n) => n) };
}

// ── Add-ons ───────────────────────────────────────────────────────────
// Optional upgrades layered on top of a board. `priceType` "per_guest"
// multiplies by the guest count; `minGuests` gates the upgrade off small
// parties. Launch pricing mirrors the boards: while LAUNCH_ACTIVE the
// `launchPrice` is charged and the `standardPrice` shows struck through.
export interface AddOn {
  id: string;
  name: string;
  description: string;
  priceType: "per_guest";
  launchPrice: number;
  standardPrice: number;
  minGuests: number;
}

export const ADD_ONS: readonly AddOn[] = [
  {
    id: "sashimi",
    name: "Sashimi Course",
    description: "A course of the day's freshest cuts, sliced thick and served without rice — plated and passed as its own wave during service.",
    priceType: "per_guest",
    launchPrice: 18,
    standardPrice: 25,
    minGuests: 6,
  },
] as const;

export function addonById(id: string): AddOn | null {
  return ADD_ONS.find((a) => a.id === id) ?? null;
}

/** Effective add-on unit price — launch while active, else standard (mirrors effectiveRates). */
export function effectiveAddonPrice(addon: AddOn): number {
  return LAUNCH_ACTIVE ? addon.launchPrice : addon.standardPrice;
}

/** True when a party is large enough to be offered this add-on. */
export function addonAvailable(addon: AddOn, guests: number): boolean {
  const g = Math.floor(guests);
  return Number.isFinite(g) && g >= addon.minGuests;
}

/** Total for one add-on at a guest count (per_guest × guests), or 0 below its minimum. */
export function addonTotal(addon: AddOn, guests: number): number {
  if (!addonAvailable(addon, guests)) return 0;
  return effectiveAddonPrice(addon) * Math.floor(guests);
}

// ── The full booking charge ───────────────────────────────────────────
// The one place a booking's money is assembled: board base (+ second chef),
// any add-ons, and an optional promo discount that reduces only the board
// base (floored at the minimum, never touching add-ons or the second-chef
// fee). Both the client display and the server write read through this, so
// they cannot drift. The flat DEPOSIT is unaffected by add-ons or promos.
export interface BookingCharge {
  boardId: BoardId;
  guests: number;
  baseTotal: number;    // board sushi & service, incl. second chef, before discount/add-ons
  discount: number;     // amount the promo actually removed from the base
  addonsTotal: number;  // sum of selected add-on totals
  subtotal: number;     // (baseTotal − discount) + addonsTotal — the grand total charged
  deposit: number;      // flat DEPOSIT
  balance: number;      // subtotal − deposit, due at the event
}

export function bookingCharge(
  boardId: string,
  guests: number,
  addonIds: readonly string[] = [],
  discountAmount = 0,
): BookingCharge | null {
  const q = quoteForBoard(boardId, guests);
  if (!q) return null;
  const addonsTotal = (addonIds || []).reduce((sum, id) => {
    const a = addonById(id);
    return a ? sum + addonTotal(a, q.guests) : sum;
  }, 0);
  const discountedBase = discountAmount > 0 ? totalAfterDiscount(q, discountAmount) : q.total;
  const discount = q.total - discountedBase;
  const subtotal = discountedBase + addonsTotal;
  return {
    boardId: q.board.id,
    guests: q.guests,
    baseTotal: q.total,
    discount,
    addonsTotal,
    subtotal,
    deposit: q.deposit,
    balance: subtotal - q.deposit,
  };
}
