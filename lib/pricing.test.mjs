// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quoteForGuests, totalAfterDiscount, tierTotalRange, effectiveRates,
  TIERS, MIN_GUESTS, MAX_GUESTS, FROM_PRICE, LAUNCH_ACTIVE,
} from "./pricing.ts";

// These assume the launch is active (the shipping state).
test("launch is the active rate set", () => {
  assert.equal(LAUNCH_ACTIVE, true);
  for (const t of TIERS) assert.deepEqual(effectiveRates(t), t.launch);
});

test("standard and launch rates match the spec", () => {
  const spec = {
    kitchentable: { standard: [135, 450, 150],  launch: [85, 275, 75] },
    countertop:   { standard: [115, 690, 200],  launch: [75, 450, 125] },
    longtable:    { standard: [95, 1235, 350],  launch: [65, 845, 250] },
    fullspread:   { standard: [80, 2000, 500],  launch: [55, 1375, 350] },
  };
  for (const t of TIERS) {
    const s = spec[t.id];
    assert.deepEqual([t.standard.perGuest, t.standard.minimum, t.standard.deposit], s.standard, `${t.id} standard`);
    assert.deepEqual([t.launch.perGuest, t.launch.minimum, t.launch.deposit], s.launch, `${t.id} launch`);
  }
});

test("launch totals = max(perGuest × guests, minimum)", () => {
  assert.equal(quoteForGuests(2).total, 275);   // 2×85=170 → floor
  assert.equal(quoteForGuests(3).total, 275);   // 3×85=255 → floor
  assert.equal(quoteForGuests(4).total, 340);   // clears floor
  assert.equal(quoteForGuests(5).total, 425);
  assert.equal(quoteForGuests(6).total, 450);   // 6×75
  assert.equal(quoteForGuests(12).total, 900);
  assert.equal(quoteForGuests(13).total, 845);  // 13×65
  assert.equal(quoteForGuests(24).total, 1560);
  assert.equal(quoteForGuests(25).total, 1375); // 25×55
  assert.equal(quoteForGuests(50).total, 2750);
});

test("launch deposits are 75/125/250/350 at both ends of every band", () => {
  const ends = {
    kitchentable: [2, 5, 75],
    countertop:   [6, 12, 125],
    longtable:    [13, 24, 250],
    fullspread:   [25, 50, 350],
  };
  for (const [id, [lo, hi, dep]] of Object.entries(ends)) {
    assert.equal(quoteForGuests(lo).deposit, dep, `${id} low deposit`);
    assert.equal(quoteForGuests(hi).deposit, dep, `${id} high deposit`);
    assert.equal(quoteForGuests(lo).tier.id, id, `${id} low tier`);
    assert.equal(quoteForGuests(hi).tier.id, id, `${id} high tier`);
  }
});

test("minimum only applies where perGuest×min-guests is below the floor (Kitchen Table 2–3)", () => {
  const applied = new Set([2, 3]);
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    assert.equal(quoteForGuests(g).minimumApplied, applied.has(g), `minimumApplied at ${g}`);
  }
});

test("minimum is applied LAST, after promo discounts", () => {
  const q = quoteForGuests(2); // launch total 275
  assert.equal(q.total, 275);
  assert.equal(totalAfterDiscount(q, 200), 275); // discount can't go below the launch minimum
  const q4 = quoteForGuests(4); // 340, above floor
  assert.equal(totalAfterDiscount(q4, 40), 300);
});

test("tier total ranges start at each tier's launch minimum", () => {
  const expected = {
    kitchentable: [275, 425],
    countertop:   [450, 900],
    longtable:    [845, 1560],
    fullspread:   [1375, 2750],
  };
  for (const t of TIERS) {
    const { low, high } = tierTotalRange(t);
    assert.equal(low, t.launch.minimum, `${t.name} low == launch minimum`);
    assert.deepEqual([low, high], expected[t.id], `${t.name} range`);
  }
});

test("FROM_PRICE is the lowest effective minimum ($275 during launch)", () => {
  assert.equal(FROM_PRICE, 275);
});

test("below 2 is invalid; over 50 routes to contact", () => {
  assert.equal(quoteForGuests(1), null);
  assert.equal(quoteForGuests(0), null);
  assert.equal(quoteForGuests(51), null);
});

test("tier guest ranges tile 2–50 with no gaps or overlaps", () => {
  const sorted = [...TIERS].sort((a, b) => a.minGuests - b.minGuests);
  assert.equal(sorted[0].minGuests, MIN_GUESTS);
  assert.equal(sorted[sorted.length - 1].maxGuests, MAX_GUESTS);
  for (let i = 1; i < sorted.length; i++) {
    assert.equal(sorted[i].minGuests, sorted[i - 1].maxGuests + 1);
  }
});
