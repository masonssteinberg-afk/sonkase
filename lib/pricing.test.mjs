// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteForGuests, totalAfterDiscount, tierTotalRange, TIERS, MIN_GUESTS, MAX_GUESTS } from "./pricing.ts";

test("total is monotonic non-decreasing across the whole guest range", () => {
  let prev = 0;
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    const q = quoteForGuests(g);
    assert.ok(q, `quote exists for ${g}`);
    assert.ok(q.total >= prev, `total at ${g} guests (${q.total}) >= total at ${g - 1} (${prev})`);
    prev = q.total;
  }
});

test("tier boundaries and event minimums", () => {
  assert.equal(quoteForGuests(8).total, 1300);   // 8×135=1080 → floor
  assert.equal(quoteForGuests(10).total, 1350);  // clears the floor
  assert.equal(quoteForGuests(16).total, 2160);  // top of Countertop
  assert.equal(quoteForGuests(17).total, 2160);  // Long Table floor = top of band below
  assert.equal(quoteForGuests(19).total, 2185);
  assert.equal(quoteForGuests(30).total, 3450);  // top of Long Table
  assert.equal(quoteForGuests(31).total, 3450);  // Full Spread floor
  assert.equal(quoteForGuests(37).total, 3515);
});

test("minimumApplied flags exactly 8–9, 17–18, 31–36", () => {
  const expected = new Set([8, 9, 17, 18, 31, 32, 33, 34, 35, 36]);
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    assert.equal(quoteForGuests(g).minimumApplied, expected.has(g), `minimumApplied at ${g} guests`);
  }
});

test("event minimum is applied LAST, after promo discounts", () => {
  // 10-guest Countertop: 10 × $135 = $1,350. A 20% promo (−$270) would be
  // $1,080 — below the floor — so the booking must settle at $1,300.
  const q = quoteForGuests(10);
  assert.equal(q.total, 1350);
  assert.equal(totalAfterDiscount(q, 0.20 * q.total), 1300);
});

test("discounts never take a booking below its tier floor", () => {
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    const q = quoteForGuests(g);
    for (const d of [0, 25, 0.1 * q.total, 0.5 * q.total, q.total, q.total * 2]) {
      assert.ok(
        totalAfterDiscount(q, d) >= q.tier.eventMinimum,
        `${g} guests with $${d} off stays at or above the ${q.tier.name} floor`
      );
    }
  }
});

test("discounts above the floor reduce the total normally", () => {
  const q = quoteForGuests(25); // Long Table, 25×115 = 2875
  assert.equal(totalAfterDiscount(q, 100), 2775);
});

test("deposit is fixed by tier and unaffected by guest count within the band", () => {
  assert.equal(quoteForGuests(8).deposit, 400);
  assert.equal(quoteForGuests(16).deposit, 400);
  assert.equal(quoteForGuests(17).deposit, 750);
  assert.equal(quoteForGuests(30).deposit, 750);
  assert.equal(quoteForGuests(31).deposit, 1100);
  assert.equal(quoteForGuests(50).deposit, 1100);
});

test("under 8 books at the Countertop minimum; over 50 returns null", () => {
  const small = quoteForGuests(4);
  assert.equal(small.tier.id, "countertop");
  assert.equal(small.total, 1300);
  assert.equal(small.minimumApplied, true);
  assert.equal(quoteForGuests(51), null);
  assert.equal(quoteForGuests(0), null);
});

test("tier total ranges match the advertised card numbers", () => {
  const expected = {
    countertop: [1300, 2160],
    longtable:  [2160, 3450],
    fullspread: [3450, 4750],
  };
  for (const t of TIERS) {
    const { low, high } = tierTotalRange(t);
    assert.equal(low,  expected[t.id][0], `${t.name} low`);
    assert.equal(high, expected[t.id][1], `${t.name} high`);
  }
});

test("tier guest ranges tile 8–50 with no gaps or overlaps", () => {
  const sorted = [...TIERS].sort((a, b) => a.minGuests - b.minGuests);
  assert.equal(sorted[0].minGuests, MIN_GUESTS);
  assert.equal(sorted[sorted.length - 1].maxGuests, MAX_GUESTS);
  for (let i = 1; i < sorted.length; i++) {
    assert.equal(sorted[i].minGuests, sorted[i - 1].maxGuests + 1);
  }
});
