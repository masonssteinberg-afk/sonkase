"use client";
import { useState, useEffect } from "react";

const ADMIN_PW = "prettyyoungthing";
const AUTH_KEY = "sk_admin_authed";

const INDIGO      = "#1a2845";
const INDIGO_DARK = "#0d1729";
const PERSIMMON   = "#c5552d";
const CREAM       = "#f5ecd9";
const PAPER       = "#fbf6e8";
const INK         = "#1a1208";
const INK_SOFT    = "#5a4f3c";
const INK_FAINT   = "#a89a82";
const GOLD        = "#a07736";
const FOREST      = "#2d4a3a";
const PLUM        = "#5a2a4a";
const FD = `'Shippori Mincho', Georgia, serif`;
const FB = `'Crimson Pro', Georgia, serif`;

const STATUS_COLORS = { confirmed: FOREST, pending: GOLD, cancelled: PERSIMMON };
const TIER_COLORS   = { classics: FOREST, signatures: INDIGO, specialty: GOLD, premium: PLUM };
const TIER_LABELS   = { classics: "Classics", signatures: "Signatures", specialty: "Specialty", premium: "Premium" };

const fmt2   = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");
const fmtPct = (n) => (n != null ? n.toFixed(1) + "%" : "—");
const fmtOz  = (n) => n > 0 ? `${n.toFixed(1)} oz (${(n / 16).toFixed(2)} lb)` : "0 oz";

// ============================================================
// ROLL COST & PROTEIN DATA
// ============================================================
const ROLL_COSTS = {
  // Classics
  "Cucumber": 0.50, "Avocado": 0.94, "Sweet Potato": 0.59, "California": 1.57,
  "Salmon Avocado": 2.25, "Tuna Avocado": 1.44, "Spicy Krab": 0.89,
  "Philadelphia": 2.00, "Garden": 1.05, "Spicy Veggie": 1.05,
  // Signatures
  "Florida": 2.97, "So Down": 2.95, "Spicy Roll": 0.99, "Bagel": 2.00,
  "Isaac's": 2.02, "Stacey's Way": 3.14, "Groove": 1.13, "Swamp": 1.19,
  // Specialty
  "Go Gator": 3.03, "Jibboo": 1.94, "Reba's": 2.27, "Haushinka's": 2.72,
  "Archer Road": 1.49, "Orlando": 1.51, "Gabi's": 3.76, "Steinberg": 4.19,
  "Foam": 2.67, "Black Pearl": 1.88,
  // Premium
  "Trust Me": 4.29, "Sunset": 2.60, "Hamachi Crudo": 3.31, "Smoke Show": 2.00,
  "Tropic": 1.19, "West Palm": 2.32,
};

// Protein portions per roll served (1.5 oz/portion for fin fish, 2 oz for shrimp)
const ROLL_PROTEINS = {
  "Salmon Avocado":  { salmon: 1 },
  "Philadelphia":    { salmon: 1 },
  "Florida":         { salmon: 1, tuna: 1 },
  "So Down":         { salmon: 1, tuna: 1 },
  "Stacey's Way":    { salmon: 1, tuna: 1 },
  "Bagel":           { smoked_salmon: 1 },
  "Go Gator":        { salmon: 1, shrimp: 1 },
  "Gabi's":          { salmon: 2 },
  "Steinberg":       { salmon: 1, tuna: 1, yellowtail: 1 },
  "Sunset":          { salmon: 1 },
  "Smoke Show":      { smoked_salmon: 1, tuna: 1 },
  "Trust Me":        { salmon: 1, yellowtail: 1 },
  "Haushinka's":     { salmon: 1 },
  "Tuna Avocado":    { tuna: 1 },
  "Spicy Roll":      { tuna: 1 },
  "Isaac's":         { tuna: 1, yellowtail: 1 },
  "Archer Road":     { tuna: 1, shrimp: 1 },
  "Foam":            { tuna: 1, yellowtail: 1 },
  "Black Pearl":     { tuna: 2 },
  "Reba's":          { yellowtail: 1 },
  "West Palm":       { yellowtail: 2 },
  "Hamachi Crudo":   { yellowtail: 2 },
  "Jibboo":          { shrimp: 1 },
  "Orlando":         { shrimp: 1 },
};

// Non-protein ingredient quantities per roll (for checklist)
// krab=2oz portions, avocado=half pieces, cream_cheese=oz, masago/tobiko=grams, cucumber/mango=quarter pieces
const ROLL_INGREDIENT_QTY = {
  "Cucumber":      { cucumber: 0.25 },
  "Avocado":       { avocado: 0.5 },
  "California":    { krab: 2, avocado: 0.5, cucumber: 0.25, masago: 5 },
  "Salmon Avocado":{ avocado: 0.5 },
  "Tuna Avocado":  { avocado: 0.5 },
  "Spicy Krab":    { krab: 2, spicy_mayo: true },
  "Philadelphia":  { cream_cheese: 1, cucumber: 0.25 },
  "Garden":        { avocado: 0.5, cucumber: 0.25 },
  "Spicy Veggie":  { avocado: 0.5, cucumber: 0.25 },
  "Florida":       { avocado: 0.5, masago: 5 },
  "So Down":       { avocado: 0.5, spicy_mayo: true },
  "Spicy Roll":    { spicy_mayo: true },
  "Bagel":         { cream_cheese: 1, cucumber: 0.25 },
  "Isaac's":       { spicy_mayo: true },
  "Stacey's Way":  { avocado: 0.5, cream_cheese: 1 },
  "Groove":     { avocado: 0.5, cream_cheese: 1, eel_sauce: true },
  "Swamp":         { avocado: 0.5, mango: 0.25 },
  "Go Gator":      { avocado: 0.5, tobiko: 5 },
  "Jibboo":        { krab: 2, avocado: 0.5, cucumber: 0.25 },
  "Reba's":        { krab: 2, mango: 0.25 },
  "Haushinka's":   { avocado: 0.5, cream_cheese: 1, tobiko: 5, eel_sauce: true },
  "Archer Road":   { spicy_mayo: true },
  "Orlando":       { krab: 2, cream_cheese: 1, masago: 5 },
  "Gabi's":        { eel_sauce: true },
  "Steinberg":     { avocado: 0.5, cucumber: 0.25 },
  "Foam":          { avocado: 0.5, spicy_mayo: true },
  "Black Pearl":   { tobiko: 5, cucumber: 0.25 },
  "Trust Me":      { avocado: 0.5, tobiko: 5 },
  "Sunset":        { avocado: 0.5, mango: 0.25 },
  "Hamachi Crudo": { avocado: 0.5, cucumber: 0.25 },
  "Smoke Show":    { cream_cheese: 1, cucumber: 0.25, avocado: 0.5 },
  "Tropic":  { avocado: 0.5, cucumber: 0.25, mango: 0.25, cream_cheese: 1 },
  "West Palm":     { avocado: 0.5, mango: 0.25, eel_sauce: true },
};

const RICE_SEASONING_PER_ROLL = 0.08; // rice vinegar + kombu
const CONDIMENT_PER_GUEST     = 0.23; // wasabi $0.10 + ginger $0.08 + soy $0.05
const LABOR_COST              = 70;

function calcLogistics(booking) {
  const rolls  = Array.isArray(booking.rolls_selected) ? booking.rolls_selected : [];
  const guests = Number(booking.guest_count) || 0;
  const total  = Number(booking.total_price) || 0;
  const deposit = Number(booking.deposit_amount) || 0;
  const balance = total - deposit;

  let rollFoodCost = 0;
  let totalRolls   = 0;
  const rollBreakdown = rolls.map((r) => {
    const costPerRoll = ROLL_COSTS[r.name] ?? null;
    const lineCost    = costPerRoll != null ? costPerRoll * r.qty : null;
    if (lineCost != null) rollFoodCost += lineCost;
    totalRolls += r.qty;
    return { ...r, costPerRoll, lineCost };
  });

  const riceSeasoningCost = totalRolls * RICE_SEASONING_PER_ROLL;
  const condimentCost     = guests * CONDIMENT_PER_GUEST;
  const totalFoodCost     = rollFoodCost + riceSeasoningCost + condimentCost;

  const grossProfit = total - totalFoodCost;
  const grossMargin = total > 0 ? (grossProfit / total) * 100 : 0;
  const laborHours  = guests >= 15 ? 3 : 2.5;
  const netProfit   = grossProfit - LABOR_COST;
  const netMargin   = total > 0 ? (netProfit / total) * 100 : 0;

  const proteins = { salmon: 0, tuna: 0, yellowtail: 0, shrimp: 0, smoked_salmon: 0 };
  rolls.forEach((r) => {
    const p = ROLL_PROTEINS[r.name] || {};
    for (const [k, v] of Object.entries(p)) {
      if (k in proteins) proteins[k] += v * r.qty;
    }
  });

  return {
    total, deposit, balance,
    rollFoodCost, riceSeasoningCost, condimentCost, totalFoodCost,
    grossProfit, grossMargin,
    laborHours, netProfit, netMargin,
    totalRolls, rollBreakdown,
    plates:       guests * 3,
    chopsticks:   guests,
    soySauceCups: guests,
    napkins:      guests * 3,
    gloves:       4,
    cuttingBoards: 2,
    riceCups:     Math.ceil(totalRolls / 3),
    proteins,
    fishOz: {
      salmon:       proteins.salmon * 1.5,
      tuna:         proteins.tuna * 1.5,
      yellowtail:   proteins.yellowtail * 1.5,
      shrimp:       proteins.shrimp * 2,
      smoked_salmon: proteins.smoked_salmon * 1.5,
    },
  };
}

function calcIngredients(booking, calc) {
  const rolls  = Array.isArray(booking.rolls_selected) ? booking.rolls_selected : [];
  const guests = Number(booking.guest_count) || 0;

  const totals = { krab: 0, avocado: 0, cream_cheese: 0, masago: 0, tobiko: 0, cucumber: 0, mango: 0, eel_sauce: false, spicy_mayo: false };

  rolls.forEach((r) => {
    const iq = ROLL_INGREDIENT_QTY[r.name] || {};
    for (const [k, v] of Object.entries(iq)) {
      if (k === "eel_sauce" || k === "spicy_mayo") { totals[k] = totals[k] || !!v; }
      else { totals[k] = (totals[k] || 0) + Number(v) * r.qty; }
    }
  });

  return {
    ...totals,
    salmon:       calc.fishOz.salmon,
    tuna:         calc.fishOz.tuna,
    yellowtail:   calc.fishOz.yellowtail,
    shrimp:       calc.fishOz.shrimp,
    smoked_salmon: calc.fishOz.smoked_salmon,
    nori:         calc.totalRolls,
    rice:         calc.riceCups,
    guests,
  };
}

function buildFoodOrderItems(ing) {
  const lbs = (oz) => oz >= 16 ? `${(oz / 16).toFixed(2)} lb` : `${oz.toFixed(1)} oz`;
  const items = [];
  if (ing.salmon > 0)       items.push({ id: "order_salmon",        text: "Order salmon",                    detail: `~${lbs(ing.salmon)} needed` });
  if (ing.tuna > 0)         items.push({ id: "order_tuna",          text: "Order tuna",                      detail: `~${lbs(ing.tuna)} needed` });
  if (ing.yellowtail > 0)   items.push({ id: "order_yellowtail",    text: "Order yellowtail",                detail: `~${lbs(ing.yellowtail)} needed` });
  if (ing.shrimp > 0)       items.push({ id: "order_shrimp",        text: "Order shrimp",                    detail: `~${lbs(ing.shrimp)} needed` });
  if (ing.krab > 0)         items.push({ id: "order_krab",          text: "Order imitation krab",            detail: `~${lbs(ing.krab)} needed` });
  if (ing.smoked_salmon > 0)items.push({ id: "order_smoked_salmon", text: "Order smoked salmon",             detail: `~${lbs(ing.smoked_salmon)} needed` });
  if (ing.avocado > 0)      items.push({ id: "check_avocado",       text: "Check avocado stock",             detail: `${Math.ceil(ing.avocado)} avocados needed` });
  if (ing.cream_cheese > 0) items.push({ id: "check_cream_cheese",  text: "Check cream cheese stock",        detail: `${Math.round(ing.cream_cheese)} oz needed` });
  if (ing.masago > 0)       items.push({ id: "check_masago",        text: "Check masago stock",              detail: `${Math.round(ing.masago)} g needed` });
  if (ing.tobiko > 0)       items.push({ id: "check_tobiko",        text: "Check tobiko / blue tobiko stock",detail: `${Math.round(ing.tobiko)} g needed` });
  if (ing.cucumber > 0)     items.push({ id: "check_cucumber",      text: "Check cucumber stock",            detail: `${Math.ceil(ing.cucumber)} cucumbers needed` });
  if (ing.mango > 0)        items.push({ id: "check_mango",         text: "Check mango stock",               detail: `${Math.ceil(ing.mango)} mangoes needed` });
  if (ing.nori > 0)         items.push({ id: "check_nori",          text: "Check nori stock",                detail: `${ing.nori} sheets needed` });
  if (ing.rice > 0)         items.push({ id: "check_rice",          text: "Check sushi rice stock",          detail: `${ing.rice} cups dry rice` });
  if (ing.eel_sauce)        items.push({ id: "check_eel_sauce",     text: "Check eel sauce stock",           detail: null });
  items.push({ id: "check_wasabi",       text: "Check wasabi stock",        detail: `${ing.guests} guests` });
  items.push({ id: "check_ginger",       text: "Check pickled ginger stock",detail: `${ing.guests} guests` });
  items.push({ id: "check_soy",          text: "Check soy sauce stock",     detail: `${ing.guests} guests` });
  items.push({ id: "check_rice_vinegar", text: "Check rice vinegar stock",  detail: null });
  items.push({ id: "check_kombu",        text: "Check kombu stock",         detail: null });
  if (ing.spicy_mayo) items.push({ id: "check_spicy_mayo", text: "Check spicy mayo ingredients", detail: "mayo, sriracha, sesame oil" });
  return items;
}

const PREP_DAY_BEFORE = [
  "Confirm event date, time, and address with client",
  "Pick up fish order from Northwest Seafood",
  "Pick up dry goods from Restaurant Depot",
  "Make spicy mayo",
  "Season and cook sushi rice (make extra)",
  "Portion and prep all proteins",
  "Slice avocados and store in lemon water",
  "Prep cucumber, mango, and other vegetables",
  "Pack all equipment: rice cooker, cutting boards, knives, mats, gloves",
  "Pack all disposables: plates, chopsticks, soy cups, napkins",
];

const PREP_DAY_OF = [
  "Confirm arrival time with client (arrive 2 hours before service)",
  "Load car: fish cooler, equipment bag, disposables box",
  "Bring: extra nori, extra rice, all sauces, wasabi, ginger",
  "Set up station on arrival",
  "Do a final roll count against the order before service starts",
  "Collect balance payment before or at start of service",
];

// ============================================================
// MAIN DASHBOARD
// ============================================================
export default function AdminDashboard() {
  const [authed, setAuthed]     = useState(false);
  const [loading, setLoading]   = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter]     = useState("all");
  const [activeTab, setActiveTab] = useState("bookings");
  const [promoCodes, setPromoCodes] = useState([]);

  useEffect(() => {
    if (localStorage.getItem(AUTH_KEY) === "1") setAuthed(true);
    setLoading(false);
  }, []);

  const fetchAllBookings = async () => {
    const res  = await fetch("/api/admin/get-bookings");
    const data = await res.json();
    setBookings(data.bookings || []);
  };

  const fetchPromoCodes = async () => {
    const res = await fetch("/api/admin/promo-codes");
    const data = await res.json();
    setPromoCodes(data.promoCodes || []);
  };

  useEffect(() => {
    if (authed) fetchAllBookings();
  }, [authed]);

  useEffect(() => {
    if (activeTab === "promo" && authed) fetchPromoCodes();
  }, [activeTab, authed]);

  const updateStatus = async (id, status) => {
    const res  = await fetch("/api/admin/update-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await res.json();
    if (data.success) {
      setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
    }
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts   = {
    all:       bookings.length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (loading) return null;

  if (!authed) return (
    <PasswordScreen onAuth={() => {
      localStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    }} />
  );

  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: FB, color: INK, overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;600;700&family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap');

        @media (max-width: 768px) {
          /* Header */
          .admin-header-inner { padding: 14px 16px !important; flex-wrap: wrap !important; gap: 10px !important; }
          .admin-header-title { font-size: 15px !important; }
          .admin-header-sub { font-size: 9px !important; }

          /* Stat cards: 2x2 grid */
          .admin-stat-grid { grid-template-columns: 1fr 1fr !important; }

          /* Filter buttons: wrap */
          .admin-filter-row { flex-wrap: wrap !important; }
          .admin-filter-btn { min-height: 44px !important; }

          /* Booking rows: stack vertically */
          .admin-booking-row { display: flex !important; flex-direction: column !important; padding: 14px 16px !important; gap: 6px !important; }
          .admin-booking-row-item { width: 100% !important; }

          /* Expanded rows: scrollable */
          .admin-booking-detail { overflow-x: auto !important; }
          .admin-detail-grid { grid-template-columns: 1fr 1fr !important; }

          /* Logistics tab */
          .admin-logistics-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .admin-logistics-table { overflow-x: auto !important; }
          .admin-stat-grid-logistics { grid-template-columns: 1fr 1fr !important; gap: 12px !important; }

          /* Checklist */
          .admin-checklist-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .admin-checklist-item { min-height: 44px !important; }
          .admin-checklist-checkbox { width: 20px !important; height: 20px !important; flex-shrink: 0 !important; }

          /* Main padding */
          .admin-main { padding: 20px 14px 60px !important; }

          /* Upcoming events table */
          .admin-upcoming-table { overflow-x: auto !important; }
          .admin-upcoming-row { min-width: 600px !important; }
          .admin-all-bookings-table { overflow-x: auto !important; }
          .admin-all-bookings-row { min-width: 700px !important; }
        }
      `}</style>

      <header style={{ background: INDIGO_DARK, color: CREAM }}>
        <div className="admin-header-inner" style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <span style={{ fontFamily: FD, fontSize: 24, color: PERSIMMON, fontWeight: 600, flexShrink: 0 }}>管理</span>
            <div style={{ minWidth: 0 }}>
              <div className="admin-header-title" style={{ fontFamily: FD, fontSize: 20, fontWeight: 500 }}>Admin Dashboard</div>
              <div className="admin-header-sub" style={{ fontFamily: FB, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontStyle: "italic" }}>
                <span style={{ color: PERSIMMON }}>Son</span><span style={{ color: "#6baed6" }}>kase</span><span style={{ color: GOLD }}>™ · Bookings</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <a href="/" style={{ background: "transparent", border: `1px solid ${PERSIMMON}`, color: PERSIMMON, padding: "6px 14px", fontFamily: FD, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap", minHeight: 44, display: "flex", alignItems: "center" }}>← Site</a>
            <button onClick={() => { localStorage.removeItem(AUTH_KEY); window.location.reload(); }} style={{ background: "transparent", border: `1px solid rgba(245,236,217,0.2)`, color: "rgba(245,236,217,0.45)", padding: "6px 14px", fontFamily: FD, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", minHeight: 44 }}>Lock</button>
          </div>
        </div>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${PERSIMMON} 0%, ${GOLD} 60%, transparent 100%)` }} />
      </header>

      <main className="admin-main" style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 16px 80px", boxSizing: "border-box" }}>

        {/* Top-level tab bar */}
        <div style={{ display: "flex", gap: 2, marginBottom: 32, borderBottom: `2px solid rgba(26,18,8,0.1)` }}>
          {[
            { key: "bookings",  label: "予約  Bookings" },
            { key: "logistics", label: "算  Logistics" },
            { key: "promo",     label: "割  Promo Codes" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: activeTab === t.key ? INDIGO_DARK : "transparent",
                color: activeTab === t.key ? CREAM : INK_SOFT,
                border: "none",
                padding: "12px 24px",
                fontFamily: FD,
                fontSize: 14,
                letterSpacing: "0.06em",
                cursor: "pointer",
                borderBottom: activeTab === t.key ? `2px solid ${PERSIMMON}` : "2px solid transparent",
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "bookings" && (
          <>
            {/* Stats row */}
            <div className="admin-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Total",     count: counts.all,       color: INDIGO },
                { label: "Pending",   count: counts.pending,   color: GOLD },
                { label: "Confirmed", count: counts.confirmed, color: FOREST },
                { label: "Cancelled", count: counts.cancelled, color: PERSIMMON },
              ].map((s) => (
                <div key={s.label} style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, borderTop: `3px solid ${s.color}`, padding: "20px 22px" }}>
                  <div style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: FD, fontSize: 36, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.count}</div>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="admin-filter-row" style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: `1px solid rgba(26,18,8,0.1)`, flexWrap: "wrap" }}>
              {["all", "pending", "confirmed", "cancelled"].map((f) => (
                <button key={f} onClick={() => setFilter(f)} className="admin-filter-btn" style={{
                  background: filter === f ? PERSIMMON : "transparent",
                  color: filter === f ? CREAM : INK_SOFT,
                  border: "none",
                  padding: "10px 18px",
                  fontFamily: FD,
                  fontSize: 13,
                  letterSpacing: "0.08em",
                  textTransform: "capitalize",
                  cursor: "pointer",
                  minHeight: 44,
                }}>
                  {f} {f !== "all" && `(${counts[f]})`}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", fontFamily: FB, fontSize: 16, color: INK_FAINT, fontStyle: "italic" }}>
                No bookings yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filtered.map((b) => (
                  <BookingRow key={b.id} booking={b} onUpdateStatus={updateStatus} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "logistics" && (
          <LogisticsTab bookings={bookings} />
        )}

        {activeTab === "promo" && (
          <PromoCodesTab promoCodes={promoCodes} onRefresh={fetchPromoCodes} />
        )}
      </main>
    </div>
  );
}

// ============================================================
// PASSWORD SCREEN
// ============================================================
function PasswordScreen({ onAuth }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (value === ADMIN_PW) {
      onAuth();
    } else {
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%,60%  { transform: translateX(-8px); }
          40%,80%  { transform: translateX(8px); }
        }
        .pw-input { animation: none; }
        .pw-input.shake { animation: shake 0.4s ease; }
        .pw-input:focus { outline: none; border-color: rgba(255,255,255,0.4) !important; }
      `}</style>
      <input
        className={`pw-input${shake ? " shake" : ""}`}
        type="password"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && attempt()}
        autoFocus
        placeholder="••••••••"
        style={{
          background: "transparent",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
          color: "#fff",
          fontFamily: "Georgia, serif",
          fontSize: 18,
          letterSpacing: "0.2em",
          padding: "12px 0",
          width: 220,
          textAlign: "center",
        }}
      />
    </div>
  );
}

// ============================================================
// BOOKINGS TAB — existing components
// ============================================================
function BookingRow({ booking: b, onUpdateStatus }) {
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLORS[b.status] || INK_FAINT;
  const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, borderLeft: `4px solid ${statusColor}` }}>
      <div onClick={() => setOpen((o) => !o)} className="admin-booking-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 140px 40px", alignItems: "center", padding: "16px 20px", gap: 12, cursor: "pointer" }}>
        <div className="admin-booking-row-item">
          <div style={{ fontFamily: FD, fontSize: 14, fontWeight: 500, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.user_email}</div>
          <div style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, fontStyle: "italic", marginTop: 2 }}>
            {b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </div>
        </div>
        <div className="admin-booking-row-item" style={{ fontFamily: FD, fontSize: 14, color: INK }}>{b.package || "—"}</div>
        <div className="admin-booking-row-item" style={{ fontFamily: FB, fontSize: 14, color: INK }}>{fmt(b.event_date)}</div>
        <div className="admin-booking-row-item" style={{ fontFamily: FB, fontSize: 14, color: INK }}>{b.guest_count ? `${b.guest_count} guests` : "—"}</div>
        <div className="admin-booking-row-item">
          <span style={{ background: statusColor, color: CREAM, padding: "3px 10px", fontFamily: FD, fontSize: 11, letterSpacing: "0.1em", textTransform: "capitalize" }}>
            {b.status}
          </span>
        </div>
        <div className="admin-booking-row-item" style={{ fontFamily: FD, fontSize: 14, color: INK_FAINT, textAlign: "center" }}>{open ? "▴" : "▾"}</div>
      </div>

      {open && (
        <div className="admin-booking-detail" style={{ borderTop: `1px solid rgba(26,18,8,0.06)`, padding: "20px 24px", background: "#fff", overflowX: "auto" }}>
          <div className="admin-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20, minWidth: 280 }}>
            <Detail label="Service Type"   value={b.service_type === "dropoff" ? "Drop-Off" : b.service_type === "datenight" ? "Date Night Omakase" : b.service_type === "omakase" ? "Omakase" : "Chef-Attended"} />
            <Detail label="Confirmation"   value={b.confirmation_number || "—"} />
            <Detail label="Booking ID"     value={b.id} />
            <Detail label="Total"          value={fmt2(b.total_price) || "—"} />
            <Detail label="Deposit"        value={fmt2(b.deposit_amount) || "—"} />
            <Detail label="Balance Due"    value={b.total_price != null && b.deposit_amount != null ? fmt2(Number(b.total_price) - Number(b.deposit_amount)) : "—"} />
            {b.promo_code && <Detail label="Promo Code" value={b.promo_code} />}
            {b.discount_amount != null && <Detail label="Discount Applied" value={`−${fmt2(b.discount_amount)}`} />}
          </div>

          {b.service_type === "omakase" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Omakase Details</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {b.event_time && <Detail label="Event Time" value={(() => { const [h,m] = b.event_time.split(":").map(Number); const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h); return `${h12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`; })()} />}
                {b.guest_count && <Detail label="Guests" value={`${b.guest_count} guests`} />}
                {Array.isArray(b.appetizers_selected) && b.appetizers_selected.length > 0 && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Appetizers</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {b.appetizers_selected.map((a) => (
                        <span key={a} style={{ fontFamily: FB, fontSize: 13, color: INK, background: PAPER, border: `1px solid rgba(26,18,8,0.1)`, padding: "4px 10px" }}>{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {b.special_requests && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Chef&rsquo;s Notes / Restrictions</div>
                    <div style={{ fontFamily: FB, fontSize: 14, color: INK_SOFT, fontStyle: "italic" }}>{b.special_requests}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {b.service_type === "datenight" && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Date Night Omakase</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "rgba(160,119,54,0.07)", border: `1px solid rgba(160,119,54,0.2)`, padding: "12px 16px" }}>
                  <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Appetizer</div>
                  <div style={{ fontFamily: FD, fontSize: 14, color: INK }}>{b.appetizer_choice || "—"}</div>
                </div>
                <div style={{ background: "rgba(160,119,54,0.07)", border: `1px solid rgba(160,119,54,0.2)`, padding: "12px 16px" }}>
                  <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Guests</div>
                  <div style={{ fontFamily: FD, fontSize: 14, color: INK }}>2 · Chef chooses 5 rolls</div>
                </div>
              </div>
              {b.special_requests && (
                <div style={{ marginTop: 12, padding: "12px 16px", background: "rgba(160,119,54,0.07)", border: `1px solid rgba(160,119,54,0.2)` }}>
                  <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Chef's Notes / Restrictions</div>
                  <div style={{ fontFamily: FB, fontSize: 14, color: INK_SOFT, fontStyle: "italic" }}>{b.special_requests}</div>
                </div>
              )}
            </div>
          )}

          {b.service_type !== "datenight" && b.special_requests && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Special Requests</div>
              <div style={{ fontFamily: FB, fontSize: 14, color: INK_SOFT, fontStyle: "italic" }}>{b.special_requests}</div>
            </div>
          )}

          {b.service_type === "dropoff" && Array.isArray(b.platters_ordered) && b.platters_ordered.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Platters Ordered</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {b.platters_ordered.map((po, i) => (
                  <div key={i} style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.1)`, padding: "12px 16px" }}>
                    <div style={{ fontFamily: FD, fontSize: 14, color: INK, fontWeight: 500, marginBottom: 4 }}>
                      {po.quantity}× {po.platter_name}
                      <span style={{ fontFamily: FB, fontSize: 13, color: GOLD, marginLeft: 10 }}>
                        ${(po.base_price * po.quantity).toFixed(0)}
                      </span>
                    </div>
                    {Array.isArray(po.substitutions) && po.substitutions.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginTop: 6 }}>
                        {po.substitutions.map((s, j) => (
                          <div key={j} style={{ fontFamily: FB, fontSize: 12, color: INK_SOFT, fontStyle: "italic" }}>
                            {s.original_roll} → {s.replacement_roll}
                            {s.upcharge_per_roll > 0 && (
                              <span style={{ color: PERSIMMON, marginLeft: 6 }}>+${(s.upcharge_per_roll * s.slot_qty * po.quantity).toFixed(0)}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontFamily: FB, fontSize: 12, color: INK_FAINT, fontStyle: "italic", marginTop: 4 }}>No substitutions</div>
                    )}
                  </div>
                ))}
              </div>
              {b.delivery_address && (
                <div style={{ marginTop: 10, fontFamily: FB, fontSize: 13, color: INK }}>
                  <span style={{ color: GOLD, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", fontSize: 10 }}>Delivery: </span>
                  {b.delivery_address}
                </div>
              )}
              {b.upcharge_total > 0 && (
                <div style={{ marginTop: 6, fontFamily: FB, fontSize: 13, color: PERSIMMON, fontStyle: "italic" }}>
                  Upcharge total: ${Number(b.upcharge_total).toFixed(2)}
                </div>
              )}
            </div>
          )}

          {b.service_type !== "dropoff" && b.service_type !== "datenight" && b.service_type !== "omakase" && Array.isArray(b.rolls_selected) && b.rolls_selected.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Rolls Selected</div>
              {["classics", "signatures", "specialty", "premium"].map((tier) => {
                const items = b.rolls_selected.filter((r) => r.tier === tier);
                if (!items.length) return null;
                return (
                  <div key={tier} style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: FB, fontSize: 10, color: TIER_COLORS[tier], letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{TIER_LABELS[tier]}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {items.map((r) => (
                        <span key={r.name} style={{ fontFamily: FB, fontSize: 13, color: INK, background: PAPER, border: `1px solid rgba(26,18,8,0.1)`, padding: "4px 10px" }}>
                          {r.name} × {r.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {Array.isArray(b.appetizers_ordered) && b.appetizers_ordered.length > 0 && (() => {
            const included = b.appetizers_ordered.filter((a) => (a.included_qty || 0) > 0);
            const extras   = b.appetizers_ordered.filter((a) => (a.extra_qty    || 0) > 0);
            return (
              <div style={{ marginBottom: 20 }}>
                {included.length > 0 && (
                  <>
                    <div style={{ fontFamily: FB, fontSize: 10, color: FOREST, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Included Appetizers</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                      {included.map((a) => (
                        <span key={`inc-${a.name}`} style={{ fontFamily: FB, fontSize: 13, color: FOREST, background: "rgba(45,74,58,0.07)", border: `1px solid rgba(45,74,58,0.2)`, padding: "4px 10px" }}>
                          {a.name} × {a.included_qty}
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {extras.length > 0 && (
                  <>
                    <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>Extra Appetizers</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {extras.map((a) => (
                        <span key={`ext-${a.name}`} style={{ fontFamily: FB, fontSize: 13, color: INK, background: PAPER, border: `1px solid rgba(26,18,8,0.1)`, padding: "4px 10px" }}>
                          {a.name} × {a.extra_qty}{a.extra_cost ? ` · $${Number(a.extra_cost).toFixed(0)}` : ""}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

          {(b.promo_code || b.discount_amount) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: FOREST, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 6 }}>Promo Applied</div>
              <div style={{ fontFamily: FB, fontSize: 14, color: INK, display: "flex", gap: 12, alignItems: "baseline" }}>
                {b.promo_code && <span style={{ fontFamily: FD, fontSize: 14, color: FOREST, fontWeight: 500, letterSpacing: "0.06em" }}>{b.promo_code}</span>}
                {b.discount_amount && <span style={{ color: FOREST }}>−{fmt2(b.discount_amount)}</span>}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, paddingTop: 4, borderTop: `1px solid rgba(26,18,8,0.06)` }}>
            {["pending", "confirmed", "cancelled"].map((s) => (
              <button key={s} onClick={() => onUpdateStatus(b.id, s)} style={{
                background: b.status === s ? STATUS_COLORS[s] : "transparent",
                color: b.status === s ? CREAM : INK_SOFT,
                border: `1px solid ${STATUS_COLORS[s]}`,
                padding: "6px 14px",
                fontFamily: FD,
                fontSize: 11,
                letterSpacing: "0.1em",
                textTransform: "capitalize",
                cursor: "pointer",
              }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: FB, fontSize: 14, color: INK }}>{value}</div>
    </div>
  );
}

// ============================================================
// LOGISTICS TAB
// ============================================================
function LogisticsTab({ bookings }) {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <LogisticsDetail booking={selected} onBack={() => setSelected(null)} />;
  }

  return <LogisticsSummary bookings={bookings} onSelect={setSelected} />;
}

// ---- Summary view ----
function LogisticsSummary({ bookings, onSelect }) {
  const now = new Date();

  const withRevenue = bookings.filter((b) => b.total_price != null && b.status !== "cancelled");
  const allCalc     = withRevenue.map((b) => ({ b, c: calcLogistics(b) }));
  const chefCalc    = allCalc.filter(({ b }) => b.service_type !== "dropoff");

  const totalRevenue   = allCalc.reduce((s, { c }) => s + c.total, 0);
  const totalFoodCost  = chefCalc.reduce((s, { c }) => s + c.totalFoodCost, 0);
  const totalGross     = chefCalc.reduce((s, { c }) => s + c.grossProfit, 0);
  const totalNet       = chefCalc.reduce((s, { c }) => s + c.netProfit, 0);
  const avgNetMargin   = chefCalc.length > 0 ? chefCalc.reduce((s, { c }) => s + c.netMargin, 0) / chefCalc.length : null;

  const upcoming = bookings
    .filter((b) => b.event_date && b.status !== "cancelled" && b.total_price != null)
    .map((b) => ({ b, c: calcLogistics(b) }))
    .filter(({ b }) => new Date(b.event_date + "T23:59:59") >= now)
    .sort((a, b_) => a.b.event_date.localeCompare(b_.b.event_date));

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";

  const pill = (color, text) => (
    <span style={{ background: color + "18", border: `1px solid ${color}44`, color, fontFamily: FD, fontSize: 12, padding: "2px 10px", letterSpacing: "0.04em" }}>
      {text}
    </span>
  );

  return (
    <div>
      {/* Aggregate stat cards */}
      <div className="admin-stat-grid admin-stat-grid-logistics" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 36 }}>
        {[
          { label: "Total Revenue",   value: fmt2(totalRevenue),  color: INDIGO,    kanji: "収" },
          { label: "Total Food Cost", value: fmt2(totalFoodCost), color: PERSIMMON, kanji: "材" },
          { label: "Gross Profit",    value: fmt2(totalGross),    color: FOREST,    kanji: "益" },
          { label: "Avg Net Margin",  value: fmtPct(avgNetMargin), color: GOLD,     kanji: "率" },
        ].map((s) => (
          <div key={s.label} style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, borderTop: `3px solid ${s.color}`, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.2em", textTransform: "uppercase" }}>{s.label}</div>
              <div style={{ fontFamily: FD, fontSize: 20, color: s.color, opacity: 0.3 }}>{s.kanji}</div>
            </div>
            <div style={{ fontFamily: FD, fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Net profit summary */}
      <div style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, borderLeft: `4px solid ${FOREST}`, padding: "16px 22px", marginBottom: 36, display: "flex", gap: 48 }}>
        <div>
          <div style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Total Net Profit (after labor)</div>
          <div style={{ fontFamily: FD, fontSize: 22, color: FOREST, fontWeight: 600 }}>{fmt2(totalNet)}</div>
        </div>
        <div>
          <div style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Events Analyzed</div>
          <div style={{ fontFamily: FD, fontSize: 22, color: INK, fontWeight: 600 }}>{allCalc.length}</div>
        </div>
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: FD, fontSize: 16, color: INK, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: PERSIMMON }}>次</span> Upcoming Events
          </div>
          <div className="admin-upcoming-table" style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, overflowX: "auto" }}>
            <div className="admin-upcoming-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", padding: "10px 18px", borderBottom: `1px solid rgba(26,18,8,0.06)` }}>
              {["Date", "Client", "Guests", "Revenue", "Food Cost", "Net Profit", ""].map((h) => (
                <div key={h} style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {upcoming.map(({ b, c }) => {
              const isDropoff = b.service_type === "dropoff";
              return (
                <div key={b.id} onClick={() => onSelect(b)} className="admin-upcoming-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", padding: "14px 18px", borderBottom: `1px solid rgba(26,18,8,0.04)`, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{fmtDate(b.event_date)}</div>
                  <div style={{ fontFamily: FB, fontSize: 13, color: INK_SOFT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.user_email}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{b.guest_count || "—"}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{fmt2(c.total)}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: isDropoff ? INK_FAINT : PERSIMMON }}>{isDropoff ? "—" : fmt2(c.totalFoodCost)}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: isDropoff ? INK_FAINT : (c.netProfit >= 0 ? FOREST : PERSIMMON) }}>{isDropoff ? "—" : fmt2(c.netProfit)}</div>
                  <div>{isDropoff ? pill(INDIGO, "Drop-Off") : pill(GOLD, fmtPct(c.netMargin))}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All bookings list */}
      <div>
        <div style={{ fontFamily: FD, fontSize: 16, color: INK, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: PERSIMMON }}>全</span> All Bookings
        </div>
        {allCalc.length === 0 ? (
          <div style={{ fontFamily: FB, fontSize: 15, color: INK_FAINT, fontStyle: "italic", padding: "40px 0" }}>No bookings with revenue data.</div>
        ) : (
          <div className="admin-all-bookings-table" style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, overflowX: "auto" }}>
            <div className="admin-all-bookings-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", padding: "10px 18px", borderBottom: `1px solid rgba(26,18,8,0.06)` }}>
              {["Client", "Event Date", "Pkg", "Guests", "Revenue", "Food Cost", "Gross", "Net", ""].map((h) => (
                <div key={h} style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {allCalc.map(({ b, c }) => {
              const isDropoff = b.service_type === "dropoff";
              return (
                <div key={b.id} onClick={() => onSelect(b)} className="admin-all-bookings-row" style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr 120px", padding: "13px 18px", borderBottom: `1px solid rgba(26,18,8,0.04)`, cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#fff"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div style={{ fontFamily: FB, fontSize: 13, color: INK_SOFT, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.user_email}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{fmtDate(b.event_date)}</div>
                  <div style={{ fontFamily: FB, fontSize: 12, color: isDropoff ? INDIGO : INK_FAINT }}>{isDropoff ? "Drop-Off" : ((b.package || "").charAt(8) || "—")}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{b.guest_count || "—"}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: INK }}>{fmt2(c.total)}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: isDropoff ? INK_FAINT : PERSIMMON }}>{isDropoff ? "—" : fmt2(c.totalFoodCost)}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: isDropoff ? INK_FAINT : FOREST }}>{isDropoff ? "—" : fmt2(c.grossProfit)}</div>
                  <div style={{ fontFamily: FD, fontSize: 13, color: isDropoff ? INK_FAINT : (c.netProfit >= 0 ? FOREST : PERSIMMON) }}>{isDropoff ? "—" : fmt2(c.netProfit)}</div>
                  <div>{isDropoff ? pill(INDIGO, "Drop-Off") : pill(c.netMargin >= 60 ? FOREST : c.netMargin >= 40 ? GOLD : PERSIMMON, fmtPct(c.netMargin))}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Per-booking detail view ----
function LogisticsDetail({ booking: b, onBack }) {
  const isDropoff = b.service_type === "dropoff";
  const c = calcLogistics(b);
  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—";

  const LSection = ({ title, kanji, color = GOLD, children }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 8, borderBottom: `1.5px solid rgba(26,18,8,0.07)` }}>
        <span style={{ fontFamily: FD, fontSize: 22, color: color || GOLD, opacity: 0.5 }}>{kanji}</span>
        <span style={{ fontFamily: FD, fontSize: 14, color: INK, letterSpacing: "0.04em" }}>{title}</span>
      </div>
      {children}
    </div>
  );

  const DataRow = ({ label, value, valueColor, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "7px 0", borderBottom: `1px dotted rgba(26,18,8,0.07)` }}>
      <span style={{ fontFamily: FB, fontSize: 13, color: INK_SOFT }}>{label}</span>
      <span style={{ fontFamily: FD, fontSize: bold ? 16 : 14, color: valueColor || INK, fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  );

  const marginColor = (m) => m >= 60 ? FOREST : m >= 40 ? GOLD : PERSIMMON;

  const dropoffUpchargeTotal = isDropoff && Array.isArray(b.platters_ordered)
    ? b.platters_ordered.reduce((sum, po) => {
        if (!Array.isArray(po.substitutions)) return sum;
        return sum + po.substitutions.reduce((s2, sub) =>
          s2 + (sub.upcharge_per_roll || 0) * (sub.slot_qty || 0) * (po.quantity || 0), 0);
      }, 0)
    : 0;

  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid rgba(26,18,8,0.2)`, color: INK_SOFT, padding: "7px 16px", fontFamily: FB, fontSize: 13, cursor: "pointer", marginBottom: 24 }}>
        ← Back to Logistics
      </button>

      {/* Booking header */}
      <div style={{ background: INDIGO_DARK, color: CREAM, padding: "20px 26px", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: FB, fontSize: 12, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>
            {isDropoff ? "Drop-Off Delivery" : (b.package || "—")}
          </div>
          <div style={{ fontFamily: FD, fontSize: 20, color: CREAM, fontWeight: 500 }}>{b.user_email}</div>
          <div style={{ fontFamily: FB, fontSize: 14, color: "rgba(245,236,217,0.6)", fontStyle: "italic", marginTop: 4 }}>
            {isDropoff
              ? fmtDate(b.event_date)
              : `${fmtDate(b.event_date)} · ${b.guest_count} guests`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: FD, fontSize: 26, color: PERSIMMON, fontWeight: 600 }}>{fmt2(c.total)}</div>
          <div style={{ fontFamily: FB, fontSize: 12, color: "rgba(245,236,217,0.5)", fontStyle: "italic" }}>
            Conf: {b.confirmation_number || "—"}
          </div>
        </div>
      </div>

      {isDropoff ? (
        /* ── Drop-off layout ── */
        <div className="admin-logistics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          <div>
            <LSection title="Revenue" kanji="収" color={FOREST}>
              <DataRow label="Total Revenue"     value={fmt2(c.total)}   valueColor={INK} bold />
              <DataRow label="Deposit Collected" value={fmt2(c.deposit)} />
              <DataRow label="Balance Due"       value={fmt2(c.balance)} valueColor={GOLD} />
            </LSection>

            <LSection title="Platters Ordered" kanji="配" color={INDIGO}>
              {Array.isArray(b.platters_ordered) && b.platters_ordered.length > 0 ? (
                <>
                  {b.platters_ordered.map((po, i) => (
                    <div key={i} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: `1px dotted rgba(26,18,8,0.07)` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontFamily: FD, fontSize: 14, color: INK, fontWeight: 500 }}>{po.quantity}× {po.platter_name}</span>
                        <span style={{ fontFamily: FD, fontSize: 14, color: INK }}>{fmt2(po.base_price * po.quantity)}</span>
                      </div>
                      {Array.isArray(po.substitutions) && po.substitutions.length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginLeft: 12, marginTop: 4 }}>
                          {po.substitutions.map((s, j) => {
                            const lineUpcharge = (s.upcharge_per_roll || 0) * (s.slot_qty || 0) * (po.quantity || 0);
                            return (
                              <div key={j} style={{ display: "flex", justifyContent: "space-between", fontFamily: FB, fontSize: 12, color: INK_SOFT, fontStyle: "italic" }}>
                                <span>{s.original_roll} → {s.replacement_roll}</span>
                                {lineUpcharge > 0
                                  ? <span style={{ color: PERSIMMON }}>+{fmt2(lineUpcharge)}</span>
                                  : <span style={{ color: FOREST }}>Free</span>}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, fontStyle: "italic", marginLeft: 12, marginTop: 2 }}>No substitutions</div>
                      )}
                    </div>
                  ))}
                  {dropoffUpchargeTotal > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 4px" }}>
                      <span style={{ fontFamily: FB, fontSize: 13, color: INK, fontWeight: 600 }}>Upcharge total</span>
                      <span style={{ fontFamily: FD, fontSize: 14, color: PERSIMMON, fontWeight: 600 }}>+{fmt2(dropoffUpchargeTotal)}</span>
                    </div>
                  )}
                  {b.delivery_address && (
                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: `1px solid rgba(26,18,8,0.08)` }}>
                      <div style={{ fontFamily: FB, fontSize: 10, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>Delivery Address</div>
                      <div style={{ fontFamily: FB, fontSize: 14, color: INK }}>{b.delivery_address}</div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ fontFamily: FB, fontSize: 13, color: INK_FAINT, fontStyle: "italic", padding: "8px 0" }}>No platter data saved.</div>
              )}
            </LSection>
          </div>
          <div />
        </div>
      ) : (
        /* ── Chef-attended layout ── */
        <div className="admin-logistics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {/* LEFT COLUMN */}
          <div>
            <LSection title="Revenue" kanji="収" color={FOREST}>
              <DataRow label="Total Revenue"   value={fmt2(c.total)}   valueColor={INK} bold />
              <DataRow label="Deposit Collected" value={fmt2(c.deposit)} />
              <DataRow label="Balance Due"     value={fmt2(c.balance)} valueColor={GOLD} />
            </LSection>

            <LSection title="Food Cost Breakdown" kanji="材" color={PERSIMMON}>
              {c.rollBreakdown.length > 0 ? (
                c.rollBreakdown.map((r) => (
                  <DataRow
                    key={r.name}
                    label={`${r.name} × ${r.qty}`}
                    value={r.lineCost != null ? fmt2(r.lineCost) : "—"}
                  />
                ))
              ) : (
                <div style={{ fontFamily: FB, fontSize: 13, color: INK_FAINT, fontStyle: "italic", padding: "8px 0" }}>No roll data saved for this booking.</div>
              )}
              {c.totalRolls > 0 && (
                <>
                  <DataRow label={`Rice seasoning (${c.totalRolls} rolls × $0.08)`} value={fmt2(c.riceSeasoningCost)} />
                  <DataRow label={`Condiments (${b.guest_count} guests × $0.23)`}   value={fmt2(c.condimentCost)} />
                </>
              )}
              {c.totalRolls === 0 && b.guest_count > 0 && (
                <DataRow label={`Condiments (${b.guest_count} guests × $0.23)`} value={fmt2(c.condimentCost)} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", borderTop: `1.5px solid rgba(26,18,8,0.1)`, marginTop: 4 }}>
                <span style={{ fontFamily: FB, fontSize: 13, color: INK, fontWeight: 600 }}>Total Food Cost</span>
                <span style={{ fontFamily: FD, fontSize: 16, color: PERSIMMON, fontWeight: 600 }}>{fmt2(c.totalFoodCost)}</span>
              </div>
            </LSection>

            <LSection title="Profitability" kanji="利" color={FOREST}>
              <DataRow label="Gross Profit (revenue − food cost)" value={fmt2(c.grossProfit)} valueColor={c.grossProfit >= 0 ? FOREST : PERSIMMON} />
              <DataRow label="Gross Margin"                        value={fmtPct(c.grossMargin)} valueColor={marginColor(c.grossMargin)} />
              <DataRow label={`Labor (${c.laborHours} hrs · helper only)`} value={fmt2(LABOR_COST)} />
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 4px", borderTop: `1.5px solid rgba(26,18,8,0.1)`, marginTop: 4 }}>
                <span style={{ fontFamily: FB, fontSize: 13, color: INK, fontWeight: 600 }}>Net Profit</span>
                <span style={{ fontFamily: FD, fontSize: 16, color: c.netProfit >= 0 ? FOREST : PERSIMMON, fontWeight: 600 }}>{fmt2(c.netProfit)}</span>
              </div>
              <div style={{ textAlign: "right", marginTop: 4 }}>
                <span style={{ fontFamily: FD, fontSize: 20, fontWeight: 600, color: marginColor(c.netMargin) }}>{fmtPct(c.netMargin)}</span>
                <span style={{ fontFamily: FB, fontSize: 12, color: INK_FAINT, marginLeft: 6 }}>net margin</span>
              </div>
            </LSection>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <LSection title="Condiments" kanji="薬" color={GOLD}>
              <DataRow label={`Wasabi (${b.guest_count} × $0.10)`}         value={fmt2((b.guest_count || 0) * 0.10)} />
              <DataRow label={`Pickled ginger (${b.guest_count} × $0.08)`} value={fmt2((b.guest_count || 0) * 0.08)} />
              <DataRow label={`Soy sauce (${b.guest_count} × $0.05)`}      value={fmt2((b.guest_count || 0) * 0.05)} />
              <DataRow label="Total condiment cost" value={fmt2(c.condimentCost)} bold />
            </LSection>

            <LSection title="Supplies Needed" kanji="備" color={INDIGO}>
              <DataRow label="Plates"            value={`${c.plates} plates`} />
              <DataRow label="Chopstick pairs"   value={`${c.chopsticks} pairs`} />
              <DataRow label="Soy sauce cups"    value={`${c.soySauceCups} cups`} />
              <DataRow label="Napkins"           value={`${c.napkins} napkins`} />
              <DataRow label="Nitrile gloves"    value={`${c.gloves} pairs`} />
              <DataRow label="Cutting boards"    value={`${c.cuttingBoards}`} />
              <DataRow label="Dry rice needed"   value={`${c.riceCups} cups (${c.totalRolls} rolls ÷ 3)`} bold />
            </LSection>

            <LSection title="Protein Order" kanji="魚" color={PLUM}>
              {[
                { key: "salmon",       label: "Salmon",        oz: c.fishOz.salmon },
                { key: "tuna",         label: "Tuna",          oz: c.fishOz.tuna },
                { key: "yellowtail",   label: "Yellowtail",    oz: c.fishOz.yellowtail },
                { key: "shrimp",       label: "Shrimp",        oz: c.fishOz.shrimp },
                { key: "smoked_salmon",label: "Smoked Salmon", oz: c.fishOz.smoked_salmon },
              ].filter(({ oz }) => oz > 0).map(({ label, oz }) => (
                <DataRow key={label} label={label} value={fmtOz(oz)} />
              ))}
              {Object.values(c.fishOz).every((v) => v === 0) && (
                <div style={{ fontFamily: FB, fontSize: 13, color: INK_FAINT, fontStyle: "italic", padding: "8px 0" }}>No roll data — order unknown.</div>
              )}
            </LSection>
          </div>
        </div>
      )}

      <EventChecklist bookingId={b.id} ingredients={calcIngredients(b, c)} isDropoff={isDropoff} />
    </div>
  );
}

// ============================================================
// EVENT CHECKLIST
// ============================================================
function useChecklist(bookingId) {
  const storageKey = `checklist_${bookingId}`;
  const [checked, setChecked] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); }
    catch { return {}; }
  });

  const toggle = (itemId) => {
    setChecked((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const reset = () => {
    setChecked({});
    try { localStorage.removeItem(storageKey); } catch {}
  };

  return [checked, toggle, reset];
}

function EventChecklist({ bookingId, ingredients, isDropoff }) {
  const [checked, toggle, reset] = useChecklist(bookingId);
  const [confirmReset, setConfirmReset] = useState(false);

  const foodItems    = isDropoff ? [] : buildFoodOrderItems(ingredients);
  const beforeItems  = PREP_DAY_BEFORE.map((text, i) => ({ id: `before_${i}`, text }));
  const dayOfItems   = PREP_DAY_OF.map((text, i) => ({ id: `dayof_${i}`, text }));

  const totalItems   = foodItems.length + beforeItems.length + dayOfItems.length;
  const totalChecked = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ marginTop: 36, borderTop: `2px solid rgba(26,18,8,0.08)`, paddingTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: FD, fontSize: 24, color: PERSIMMON, opacity: 0.4 }}>準</span>
          <span style={{ fontFamily: FD, fontSize: 18, color: INK }}>Event Preparation Checklist</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: FB, fontSize: 13, color: totalChecked === totalItems ? FOREST : INK_FAINT, fontStyle: "italic" }}>
            {totalChecked} of {totalItems} complete
          </span>
          {confirmReset ? (
            <span style={{ fontFamily: FB, fontSize: 12, color: INK_SOFT }}>
              Sure?{" "}
              <button onClick={() => { reset(); setConfirmReset(false); }} style={S.linkAction(PERSIMMON)}>Yes, reset</button>
              {" · "}
              <button onClick={() => setConfirmReset(false)} style={S.linkAction(INK_FAINT)}>Cancel</button>
            </span>
          ) : (
            <button onClick={() => setConfirmReset(true)} style={S.linkAction(INK_FAINT)}>Reset all</button>
          )}
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 4, background: "rgba(26,18,8,0.08)", marginBottom: 32, borderRadius: 2 }}>
        <div style={{ height: 4, background: totalChecked === totalItems ? FOREST : PERSIMMON, width: `${totalItems > 0 ? (totalChecked / totalItems) * 100 : 0}%`, borderRadius: 2, transition: "width 0.3s ease" }} />
      </div>

      <div className="admin-checklist-grid" style={{ display: "grid", gridTemplateColumns: isDropoff ? "1fr" : "1fr 1fr", gap: 32 }}>
        {!isDropoff && (
          <div>
            <ChecklistSection title="Food Ordering" kanji="材" items={foodItems} checked={checked} toggle={toggle} />
          </div>
        )}
        <div>
          <ChecklistSection title="Day Before" kanji="前" items={beforeItems} checked={checked} toggle={toggle} />
          <ChecklistSection title="Day Of" kanji="日" items={dayOfItems} checked={checked} toggle={toggle} />
        </div>
      </div>
    </div>
  );
}

function ChecklistSection({ title, kanji, items, checked, toggle }) {
  const completedCount = items.filter((item) => checked[item.id]).length;
  const allDone = completedCount === items.length && items.length > 0;

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `1.5px solid rgba(26,18,8,0.07)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: FD, fontSize: 18, color: GOLD, opacity: 0.45 }}>{kanji}</span>
          <span style={{ fontFamily: FD, fontSize: 13, color: INK, letterSpacing: "0.03em" }}>{title}</span>
        </div>
        <span style={{ fontFamily: FB, fontSize: 11, color: allDone ? FOREST : INK_FAINT, fontStyle: "italic" }}>
          {completedCount} / {items.length}
        </span>
      </div>

      {/* Section progress bar */}
      <div style={{ height: 2, background: "rgba(26,18,8,0.07)", marginBottom: 12, borderRadius: 1 }}>
        <div style={{ height: 2, background: allDone ? FOREST : GOLD, width: `${items.length > 0 ? (completedCount / items.length) * 100 : 0}%`, borderRadius: 1, transition: "width 0.25s ease" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {items.map((item) => {
          const done = !!checked[item.id];
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className="admin-checklist-item"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "10px 6px",
                background: done ? "rgba(45,74,58,0.04)" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background 0.15s",
                minHeight: 44,
              }}
            >
              {/* Custom checkbox */}
              <div className="admin-checklist-checkbox" style={{
                width: 18, height: 18, flexShrink: 0, marginTop: 2,
                border: `1.5px solid ${done ? FOREST : "rgba(26,18,8,0.25)"}`,
                background: done ? FOREST : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {done && <span style={{ color: CREAM, fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <span style={{
                  fontFamily: FB,
                  fontSize: 13,
                  color: done ? INK_FAINT : INK,
                  textDecoration: done ? "line-through" : "none",
                  lineHeight: 1.4,
                }}>
                  {item.text}
                </span>
                {item.detail && !done && (
                  <span style={{ fontFamily: FB, fontSize: 11, color: GOLD, fontStyle: "italic", marginLeft: 8 }}>
                    {item.detail}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// PROMO CODES TAB
// ============================================================
const EMPTY_FORM = { code: "", discount_type: "percent", discount_value: "", description: "", expires_at: "", max_uses: "" };

function PromoCodesTab({ promoCodes, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formError, setFormError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (pc) => {
    setForm({
      code: pc.code,
      discount_type: pc.discount_type,
      discount_value: String(pc.discount_value),
      description: pc.description || "",
      expires_at: pc.expires_at || "",
      max_uses: pc.max_uses != null ? String(pc.max_uses) : "",
    });
    setEditingId(pc.id);
    setFormError("");
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormError(""); };

  const saveForm = async () => {
    if (!form.code.trim()) { setFormError("Code is required"); return; }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) {
      setFormError("Discount value must be a positive number"); return;
    }
    setSaving(true);
    setFormError("");
    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      description: form.description.trim() || null,
      expires_at: form.expires_at || null,
      max_uses: form.max_uses !== "" ? Number(form.max_uses) : null,
    };
    const method = editingId ? "PATCH" : "POST";
    const body = editingId ? { id: editingId, ...payload } : payload;
    const res = await fetch("/api/admin/promo-codes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) { setFormError(data.error); return; }
    cancelForm();
    onRefresh();
  };

  const toggleActive = async (pc) => {
    await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: pc.id, active: !pc.active }),
    });
    onRefresh();
  };

  const deleteCode = async (id) => {
    await fetch("/api/admin/promo-codes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setDeleteConfirm(null);
    onRefresh();
  };

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const getRowColor = (pc) => {
    if (!pc.active) return INK_FAINT;
    if (pc.expires_at && pc.expires_at < today) return PERSIMMON;
    return FOREST;
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "10px 12px",
    border: `1.5px solid rgba(26,18,8,0.15)`, background: "#fff",
    fontFamily: FB, fontSize: 14, color: INK, outline: "none",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: FD, fontSize: 18, color: INK, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: PERSIMMON }}>割</span> Promo Codes
        </div>
        {!showForm && (
          <button onClick={openCreate} style={{
            background: INDIGO_DARK, color: CREAM, border: "none",
            padding: "10px 20px", fontFamily: FD, fontSize: 13,
            letterSpacing: "0.08em", cursor: "pointer",
          }}>
            + New Code
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.12)`, borderTop: `3px solid ${PERSIMMON}`, padding: "24px 28px", marginBottom: 28 }}>
          <div style={{ fontFamily: FD, fontSize: 15, color: INK, marginBottom: 20 }}>
            {editingId ? "Edit Promo Code" : "New Promo Code"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Discount Type *</label>
              <select
                value={form.discount_type}
                onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}
                style={{ ...inputStyle }}
              >
                <option value="percent">Percent Off (%)</option>
                <option value="flat">Flat Amount Off ($)</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                {form.discount_type === "percent" ? "Percent Off *" : "Amount Off ($) *"}
              </label>
              <input
                type="number"
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === "percent" ? "20" : "25"}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Max Uses (blank = unlimited)</label>
              <input
                type="number"
                min="1"
                value={form.max_uses}
                onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))}
                placeholder="Unlimited"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Expires On (optional)</label>
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                style={{ ...inputStyle, colorScheme: "light" }}
              />
            </div>
            <div>
              <label style={{ fontFamily: FB, fontSize: 11, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description (admin note)</label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Internal note..."
                style={inputStyle}
              />
            </div>
          </div>
          {formError && (
            <div style={{ fontFamily: FB, fontSize: 13, color: PERSIMMON, marginBottom: 14 }}>{formError}</div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveForm} disabled={saving} style={{
              background: PERSIMMON, color: CREAM, border: "none",
              padding: "10px 22px", fontFamily: FD, fontSize: 13,
              letterSpacing: "0.08em", cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={cancelForm} style={{
              background: "transparent", border: `1px solid rgba(26,18,8,0.2)`,
              color: INK_SOFT, padding: "10px 18px", fontFamily: FB,
              fontSize: 13, cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {promoCodes.length === 0 && !showForm ? (
        <div style={{ fontFamily: FB, fontSize: 15, color: INK_FAINT, fontStyle: "italic", padding: "40px 0", textAlign: "center" }}>
          No promo codes yet. Create one to get started.
        </div>
      ) : (
        <div style={{ background: PAPER, border: `1px solid rgba(26,18,8,0.08)`, overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 0.9fr 0.7fr 1fr", padding: "10px 18px", borderBottom: `1px solid rgba(26,18,8,0.08)`, minWidth: 700 }}>
            {["Code", "Type", "Value", "Uses", "Max Uses", "Expires", "Active", "Actions"].map((h) => (
              <div key={h} style={{ fontFamily: FB, fontSize: 10, color: INK_FAINT, letterSpacing: "0.15em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {promoCodes.map((pc) => {
            const isExpired = pc.expires_at && pc.expires_at < today;
            const rowColor = getRowColor(pc);
            return (
              <div key={pc.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.8fr 0.7fr 0.7fr 0.9fr 0.7fr 1fr", padding: "13px 18px", borderBottom: `1px solid rgba(26,18,8,0.04)`, alignItems: "center", minWidth: 700 }}>
                <div style={{ fontFamily: FD, fontSize: 14, color: rowColor, fontWeight: 500, letterSpacing: "0.05em" }}>{pc.code}</div>
                <div style={{ fontFamily: FB, fontSize: 13, color: INK_SOFT }}>
                  {pc.discount_type === "percent" ? "Percent" : "Flat"}
                </div>
                <div style={{ fontFamily: FD, fontSize: 14, color: INK }}>
                  {pc.discount_type === "percent" ? `${pc.discount_value}%` : `$${Number(pc.discount_value).toFixed(2)}`}
                </div>
                <div style={{ fontFamily: FB, fontSize: 13, color: INK }}>{pc.uses_count || 0}</div>
                <div style={{ fontFamily: FB, fontSize: 13, color: INK_SOFT }}>{pc.max_uses ?? "∞"}</div>
                <div style={{ fontFamily: FB, fontSize: 13, color: isExpired ? PERSIMMON : INK_SOFT }}>{fmtDate(pc.expires_at)}</div>
                <div>
                  <button onClick={() => toggleActive(pc)} style={{
                    background: pc.active ? "rgba(45,74,58,0.12)" : "rgba(26,18,8,0.06)",
                    border: `1px solid ${pc.active ? FOREST : "rgba(26,18,8,0.15)"}`,
                    color: pc.active ? FOREST : INK_FAINT,
                    padding: "4px 10px", fontFamily: FB, fontSize: 12,
                    cursor: "pointer", letterSpacing: "0.04em",
                  }}>
                    {pc.active ? "Active" : "Off"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(pc)} style={{
                    background: "transparent", border: `1px solid rgba(26,18,8,0.2)`,
                    color: INK_SOFT, padding: "4px 12px", fontFamily: FB,
                    fontSize: 12, cursor: "pointer",
                  }}>Edit</button>
                  {deleteConfirm === pc.id ? (
                    <span style={{ fontFamily: FB, fontSize: 12, color: INK_SOFT }}>
                      Sure?{" "}
                      <button onClick={() => deleteCode(pc.id)} style={{ background: "none", border: "none", color: PERSIMMON, fontFamily: FB, fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>Yes</button>
                      {" / "}
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "none", border: "none", color: INK_FAINT, fontFamily: FB, fontSize: 12, cursor: "pointer", padding: 0 }}>No</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleteConfirm(pc.id)} style={{
                      background: "transparent", border: `1px solid rgba(197,85,45,0.3)`,
                      color: PERSIMMON, padding: "4px 12px", fontFamily: FB,
                      fontSize: 12, cursor: "pointer",
                    }}>Delete</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Minimal style helper for inline link-style buttons
const S = {
  linkAction: (color) => ({
    background: "transparent", border: "none", color, fontFamily: FB,
    fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline",
  }),
};
