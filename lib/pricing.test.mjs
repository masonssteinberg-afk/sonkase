// Run with: npm test  (node --test, uses Node's built-in TS type stripping)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quoteForGuests, totalAfterDiscount, tierTotalRange, effectiveRates,
  TIERS, MIN_GUESTS, MAX_GUESTS, FROM_PRICE, LAUNCH_ACTIVE,
} from "./pricing.ts";

// Total for a given rate set at a guest count, resolved from the tiers.
const totalFor = (set, g) => {
  const t = TIERS.find((x) => g >= x.minGuests && g <= x.maxGuests);
  return Math.max(g * t[set].perGuest, t[set].minimum);
};

// The headline requirement: total never decreases as guests rise, for BOTH
// rate sets. This fails on the old minimums (launch 12→900, 13→845) and
// passes on the laddered ones (13→900).
test("total is non-decreasing across 2–50 for launch AND standard", () => {
  for (const set of ["launch", "standard"]) {
    let prev = 0;
    for (let g = 2; g <= MAX_GUESTS; g++) {
      const total = totalFor(set, g);
      assert.ok(total >= prev, `${set}: total at ${g} (${total}) must be >= previous (${prev})`);
      prev = total;
    }
  }
});

test("minimums are laddered from the tier below (KT keeps its authored floor)", () => {
  const expected = {
    kitchentable: { launch: 275,  standard: 450 },   // authored
    countertop:   { launch: 425,  standard: 675 },   // KT top: 85×5 / 135×5
    longtable:    { launch: 900,  standard: 1380 },  // CT top: 75×12 / 115×12
    fullspread:   { launch: 1560, standard: 2280 },  // LT top: 65×24 / 95×24
  };
  for (const t of TIERS) {
    assert.equal(t.launch.minimum, expected[t.id].launch, `${t.id} launch minimum`);
    assert.equal(t.standard.minimum, expected[t.id].standard, `${t.id} standard minimum`);
  }
});

test("per-guest rates and deposits are unchanged", () => {
  const spec = {
    kitchentable: { standard: [135, 150], launch: [85, 75] },
    countertop:   { standard: [115, 200], launch: [75, 125] },
    longtable:    { standard: [95, 350],  launch: [65, 250] },
    fullspread:   { standard: [80, 500],  launch: [55, 350] },
  };
  for (const t of TIERS) {
    assert.deepEqual([t.standard.perGuest, t.standard.deposit], spec[t.id].standard, `${t.id} standard`);
    assert.deepEqual([t.launch.perGuest, t.launch.deposit], spec[t.id].launch, `${t.id} launch`);
  }
});

test("launch is active and the confirm values hold", () => {
  assert.equal(LAUNCH_ACTIVE, true);
  for (const t of TIERS) assert.deepEqual(effectiveRates(t), t.launch);
  assert.equal(quoteForGuests(12).total, 900);
  assert.equal(quoteForGuests(13).total, 900);
  assert.equal(quoteForGuests(14).total, 910);
  assert.equal(quoteForGuests(24).total, 1560);
  assert.equal(quoteForGuests(25).total, 1560);
  assert.equal(quoteForGuests(29).total, 1595);
  assert.equal(quoteForGuests(20).total, 1300); // unchanged
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
  }
});

test("minimumApplied flags exactly where the floor binds (launch 2–3, 13, 25–28)", () => {
  const applied = new Set([2, 3, 13, 25, 26, 27, 28]);
  for (let g = MIN_GUESTS; g <= MAX_GUESTS; g++) {
    assert.equal(quoteForGuests(g).minimumApplied, applied.has(g), `minimumApplied at ${g}`);
  }
});

test("minimum is applied LAST, after promo discounts", () => {
  const q = quoteForGuests(2); // launch total 275
  assert.equal(q.total, 275);
  assert.equal(totalAfterDiscount(q, 200), 275);       // can't fall below the launch minimum
  const q4 = quoteForGuests(4);                          // 340, above floor
  assert.equal(totalAfterDiscount(q4, 40), 300);
});

test("tier total ranges reflect the laddered minimums", () => {
  const expected = {
    kitchentable: [275, 425],
    countertop:   [450, 900],
    longtable:    [900, 1560],
    fullspread:   [1560, 2750],
  };
  for (const t of TIERS) {
    const { low, high } = tierTotalRange(t);
    assert.deepEqual([low, high], expected[t.id], `${t.name} range`);
  }
});

test("FROM_PRICE is the lowest effective minimum ($275 during launch)", () => {
  assert.equal(FROM_PRICE, 275);
});

test("below 2 is invalid; over 50 routes to contact", () => {
  assert.equal(quoteForGuests(1), null);
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
