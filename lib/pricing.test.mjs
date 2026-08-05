// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quoteForBoard, quotesForGuests, totalAfterDiscount, boardTotalRange, effectiveRates,
  BOARDS, boardById, MIN_GUESTS, MAX_GUESTS, FROM_PRICE, LAUNCH_ACTIVE,
  DEPOSIT, SECOND_CHEF_THRESHOLD, SECOND_CHEF_FEE,
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
