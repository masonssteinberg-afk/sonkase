// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quoteForBoard, quotesForGuests, totalAfterDiscount, boardTotalRange, effectiveRates,
  BOARDS, boardById, MIN_GUESTS, MAX_GUESTS, FROM_PRICE, LAUNCH_ACTIVE,
  DEPOSIT, SECOND_CHEF_THRESHOLD, SECOND_CHEF_FEE,
  ROLL_LIBRARY, rollById, NIGIRI_OPTIONS, SHORT_BOARD_NIGIRI, SHORT_BOARD_DEFAULTS,
  ROLL_ALLOWANCE, NIGIRI_ALLOWANCE, chefsSelection,
  ADD_ONS, addonById, effectiveAddonPrice, addonAvailable, addonTotal, bookingCharge,
} from "./pricing.ts";

// ── The authored spec table (launch rates) ───────────────────────────
// These are the totals published to the guest. If a rate changes, these
// change with it — the test is the contract for the numbers on the page.
const FULL_TOTALS = {
  6: 600, 8: 760, 10: 950, 12: 1140, 14: 1330, 16: 1520,
  20: 1900, 24: 2280, 30: 3100, 40: 4050,
};
const SHORT_TOTALS = {
  6: 410, 8: 520, 10: 650, 12: 780, 16: 1040,
  20: 1300, 24: 1560, 30: 2200, 40: 2850,
};

test("launch totals match the published spec table for both boards", () => {
  for (const [g, total] of Object.entries(FULL_TOTALS)) {
    assert.equal(quoteForBoard("full", Number(g)).total, total, `full board at ${g}`);
  }
  for (const [g, total] of Object.entries(SHORT_TOTALS)) {
    assert.equal(quoteForBoard("short", Number(g)).total, total, `short board at ${g}`);
  }
});

test("parties of 4, 5, 6 all pay the event minimum (never a penalty)", () => {
  for (const g of [4, 5, 6]) {
    assert.equal(quoteForBoard("full", g).total, 600, `full at ${g}`);
    assert.equal(quoteForBoard("short", g).total, 410, `short at ${g}`);
    assert.equal(quoteForBoard("full", g).minimumApplied, true);
    assert.equal(quoteForBoard("short", g).minimumApplied, true);
  }
});

test("the minimum binds ONLY at 4–6; from 7 up it is the per-guest rate", () => {
  for (const board of BOARDS) {
    for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
      const q = quoteForBoard(board.id, g);
      assert.equal(q.minimumApplied, g <= 6, `${board.id} minimumApplied at ${g}`);
    }
  }
});

test("total is non-decreasing across 4–50 for launch AND standard, both boards", () => {
  for (const active of [true, false]) {
    // effectiveRates reads LAUNCH_ACTIVE; recompute totals for each set directly.
    for (const board of BOARDS) {
      const set = active ? board.launch : board.standard;
      let prev = 0;
      for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
        const base = Math.max(g * set.perGuest, set.minimum);
        const total = base + (g > SECOND_CHEF_THRESHOLD ? SECOND_CHEF_FEE : 0);
        assert.ok(total >= prev, `${board.id} (${active ? "launch" : "standard"}) at ${g}: ${total} < ${prev}`);
        prev = total;
      }
    }
  }
});

test("second-chef fee adds $250 above 24 guests only", () => {
  for (const board of BOARDS) {
    assert.equal(quoteForBoard(board.id, SECOND_CHEF_THRESHOLD).secondChefApplied, false);
    assert.equal(quoteForBoard(board.id, SECOND_CHEF_THRESHOLD).secondChefFee, 0);
    assert.equal(quoteForBoard(board.id, SECOND_CHEF_THRESHOLD + 1).secondChefApplied, true);
    assert.equal(quoteForBoard(board.id, SECOND_CHEF_THRESHOLD + 1).secondChefFee, SECOND_CHEF_FEE);
  }
  // 30 full = 30×95 + 250; 40 short = 40×65 + 250 (from the spec table)
  assert.equal(quoteForBoard("full", 30).total, 30 * 95 + 250);
  assert.equal(quoteForBoard("short", 40).total, 40 * 65 + 250);
});

test("deposit is a flat $200 on both boards and every guest count", () => {
  assert.equal(DEPOSIT, 200);
  for (const board of BOARDS) {
    for (const g of [4, 12, 25, 50]) {
      const q = quoteForBoard(board.id, g);
      assert.equal(q.deposit, 200, `${board.id} deposit at ${g}`);
      assert.equal(q.balance, q.total - 200, `${board.id} balance at ${g}`);
    }
  }
});

test("per-guest rates and minimums hold for both rate sets", () => {
  const spec = {
    full:  { launch: [95, 600], standard: [135, 850] },
    short: { launch: [65, 410], standard: [95, 600] },
  };
  for (const board of BOARDS) {
    assert.deepEqual([board.launch.perGuest, board.launch.minimum], spec[board.id].launch, `${board.id} launch`);
    assert.deepEqual([board.standard.perGuest, board.standard.minimum], spec[board.id].standard, `${board.id} standard`);
  }
});

test("launch is active and effectiveRates resolves to the launch set", () => {
  assert.equal(LAUNCH_ACTIVE, true);
  for (const board of BOARDS) assert.deepEqual(effectiveRates(board), board.launch);
});

test("board total ranges reflect the event minimum floor and full house", () => {
  assert.deepEqual(boardTotalRange(boardById("full")),  { low: 600, high: 50 * 95 + 250 });
  assert.deepEqual(boardTotalRange(boardById("short")), { low: 410, high: 50 * 65 + 250 });
});

test("FROM_PRICE is the lowest effective minimum ($410 during launch)", () => {
  assert.equal(FROM_PRICE, 410);
});

test("discount reduces the base, floors at the minimum, and never eats the second-chef fee", () => {
  const q = quoteForBoard("full", 4); // base 600 (minimum), total 600
  assert.equal(totalAfterDiscount(q, 200), 600);        // can't fall below the launch minimum
  const q8 = quoteForBoard("full", 8);                   // base 760, above floor
  assert.equal(totalAfterDiscount(q8, 60), 700);
  const q30 = quoteForBoard("full", 30);                 // base 2850 + 250 fee
  assert.equal(totalAfterDiscount(q30, 100), 2850 - 100 + 250); // fee untouched
  assert.equal(totalAfterDiscount(q30, 999999), 600 + 250);     // floors base at launch minimum, keeps fee
});

test("below 4 is invalid; over 50 routes to contact; unknown board is null", () => {
  assert.equal(quoteForBoard("full", 3), null);
  assert.equal(quoteForBoard("full", 51), null);
  assert.equal(quoteForBoard("bogus", 10), null);
  assert.equal(quotesForGuests(3), null);
  assert.equal(quotesForGuests(51), null);
});

test("quotesForGuests returns one quote per board, in BOARDS order", () => {
  const qs = quotesForGuests(10);
  assert.equal(qs.length, BOARDS.length);
  assert.deepEqual(qs.map((q) => q.board.id), BOARDS.map((b) => b.id));
  assert.equal(qs[0].total, 950);  // full at 10
  assert.equal(qs[1].total, 650);  // short at 10
});

// ── Menu: roll library ────────────────────────────────────────────────
test("ROLL_LIBRARY has ten rolls with unique ids and complete fields", () => {
  assert.equal(ROLL_LIBRARY.length, 10);
  const ids = ROLL_LIBRARY.map((r) => r.id);
  assert.equal(new Set(ids).size, 10, "roll ids are unique");
  for (const r of ROLL_LIBRARY) {
    assert.ok(r.id && r.name && r.description, `${r.id} has id/name/description`);
    assert.ok(Array.isArray(r.contains) && r.contains.length > 0, `${r.id} lists ingredients`);
    assert.equal(typeof r.cooked, "boolean");
    assert.equal(typeof r.vegetarian, "boolean");
    assert.equal(r.available, true);
    assert.equal(rollById(r.id), r);
  }
  assert.equal(rollById("nope"), null);
});

test("cooked rolls carry no raw fish; Garden is the only vegetarian roll", () => {
  // The three authored cooked rolls, plus Garden (no seafood at all).
  const cooked = ROLL_LIBRARY.filter((r) => r.cooked).map((r) => r.id).sort();
  assert.deepEqual(cooked, ["california", "dragon", "garden", "spider"]);
  const veg = ROLL_LIBRARY.filter((r) => r.vegetarian).map((r) => r.id);
  assert.deepEqual(veg, ["garden"]);
  assert.equal(rollById("garden").cooked, true, "a no-seafood roll is raw-fish-free");
});

// ── Menu: nigiri & allowances ─────────────────────────────────────────
test("NIGIRI_OPTIONS is the six selectable fish", () => {
  assert.equal(NIGIRI_OPTIONS.length, 6);
  assert.deepEqual([...NIGIRI_OPTIONS], ["Salmon", "Tuna", "Yellowtail", "Eel", "Spicy tuna", "Shrimp"]);
});

test("ROLL_ALLOWANCE is 6 full / 4 short and matches board.rolls", () => {
  assert.equal(ROLL_ALLOWANCE("full"), 6);
  assert.equal(ROLL_ALLOWANCE("short"), 4);
  for (const b of BOARDS) assert.equal(ROLL_ALLOWANCE(b.id), b.rolls);
});

test("NIGIRI_ALLOWANCE: full picks 4 of 6; short is a fixed salmon & tuna pairing", () => {
  const full = NIGIRI_ALLOWANCE("full");
  assert.equal(full.count, 4);
  assert.equal(full.selectable, true);
  assert.deepEqual([...full.options], [...NIGIRI_OPTIONS]);
  const short = NIGIRI_ALLOWANCE("short");
  assert.equal(short.selectable, false);
  assert.deepEqual([...short.fixed], ["Salmon", "Tuna"]);
  assert.deepEqual([...SHORT_BOARD_NIGIRI], ["Salmon", "Tuna"]);
});

test("SHORT_BOARD_DEFAULTS are four real roll ids at the Short allowance", () => {
  assert.equal(SHORT_BOARD_DEFAULTS.length, ROLL_ALLOWANCE("short"));
  for (const id of SHORT_BOARD_DEFAULTS) assert.ok(rollById(id), `${id} is a real roll`);
});

test("chefsSelection fills the exact allowance for each board", () => {
  const short = chefsSelection("short");
  assert.deepEqual(short.rolls, [...SHORT_BOARD_DEFAULTS]);
  assert.deepEqual(short.nigiri, ["Salmon", "Tuna"]);
  const full = chefsSelection("full");
  assert.equal(full.rolls.length, ROLL_ALLOWANCE("full"));
  assert.equal(new Set(full.rolls).size, full.rolls.length, "no duplicate rolls");
  assert.equal(full.nigiri.length, NIGIRI_ALLOWANCE("full").count);
  for (const id of full.rolls) assert.ok(rollById(id), `${id} is a real roll`);
});

// ── Add-ons ───────────────────────────────────────────────────────────
test("sashimi add-on: per-guest, launch $18 / standard $25, 6-guest minimum", () => {
  assert.equal(ADD_ONS.length, 1);
  const sashimi = addonById("sashimi");
  assert.ok(sashimi);
  assert.equal(sashimi.priceType, "per_guest");
  assert.equal(sashimi.launchPrice, 18);
  assert.equal(sashimi.standardPrice, 25);
  assert.equal(sashimi.minGuests, 6);
  assert.equal(effectiveAddonPrice(sashimi), LAUNCH_ACTIVE ? 18 : 25);
  assert.equal(addonById("nope"), null);
});

test("addon availability and total honor the 6-guest minimum", () => {
  const sashimi = addonById("sashimi");
  assert.equal(addonAvailable(sashimi, 5), false);
  assert.equal(addonAvailable(sashimi, 6), true);
  assert.equal(addonTotal(sashimi, 5), 0, "below minimum charges nothing");
  assert.equal(addonTotal(sashimi, 6), 18 * 6);   // 108 at launch
  assert.equal(addonTotal(sashimi, 12), 18 * 12);  // 216
  assert.equal(addonTotal(sashimi, 25), 18 * 25);  // 450
});

// ── The full booking charge ───────────────────────────────────────────
test("bookingCharge sums board + add-ons, keeps the flat $200 deposit", () => {
  for (const boardId of ["full", "short"]) {
    for (const g of [4, 12, 25]) {
      const base = quoteForBoard(boardId, g).total;
      const sashimi = addonTotal(addonById("sashimi"), g);

      const plain = bookingCharge(boardId, g, []);
      assert.equal(plain.baseTotal, base, `${boardId} @${g} base`);
      assert.equal(plain.addonsTotal, 0);
      assert.equal(plain.subtotal, base, `${boardId} @${g} subtotal no add-on`);
      assert.equal(plain.deposit, 200);
      assert.equal(plain.balance, base - 200);

      const withSashimi = bookingCharge(boardId, g, ["sashimi"]);
      assert.equal(withSashimi.addonsTotal, sashimi, `${boardId} @${g} sashimi`);
      assert.equal(withSashimi.subtotal, base + sashimi, `${boardId} @${g} subtotal + add-on`);
      assert.equal(withSashimi.deposit, 200, "add-on never moves the deposit");
      assert.equal(withSashimi.balance, base + sashimi - 200);
    }
  }
});

test("bookingCharge drops the sashimi add-on below its 6-guest minimum", () => {
  const c = bookingCharge("full", 5, ["sashimi"]);
  assert.equal(c.addonsTotal, 0);
  assert.equal(c.subtotal, quoteForBoard("full", 5).total);
});

test("bookingCharge applies a promo to the base only, then adds the add-on", () => {
  // full @8: base 760. $60 promo → 700. + sashimi 18×8=144 → 844.
  const c = bookingCharge("full", 8, ["sashimi"], 60);
  assert.equal(c.baseTotal, 760);
  assert.equal(c.discount, 60);
  assert.equal(c.addonsTotal, 18 * 8);
  assert.equal(c.subtotal, 700 + 18 * 8);
  assert.equal(c.balance, 700 + 18 * 8 - 200);
  // A huge promo floors the base at the minimum but never eats the add-on.
  const floored = bookingCharge("full", 4, ["sashimi"], 999999);
  assert.equal(floored.subtotal, 600); // add-on is 0 at 4 guests; base floors at 600
});

test("bookingCharge is null out of the bookable range or for an unknown board", () => {
  assert.equal(bookingCharge("full", 3), null);
  assert.equal(bookingCharge("full", 51), null);
  assert.equal(bookingCharge("bogus", 10), null);
});
