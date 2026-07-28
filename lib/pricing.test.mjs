// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteForGuests, totalAfterDiscount, tierTotalRange, TIERS, MIN_GUESTS, MAX_GUESTS } from "./pricing.ts";

test("total is monotonic non-decreasing walking 2 through 51", () => {
  let prev = 0;
  for (let g = 2; g <= 51; g++) {
    const q = quoteForGuests(g);
    if (g > MAX_GUESTS) { assert.equal(q, null, `over ${MAX_GUESTS} routes to contact`); continue; }
    assert.ok(q, `quote exists for ${g}`);
    assert.ok(q.total >= prev, `total at ${g} guests (${q.total}) >= previous (${prev})`);
    prev = q.total;
  }
});

test("tier boundaries and event minimums", () => {
  assert.equal(quoteForGuests(2).total, 650);    // 2×215=430 → floor
  assert.equal(quoteForGuests(4).total, 860);    // 4×215 clears the floor
  assert.equal(quoteForGuests(5).total, 1075);   // top of Kitchen Table
  assert.equal(quoteForGuests(6).total, 1110);   // Countertop floor
  assert.equal(quoteForGuests(8).total, 1480);
  assert.equal(quoteForGuests(12).total, 2220);  // top of Countertop
  assert.equal(quoteForGuests(13).total, 2220);  // Long Table floor = top of band below
  assert.equal(quoteForGuests(16).total, 2320);
  assert.equal(quoteForGuests(24).total, 3480);  // top of Long Table
  assert.equal(quoteForGuests(25).total, 3480);  // Full Spread floor
  assert.equal(quoteForGuests(40).total, 4400);
  assert.equal(quoteForGuests(50).total, 5500);
});

test("minimumApplied flags exactly 2–3, 13–15, 25–31", () => {
  const expected = new Set([2, 3, 13, 14, 15, 25, 26, 27, 28, 29, 30, 31]);
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    assert.equal(quoteForGuests(g).minimumApplied, expected.has(g), `minimumApplied at ${g} guests`);
  }
});

test("event minimum is applied LAST, after promo discounts", () => {
  // 8-guest Countertop: 8 × $185 = $1,480. A 30% promo (−$444) → $1,036,
  // below the $1,110 floor — so the booking must settle at $1,110.
  const q = quoteForGuests(8);
  assert.equal(q.total, 1480);
  assert.equal(totalAfterDiscount(q, 0.30 * q.total), 1110);
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
  const q = quoteForGuests(40); // Full Spread, 40×110 = 4400
  assert.equal(totalAfterDiscount(q, 100), 4300);
});

test("deposits are 250/400/700/1100 at both ends of every band", () => {
  const ends = {
    kitchentable: [2, 5, 250],
    countertop:   [6, 12, 400],
    longtable:    [13, 24, 700],
    fullspread:   [25, 50, 1100],
  };
  for (const [id, [lo, hi, dep]] of Object.entries(ends)) {
    assert.equal(quoteForGuests(lo).deposit, dep, `${id} low deposit`);
    assert.equal(quoteForGuests(hi).deposit, dep, `${id} high deposit`);
    assert.equal(quoteForGuests(lo).tier.id, id, `${id} low tier`);
    assert.equal(quoteForGuests(hi).tier.id, id, `${id} high tier`);
  }
});

test("below 2 is invalid; over 50 routes to contact", () => {
  assert.equal(quoteForGuests(1), null);
  assert.equal(quoteForGuests(0), null);
  assert.equal(quoteForGuests(51), null);
});

test("tier total ranges start at each tier's event minimum", () => {
  const expected = {
    kitchentable: [650, 1075],
    countertop:   [1110, 2220],
    longtable:    [2220, 3480],
    fullspread:   [3480, 5500],
  };
  for (const t of TIERS) {
    const { low, high } = tierTotalRange(t);
    assert.equal(low, t.eventMinimum, `${t.name} low == event minimum`);
    assert.equal(low,  expected[t.id][0], `${t.name} low`);
    assert.equal(high, expected[t.id][1], `${t.name} high`);
  }
});

test("tier guest ranges tile 2–50 with no gaps or overlaps", () => {
  const sorted = [...TIERS].sort((a, b) => a.minGuests - b.minGuests);
  assert.equal(sorted[0].minGuests, MIN_GUESTS);
  assert.equal(sorted[sorted.length - 1].maxGuests, MAX_GUESTS);
  for (let i = 1; i < sorted.length; i++) {
    assert.equal(sorted[i].minGuests, sorted[i - 1].maxGuests + 1);
  }
});
