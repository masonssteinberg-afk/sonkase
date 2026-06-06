"use client";
import { useState, useEffect } from "react";

const ADMIN_PW = "prettyyoungthing";
const AUTH_KEY = "sk_admin_authed";

// ── Site palette (matches the live site exactly) ──────────────────────────────
const BG    = "#0d0d0d";
const BG2   = "#141414";
const BG3   = "#1c1c1c";
const GOLD  = "#E8C97E";
const GOLD2 = "#b8892a";
const CREAM = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.55)";
const FAINT = "rgba(245,240,232,0.28)";
const BORDER  = "rgba(232,201,126,0.14)";
const BORDER2 = "rgba(232,201,126,0.30)";
const GREEN = "#4a9a6a";
const RED   = "#c5552d";
const F = `'Shippori Mincho', Georgia, serif`;

const STATUS_COLORS = { confirmed: GREEN, pending: GOLD2, cancelled: RED };
const TIER_COLORS   = { classics: GREEN, signatures: GOLD2, specialty: "#6baed6", premium: "#9b59b6" };
const TIER_LABELS   = { classics: "Classics", signatures: "Signatures", specialty: "Specialty", premium: "Premium" };

const fmt2   = (n) => (n != null ? "$" + Number(n).toFixed(2) : "—");
const fmtPct = (n) => (n != null ? n.toFixed(1) + "%" : "—");
const fmtOz  = (n) => n > 0 ? `${n.toFixed(1)} oz (${(n / 16).toFixed(2)} lb)` : "0 oz";

// ── Roll cost & protein data (unchanged) ──────────────────────────────────────
const ROLL_COSTS = {
  "Cucumber": 0.50, "Avocado": 0.94, "Sweet Potato": 0.59, "California": 1.57,
  "Salmon Avocado": 2.25, "Tuna Avocado": 1.44, "Spicy Krab": 0.89,
  "Philadelphia": 2.00, "Garden": 1.05, "Spicy Veggie": 1.05,
  "Florida": 2.97, "So Down": 2.95, "Spicy Roll": 0.99, "Bagel": 2.00,
  "Isaac's": 2.02, "Stacey's Way": 3.14, "Groove": 1.13, "Swamp": 1.19,
  "Go Gator": 3.03, "Jibboo": 1.94, "Reba's": 2.27, "Haushinka's": 2.72,
  "Archer Road": 1.49, "Orlando": 1.51, "Gabi's": 3.76, "Steinberg": 4.19,
  "Foam": 2.67, "Black Pearl": 1.88,
  "Trust Me": 4.29, "Sunset": 2.60, "Hamachi Crudo": 3.31, "Smoke Show": 2.00,
  "Tropic": 1.19, "West Palm": 2.32,
};

const ROLL_PROTEINS = {
  "Salmon Avocado":  { salmon: 1 }, "Philadelphia": { salmon: 1 },
  "Florida":         { salmon: 1, tuna: 1 }, "So Down": { salmon: 1, tuna: 1 },
  "Stacey's Way":    { salmon: 1, tuna: 1 }, "Bagel": { smoked_salmon: 1 },
  "Go Gator":        { salmon: 1, shrimp: 1 }, "Gabi's": { salmon: 2 },
  "Steinberg":       { salmon: 1, tuna: 1, yellowtail: 1 }, "Sunset": { salmon: 1 },
  "Smoke Show":      { smoked_salmon: 1, tuna: 1 }, "Trust Me": { salmon: 1, yellowtail: 1 },
  "Haushinka's":     { salmon: 1 }, "Tuna Avocado": { tuna: 1 }, "Spicy Roll": { tuna: 1 },
  "Isaac's":         { tuna: 1, yellowtail: 1 }, "Archer Road": { tuna: 1, shrimp: 1 },
  "Foam":            { tuna: 1, yellowtail: 1 }, "Black Pearl": { tuna: 2 },
  "Reba's":          { yellowtail: 1 }, "West Palm": { yellowtail: 2 },
  "Hamachi Crudo":   { yellowtail: 2 }, "Jibboo": { shrimp: 1 }, "Orlando": { shrimp: 1 },
};

const ROLL_INGREDIENT_QTY = {
  "Cucumber":      { cucumber: 0.25 }, "Avocado": { avocado: 0.5 },
  "California":    { krab: 2, avocado: 0.5, cucumber: 0.25, masago: 5 },
  "Salmon Avocado":{ avocado: 0.5 }, "Tuna Avocado": { avocado: 0.5 },
  "Spicy Krab":    { krab: 2, spicy_mayo: true },
  "Philadelphia":  { cream_cheese: 1, cucumber: 0.25 },
  "Garden":        { avocado: 0.5, cucumber: 0.25 }, "Spicy Veggie": { avocado: 0.5, cucumber: 0.25 },
  "Florida":       { avocado: 0.5, masago: 5 }, "So Down": { avocado: 0.5, spicy_mayo: true },
  "Spicy Roll":    { spicy_mayo: true }, "Bagel": { cream_cheese: 1, cucumber: 0.25 },
  "Isaac's":       { spicy_mayo: true }, "Stacey's Way": { avocado: 0.5, cream_cheese: 1 },
  "Groove":        { avocado: 0.5, cream_cheese: 1, eel_sauce: true },
  "Swamp":         { avocado: 0.5, mango: 0.25 }, "Go Gator": { avocado: 0.5, tobiko: 5 },
  "Jibboo":        { krab: 2, avocado: 0.5, cucumber: 0.25 }, "Reba's": { krab: 2, mango: 0.25 },
  "Haushinka's":   { avocado: 0.5, cream_cheese: 1, tobiko: 5, eel_sauce: true },
  "Archer Road":   { spicy_mayo: true }, "Orlando": { krab: 2, cream_cheese: 1, masago: 5 },
  "Gabi's":        { eel_sauce: true }, "Steinberg": { avocado: 0.5, cucumber: 0.25 },
  "Foam":          { avocado: 0.5, spicy_mayo: true }, "Black Pearl": { tobiko: 5, cucumber: 0.25 },
  "Trust Me":      { avocado: 0.5, tobiko: 5 }, "Sunset": { avocado: 0.5, mango: 0.25 },
  "Hamachi Crudo": { avocado: 0.5, cucumber: 0.25 },
  "Smoke Show":    { cream_cheese: 1, cucumber: 0.25, avocado: 0.5 },
  "Tropic":        { avocado: 0.5, cucumber: 0.25, mango: 0.25, cream_cheese: 1 },
  "West Palm":     { avocado: 0.5, mango: 0.25, eel_sauce: true },
};

const RICE_SEASONING_PER_ROLL = 0.08;
const CONDIMENT_PER_GUEST     = 0.23;
const LABOR_COST              = 70;

function calcLogistics(booking) {
  const rolls  = Array.isArray(booking.rolls_selected) ? booking.rolls_selected : [];
  const guests = Number(booking.guest_count) || 0;
  const total  = Number(booking.total_price) || 0;
  const deposit = Number(booking.deposit_amount) || 0;
  const balance = total - deposit;

  let rollFoodCost = 0, totalRolls = 0;
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
    for (const [k, v] of Object.entries(p)) { if (k in proteins) proteins[k] += v * r.qty; }
  });

  return {
    total, deposit, balance, rollFoodCost, riceSeasoningCost, condimentCost, totalFoodCost,
    grossProfit, grossMargin, laborHours, netProfit, netMargin, totalRolls, rollBreakdown,
    plates: guests * 3, chopsticks: guests, soySauceCups: guests, napkins: guests * 3,
    gloves: 4, cuttingBoards: 2, riceCups: Math.ceil(totalRolls / 3),
    proteins,
    fishOz: {
      salmon: proteins.salmon * 1.5, tuna: proteins.tuna * 1.5,
      yellowtail: proteins.yellowtail * 1.5, shrimp: proteins.shrimp * 2,
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
  return { ...totals, salmon: calc.fishOz.salmon, tuna: calc.fishOz.tuna, yellowtail: calc.fishOz.yellowtail, shrimp: calc.fishOz.shrimp, smoked_salmon: calc.fishOz.smoked_salmon, nori: calc.totalRolls, rice: calc.riceCups, guests };
}

function buildFoodOrderItems(ing) {
  const lbs = (oz) => oz >= 16 ? `${(oz / 16).toFixed(2)} lb` : `${oz.toFixed(1)} oz`;
  const items = [];
  if (ing.salmon > 0)        items.push({ id: "order_salmon",        text: "Order salmon",                     detail: `~${lbs(ing.salmon)} needed` });
  if (ing.tuna > 0)          items.push({ id: "order_tuna",          text: "Order tuna",                       detail: `~${lbs(ing.tuna)} needed` });
  if (ing.yellowtail > 0)    items.push({ id: "order_yellowtail",    text: "Order yellowtail",                 detail: `~${lbs(ing.yellowtail)} needed` });
  if (ing.shrimp > 0)        items.push({ id: "order_shrimp",        text: "Order shrimp",                     detail: `~${lbs(ing.shrimp)} needed` });
  if (ing.krab > 0)          items.push({ id: "order_krab",          text: "Order imitation krab",             detail: `~${lbs(ing.krab)} needed` });
  if (ing.smoked_salmon > 0) items.push({ id: "order_smoked_salmon", text: "Order smoked salmon",              detail: `~${lbs(ing.smoked_salmon)} needed` });
  if (ing.avocado > 0)       items.push({ id: "check_avocado",       text: "Check avocado stock",              detail: `${Math.ceil(ing.avocado)} avocados` });
  if (ing.cream_cheese > 0)  items.push({ id: "check_cream_cheese",  text: "Check cream cheese",               detail: `${Math.round(ing.cream_cheese)} oz` });
  if (ing.masago > 0)        items.push({ id: "check_masago",        text: "Check masago",                     detail: `${Math.round(ing.masago)} g` });
  if (ing.tobiko > 0)        items.push({ id: "check_tobiko",        text: "Check tobiko / blue tobiko",        detail: `${Math.round(ing.tobiko)} g` });
  if (ing.cucumber > 0)      items.push({ id: "check_cucumber",      text: "Check cucumber",                   detail: `${Math.ceil(ing.cucumber)} cucumbers` });
  if (ing.mango > 0)         items.push({ id: "check_mango",         text: "Check mango",                      detail: `${Math.ceil(ing.mango)} mangoes` });
  if (ing.nori > 0)          items.push({ id: "check_nori",          text: "Check nori",                       detail: `${ing.nori} sheets` });
  if (ing.rice > 0)          items.push({ id: "check_rice",          text: "Check sushi rice",                 detail: `${ing.rice} cups dry` });
  if (ing.eel_sauce)         items.push({ id: "check_eel_sauce",     text: "Check eel sauce",                  detail: null });
  items.push({ id: "check_wasabi",       text: "Check wasabi",             detail: `${ing.guests} guests` });
  items.push({ id: "check_ginger",       text: "Check pickled ginger",     detail: `${ing.guests} guests` });
  items.push({ id: "check_soy",          text: "Check soy sauce",          detail: `${ing.guests} guests` });
  items.push({ id: "check_rice_vinegar", text: "Check rice vinegar",       detail: null });
  items.push({ id: "check_kombu",        text: "Check kombu",              detail: null });
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

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed]       = useState(false);
  const [loading, setLoading]     = useState(true);
  const [bookings, setBookings]   = useState([]);
  const [filter, setFilter]       = useState("all");
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
    const res  = await fetch("/api/admin/promo-codes");
    const data = await res.json();
    setPromoCodes(data.promoCodes || []);
  };

  useEffect(() => { if (authed) fetchAllBookings(); }, [authed]);
  useEffect(() => { if ((activeTab === "promo" || activeTab === "banner") && authed) fetchPromoCodes(); }, [activeTab, authed]);

  const updateStatus = async (id, status) => {
    const res  = await fetch("/api/admin/update-booking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    const data = await res.json();
    if (data.success) setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b));
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);
  const counts   = {
    all: bookings.length,
    pending:   bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  if (loading) return null;
  if (!authed) return <PasswordScreen onAuth={() => { localStorage.setItem(AUTH_KEY, "1"); setAuthed(true); }} />;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: CREAM, fontFamily: F, overflowX: "hidden" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${BG2}; }
        ::-webkit-scrollbar-thumb { background: ${GOLD2}; opacity: 0.4; }

        .atab { transition: color 0.2s, border-color 0.2s; }
        .atab:hover { color: ${CREAM} !important; }

        .arow:hover { background: ${BG3} !important; }
        .abtn:hover { opacity: 0.8; }

        @media (max-width: 768px) {
          .admin-stat-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-filter-row { flex-wrap: wrap !important; }
          .admin-main { padding: 20px 14px 60px !important; }
          .admin-booking-row { display: flex !important; flex-direction: column !important; padding: 14px 16px !important; gap: 6px !important; }
          .admin-detail-grid { grid-template-columns: 1fr 1fr !important; }
          .admin-logistics-grid { grid-template-columns: 1fr !important; }
          .admin-checklist-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, background: BG, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="120" height="34">
                <g transform="translate(18, 10) scale(0.9)">
                  <line x1="35" y1="12" x2="42" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="55" y1="12" x2="48" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="45" cy="19" r="3" fill="#b8892a"/>
                  <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke="#b8892a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke="#b8892a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"/>
                  <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke="#b8892a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.22"/>
                </g>
                <line x1="118" y1="28" x2="118" y2="112" stroke="#b8892a" strokeWidth="0.7" opacity="0.6"/>
                <text x="138" y="88" fontFamily="'Shippori Mincho', serif" fontWeight="400" fontSize="52" letterSpacing="11" fill="#e6dac8">sonakase</text>
              </svg>
            </a>
            <div style={{ width: 1, height: 28, background: BORDER2 }} />
            <span style={{ fontFamily: F, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: FAINT }}>admin</span>
          </div>
          <button
            onClick={() => { localStorage.removeItem(AUTH_KEY); window.location.reload(); }}
            style={{ background: "transparent", border: `1px solid ${BORDER}`, color: FAINT, padding: "7px 16px", fontFamily: F, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}
          >
            lock
          </button>
        </div>
      </header>

      <main className="admin-main" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 32px 100px" }}>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 48, borderBottom: `1px solid ${BORDER}` }}>
          {[
            { key: "bookings",  label: "bookings" },
            { key: "logistics", label: "logistics" },
            { key: "promo",     label: "promo codes" },
            { key: "banner",    label: "banner" },
          ].map((t) => (
            <button key={t.key} className="atab" onClick={() => setActiveTab(t.key)} style={{
              background: "transparent",
              color: activeTab === t.key ? GOLD : FAINT,
              border: "none",
              borderBottom: activeTab === t.key ? `1px solid ${GOLD}` : "1px solid transparent",
              padding: "14px 28px",
              fontFamily: F, fontSize: 12,
              letterSpacing: "0.18em", textTransform: "uppercase",
              cursor: "pointer", marginBottom: -1,
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "bookings" && (
          <BookingsTab
            bookings={bookings}
            filtered={filtered}
            counts={counts}
            filter={filter}
            setFilter={setFilter}
            onUpdateStatus={updateStatus}
            onRefresh={fetchAllBookings}
          />
        )}
        {activeTab === "logistics"  && <LogisticsTab bookings={bookings} />}
        {activeTab === "promo"      && <PromoCodesTab promoCodes={promoCodes} onRefresh={fetchPromoCodes} />}
        {activeTab === "banner"     && <BannerTab promoCodes={promoCodes} />}
      </main>
    </div>
  );
}

// ── Password screen ───────────────────────────────────────────────────────────
function PasswordScreen({ onAuth }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (value === ADMIN_PW) { onAuth(); }
    else { setShake(true); setValue(""); setTimeout(() => setShake(false), 500); }
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        .pw-shake { animation: shake 0.4s ease; }
        .pw-input:focus { outline: none; border-bottom-color: ${GOLD} !important; }
      `}</style>
      <input
        className={`pw-input${shake ? " pw-shake" : ""}`}
        type="password" value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && attempt()}
        autoFocus placeholder="••••••••"
        style={{
          background: "transparent", border: "none",
          borderBottom: `1px solid ${BORDER2}`,
          color: CREAM, fontFamily: F, fontSize: 18,
          letterSpacing: "0.3em", padding: "12px 0",
          width: 220, textAlign: "center",
        }}
      />
    </div>
  );
}

// ── Bookings tab ──────────────────────────────────────────────────────────────
function BookingsTab({ bookings, filtered, counts, filter, setFilter, onUpdateStatus, onRefresh }) {
  const [clearing, setClearing]   = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const clearAll = async () => {
    setClearing(true);
    const res  = await fetch("/api/admin/clear-bookings", { method: "DELETE" });
    const data = await res.json();
    setClearing(false);
    setConfirmClear(false);
    if (data.success) onRefresh();
  };

  return (
    <>
      {/* Stat cards */}
      <div className="admin-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 40 }}>
        {[
          { label: "Total",     count: counts.all,       color: CREAM },
          { label: "Pending",   count: counts.pending,   color: GOLD },
          { label: "Confirmed", count: counts.confirmed, color: GREEN },
          { label: "Cancelled", count: counts.cancelled, color: RED },
        ].map((s) => (
          <div key={s.label} style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "28px 28px 24px" }}>
            <div style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontFamily: F, fontSize: 44, color: s.color, lineHeight: 1, fontWeight: 400 }}>{s.count}</div>
          </div>
        ))}
      </div>

      {/* Filter + clear */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="admin-filter-row" style={{ display: "flex", gap: 2 }}>
          {["all", "pending", "confirmed", "cancelled"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              background: filter === f ? GOLD : "transparent",
              color: filter === f ? BG : FAINT,
              border: `1px solid ${filter === f ? GOLD : BORDER}`,
              padding: "8px 18px", fontFamily: F, fontSize: 11,
              letterSpacing: "0.15em", textTransform: "capitalize",
              cursor: "pointer",
            }}>
              {f}{f !== "all" && ` (${counts[f]})`}
            </button>
          ))}
        </div>
        <div>
          {confirmClear ? (
            <span style={{ fontFamily: F, fontSize: 12, color: MUTED }}>
              Delete all {bookings.length} bookings?{" "}
              <button onClick={clearAll} disabled={clearing} style={{ background: "none", border: "none", color: RED, fontFamily: F, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
                {clearing ? "clearing…" : "yes, clear"}
              </button>
              {" · "}
              <button onClick={() => setConfirmClear(false)} style={{ background: "none", border: "none", color: FAINT, fontFamily: F, fontSize: 12, cursor: "pointer" }}>cancel</button>
            </span>
          ) : (
            <button onClick={() => setConfirmClear(true)} style={{
              background: "transparent", border: `1px solid rgba(197,85,45,0.3)`,
              color: RED, padding: "8px 16px", fontFamily: F,
              fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
            }}>
              clear all
            </button>
          )}
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 0", fontFamily: F, fontSize: 14, color: FAINT, fontStyle: "italic" }}>
          No bookings.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {filtered.map((b) => <BookingRow key={b.id} booking={b} onUpdateStatus={onUpdateStatus} />)}
        </div>
      )}
    </>
  );
}

// ── Booking row ───────────────────────────────────────────────────────────────
function BookingRow({ booking: b, onUpdateStatus }) {
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLORS[b.status] || FAINT;
  const fmt = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div style={{ background: BG2, borderLeft: `2px solid ${statusColor}` }}>
      <div
        onClick={() => setOpen((o) => !o)}
        className="admin-booking-row arow"
        style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr 100px 32px", alignItems: "center", padding: "18px 24px", gap: 16, cursor: "pointer", transition: "background 0.15s" }}
      >
        <div>
          <div style={{ fontFamily: F, fontSize: 13, color: CREAM, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.user_email}</div>
          <div style={{ fontFamily: F, fontSize: 11, color: FAINT, marginTop: 3 }}>
            {b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
          </div>
        </div>
        <div style={{ fontFamily: F, fontSize: 13, color: MUTED }}>{b.package || "—"}</div>
        <div style={{ fontFamily: F, fontSize: 13, color: MUTED }}>{fmt(b.event_date)}</div>
        <div style={{ fontFamily: F, fontSize: 13, color: MUTED }}>{b.guest_count ? `${b.guest_count} guests` : "—"}</div>
        <div>
          <span style={{ fontFamily: F, fontSize: 10, letterSpacing: "0.15em", textTransform: "capitalize", color: statusColor }}>
            {b.status}
          </span>
        </div>
        <div style={{ color: FAINT, textAlign: "right", fontSize: 10 }}>{open ? "▴" : "▾"}</div>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 28px", background: BG3 }}>
          <div className="admin-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 24 }}>
            <D label="Service Type" value={b.service_type === "dropoff" ? "Drop-Off" : b.service_type === "datenight" ? "Date Night" : b.service_type === "omakase" ? "Omakase" : "Chef-Attended"} />
            <D label="Confirmation" value={b.confirmation_number || "—"} />
            <D label="Booking ID"   value={b.id} small />
            <D label="Total"        value={fmt2(b.total_price) || "—"} />
            <D label="Deposit"      value={fmt2(b.deposit_amount) || "—"} />
            <D label="Balance Due"  value={b.total_price != null && b.deposit_amount != null ? fmt2(Number(b.total_price) - Number(b.deposit_amount)) : "—"} highlight />
            {b.promo_code && <D label="Promo Code" value={b.promo_code} />}
            {b.discount_amount != null && <D label="Discount" value={`−${fmt2(b.discount_amount)}`} />}
          </div>

          {b.service_type === "omakase" && b.appetizers_selected?.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Label>Appetizers</Label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {b.appetizers_selected.map((a) => <Tag key={a}>{a}</Tag>)}
              </div>
            </div>
          )}

          {b.service_type === "datenight" && (
            <div style={{ marginBottom: 20, display: "flex", gap: 12 }}>
              <div style={{ flex: 1, background: BG2, border: `1px solid ${BORDER}`, padding: "14px 18px" }}>
                <Label>Appetizer</Label>
                <div style={{ fontFamily: F, fontSize: 13, color: CREAM, marginTop: 6 }}>{b.appetizer_choice || "—"}</div>
              </div>
              <div style={{ flex: 1, background: BG2, border: `1px solid ${BORDER}`, padding: "14px 18px" }}>
                <Label>Guests</Label>
                <div style={{ fontFamily: F, fontSize: 13, color: CREAM, marginTop: 6 }}>2 · Chef chooses 5 rolls</div>
              </div>
            </div>
          )}

          {b.service_type !== "datenight" && b.service_type !== "omakase" && Array.isArray(b.rolls_selected) && b.rolls_selected.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Label>Rolls Selected</Label>
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {["classics", "signatures", "specialty", "premium"].map((tier) => {
                  const items = b.rolls_selected.filter((r) => r.tier === tier);
                  if (!items.length) return null;
                  return (
                    <div key={tier}>
                      <div style={{ fontFamily: F, fontSize: 10, color: TIER_COLORS[tier], letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>{TIER_LABELS[tier]}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {items.map((r) => <Tag key={r.name}>{r.name} × {r.qty}</Tag>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {Array.isArray(b.appetizers_ordered) && b.appetizers_ordered.length > 0 && (() => {
            const included = b.appetizers_ordered.filter((a) => (a.included_qty || 0) > 0);
            const extras   = b.appetizers_ordered.filter((a) => (a.extra_qty    || 0) > 0);
            return (
              <div style={{ marginBottom: 20 }}>
                {included.length > 0 && (
                  <><Label>Included Appetizers</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 12px" }}>
                    {included.map((a) => <Tag key={`inc-${a.name}`} color={GREEN}>{a.name} × {a.included_qty}</Tag>)}
                  </div></>
                )}
                {extras.length > 0 && (
                  <><Label>Extra Appetizers</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {extras.map((a) => <Tag key={`ext-${a.name}`}>{a.name} × {a.extra_qty}{a.extra_cost ? ` · $${Number(a.extra_cost).toFixed(0)}` : ""}</Tag>)}
                  </div></>
                )}
              </div>
            );
          })()}

          {b.special_requests && (
            <div style={{ marginBottom: 20 }}>
              <Label>Chef's Notes</Label>
              <div style={{ fontFamily: F, fontSize: 13, color: MUTED, fontStyle: "italic", marginTop: 6 }}>{b.special_requests}</div>
            </div>
          )}

          {/* Status buttons */}
          <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            {["pending", "confirmed", "cancelled"].map((s) => (
              <button key={s} onClick={() => onUpdateStatus(b.id, s)} style={{
                background: b.status === s ? STATUS_COLORS[s] : "transparent",
                color: b.status === s ? BG : FAINT,
                border: `1px solid ${STATUS_COLORS[s]}`,
                padding: "7px 16px", fontFamily: F, fontSize: 11,
                letterSpacing: "0.12em", textTransform: "capitalize", cursor: "pointer",
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

// ── Small helpers ─────────────────────────────────────────────────────────────
function D({ label, value, small, highlight }) {
  return (
    <div>
      <div style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F, fontSize: small ? 11 : 13, color: highlight ? GOLD : CREAM, wordBreak: small ? "break-all" : "normal" }}>{value}</div>
    </div>
  );
}

function Label({ children }) {
  return <div style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.25em", textTransform: "uppercase" }}>{children}</div>;
}

function Tag({ children, color }) {
  return (
    <span style={{ fontFamily: F, fontSize: 12, color: color || MUTED, background: BG2, border: `1px solid ${BORDER}`, padding: "4px 12px" }}>
      {children}
    </span>
  );
}

// ── Logistics tab ─────────────────────────────────────────────────────────────
function LogisticsTab({ bookings }) {
  const [selected, setSelected] = useState(null);
  if (selected) return <LogisticsDetail booking={selected} onBack={() => setSelected(null)} />;
  return <LogisticsSummary bookings={bookings} onSelect={setSelected} />;
}

function LogisticsSummary({ bookings, onSelect }) {
  const now = new Date();
  const withRevenue = bookings.filter((b) => b.total_price != null && b.status !== "cancelled");
  const allCalc     = withRevenue.map((b) => ({ b, c: calcLogistics(b) }));
  const chefCalc    = allCalc.filter(({ b }) => b.service_type !== "dropoff");

  const totalRevenue  = allCalc.reduce((s, { c }) => s + c.total, 0);
  const totalFoodCost = chefCalc.reduce((s, { c }) => s + c.totalFoodCost, 0);
  const totalGross    = chefCalc.reduce((s, { c }) => s + c.grossProfit, 0);
  const totalNet      = chefCalc.reduce((s, { c }) => s + c.netProfit, 0);
  const avgNetMargin  = chefCalc.length > 0 ? chefCalc.reduce((s, { c }) => s + c.netMargin, 0) / chefCalc.length : null;

  const upcoming = bookings
    .filter((b) => b.event_date && b.status !== "cancelled" && b.total_price != null)
    .map((b) => ({ b, c: calcLogistics(b) }))
    .filter(({ b }) => new Date(b.event_date + "T23:59:59") >= now)
    .sort((a, b_) => a.b.event_date.localeCompare(b_.b.event_date));

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "—";

  return (
    <div>
      {/* Stats */}
      <div className="admin-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginBottom: 40 }}>
        {[
          { label: "Revenue",      value: fmt2(totalRevenue),   color: CREAM },
          { label: "Food Cost",    value: fmt2(totalFoodCost),  color: RED },
          { label: "Gross Profit", value: fmt2(totalGross),     color: GREEN },
          { label: "Avg Net Margin", value: fmtPct(avgNetMargin), color: GOLD },
        ].map((s) => (
          <div key={s.label} style={{ background: BG2, border: `1px solid ${BORDER}`, padding: "28px 28px 24px" }}>
            <div style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 12 }}>{s.label}</div>
            <div style={{ fontFamily: F, fontSize: 32, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Net profit bar */}
      <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderLeft: `2px solid ${GREEN}`, padding: "20px 28px", marginBottom: 40, display: "flex", gap: 60 }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>Total Net Profit</div>
          <div style={{ fontFamily: F, fontSize: 24, color: GREEN }}>{fmt2(totalNet)}</div>
        </div>
        <div>
          <div style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 6 }}>Events Analyzed</div>
          <div style={{ fontFamily: F, fontSize: 24, color: CREAM }}>{allCalc.length}</div>
        </div>
      </div>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <SectionHead>Upcoming Events</SectionHead>
          <div style={{ background: BG2, border: `1px solid ${BORDER}`, overflowX: "auto" }}>
            <THead cols={["Date", "Client", "Guests", "Revenue", "Food Cost", "Net", ""]} />
            {upcoming.map(({ b, c }) => {
              const isDropoff = b.service_type === "dropoff";
              return (
                <div key={b.id} className="arow" onClick={() => onSelect(b)}
                  style={{ display: "grid", gridTemplateColumns: "1.2fr 1.4fr 0.7fr 0.8fr 0.8fr 0.8fr 100px", padding: "16px 20px", borderTop: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.15s" }}>
                  <TCell>{fmtDate(b.event_date)}</TCell>
                  <TCell muted>{b.user_email}</TCell>
                  <TCell>{b.guest_count || "—"}</TCell>
                  <TCell>{fmt2(c.total)}</TCell>
                  <TCell color={isDropoff ? FAINT : RED}>{isDropoff ? "—" : fmt2(c.totalFoodCost)}</TCell>
                  <TCell color={isDropoff ? FAINT : c.netProfit >= 0 ? GREEN : RED}>{isDropoff ? "—" : fmt2(c.netProfit)}</TCell>
                  <TCell><Pill color={isDropoff ? GOLD2 : marginColor(c.netMargin)}>{isDropoff ? "drop-off" : fmtPct(c.netMargin)}</Pill></TCell>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All bookings */}
      <div>
        <SectionHead>All Bookings</SectionHead>
        {allCalc.length === 0 ? (
          <div style={{ fontFamily: F, fontSize: 13, color: FAINT, fontStyle: "italic", padding: "40px 0" }}>No bookings with revenue data.</div>
        ) : (
          <div style={{ background: BG2, border: `1px solid ${BORDER}`, overflowX: "auto" }}>
            <THead cols={["Client", "Date", "Pkg", "Guests", "Revenue", "Food", "Gross", "Net", ""]} />
            {allCalc.map(({ b, c }) => {
              const isDropoff = b.service_type === "dropoff";
              return (
                <div key={b.id} className="arow" onClick={() => onSelect(b)}
                  style={{ display: "grid", gridTemplateColumns: "1.4fr 1.2fr 0.5fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 100px", padding: "14px 20px", borderTop: `1px solid ${BORDER}`, cursor: "pointer", transition: "background 0.15s" }}>
                  <TCell muted small>{b.user_email}</TCell>
                  <TCell>{fmtDate(b.event_date)}</TCell>
                  <TCell muted small>{isDropoff ? "Drop" : ((b.package || "").charAt(8) || "—")}</TCell>
                  <TCell>{b.guest_count || "—"}</TCell>
                  <TCell>{fmt2(c.total)}</TCell>
                  <TCell color={isDropoff ? FAINT : RED}>{isDropoff ? "—" : fmt2(c.totalFoodCost)}</TCell>
                  <TCell color={isDropoff ? FAINT : GREEN}>{isDropoff ? "—" : fmt2(c.grossProfit)}</TCell>
                  <TCell color={isDropoff ? FAINT : c.netProfit >= 0 ? GREEN : RED}>{isDropoff ? "—" : fmt2(c.netProfit)}</TCell>
                  <TCell><Pill color={isDropoff ? GOLD2 : marginColor(c.netMargin)}>{isDropoff ? "drop" : fmtPct(c.netMargin)}</Pill></TCell>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function LogisticsDetail({ booking: b, onBack }) {
  const isDropoff = b.service_type === "dropoff";
  const c = calcLogistics(b);
  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "—";

  const Sec = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>{title}</div>
      {children}
    </div>
  );

  const Row = ({ label, value, color, bold }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontFamily: F, fontSize: 13, color: MUTED }}>{label}</span>
      <span style={{ fontFamily: F, fontSize: bold ? 15 : 13, color: color || CREAM, fontWeight: bold ? 500 : 400 }}>{value}</span>
    </div>
  );

  const mc = (m) => m >= 60 ? GREEN : m >= 40 ? GOLD2 : RED;

  return (
    <div>
      <button onClick={onBack} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: FAINT, padding: "8px 18px", fontFamily: F, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", marginBottom: 32 }}>
        ← back
      </button>

      {/* Header card */}
      <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderLeft: `2px solid ${GOLD2}`, padding: "24px 28px", marginBottom: 40, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 8 }}>
            {isDropoff ? "drop-off delivery" : (b.package || "—")}
          </div>
          <div style={{ fontFamily: F, fontSize: 20, color: CREAM }}>{b.user_email}</div>
          <div style={{ fontFamily: F, fontSize: 13, color: MUTED, marginTop: 6 }}>
            {isDropoff ? fmtDate(b.event_date) : `${fmtDate(b.event_date)} · ${b.guest_count} guests`}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: F, fontSize: 28, color: GOLD }}>{fmt2(c.total)}</div>
          <div style={{ fontFamily: F, fontSize: 11, color: FAINT, marginTop: 4 }}>conf: {b.confirmation_number || "—"}</div>
        </div>
      </div>

      <div className="admin-logistics-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        <div>
          <Sec title="Revenue">
            <Row label="Total"   value={fmt2(c.total)}   bold />
            <Row label="Deposit" value={fmt2(c.deposit)} />
            <Row label="Balance" value={fmt2(c.balance)} color={GOLD} />
          </Sec>

          {!isDropoff && (
            <>
              <Sec title="Food Cost">
                {c.rollBreakdown.length > 0
                  ? c.rollBreakdown.map((r) => <Row key={r.name} label={`${r.name} × ${r.qty}`} value={r.lineCost != null ? fmt2(r.lineCost) : "—"} />)
                  : <div style={{ fontFamily: F, fontSize: 13, color: FAINT, fontStyle: "italic", padding: "8px 0" }}>No roll data.</div>
                }
                {c.totalRolls > 0 && <>
                  <Row label={`Rice seasoning (${c.totalRolls} × $0.08)`} value={fmt2(c.riceSeasoningCost)} />
                  <Row label={`Condiments (${b.guest_count} × $0.23)`}   value={fmt2(c.condimentCost)} />
                </>}
                <Row label="Total Food Cost" value={fmt2(c.totalFoodCost)} color={RED} bold />
              </Sec>

              <Sec title="Profitability">
                <Row label="Gross Profit"   value={fmt2(c.grossProfit)}  color={c.grossProfit >= 0 ? GREEN : RED} />
                <Row label="Gross Margin"   value={fmtPct(c.grossMargin)} color={mc(c.grossMargin)} />
                <Row label={`Labor (${c.laborHours} hrs)`} value={fmt2(LABOR_COST)} />
                <Row label="Net Profit"     value={fmt2(c.netProfit)}    color={c.netProfit >= 0 ? GREEN : RED} bold />
                <div style={{ textAlign: "right", paddingTop: 12 }}>
                  <span style={{ fontFamily: F, fontSize: 24, color: mc(c.netMargin) }}>{fmtPct(c.netMargin)}</span>
                  <span style={{ fontFamily: F, fontSize: 11, color: FAINT, marginLeft: 8 }}>net margin</span>
                </div>
              </Sec>
            </>
          )}
        </div>

        {!isDropoff && (
          <div>
            <Sec title="Supplies">
              <Row label="Plates"          value={`${c.plates}`} />
              <Row label="Chopstick pairs" value={`${c.chopsticks}`} />
              <Row label="Soy cups"        value={`${c.soySauceCups}`} />
              <Row label="Napkins"         value={`${c.napkins}`} />
              <Row label="Gloves (pairs)"  value={`${c.gloves}`} />
              <Row label="Cutting boards"  value={`${c.cuttingBoards}`} />
              <Row label="Dry rice"        value={`${c.riceCups} cups`} bold />
            </Sec>

            <Sec title="Protein Order">
              {[
                { label: "Salmon",       oz: c.fishOz.salmon },
                { label: "Tuna",         oz: c.fishOz.tuna },
                { label: "Yellowtail",   oz: c.fishOz.yellowtail },
                { label: "Shrimp",       oz: c.fishOz.shrimp },
                { label: "Smoked Salmon", oz: c.fishOz.smoked_salmon },
              ].filter(({ oz }) => oz > 0).map(({ label, oz }) =>
                <Row key={label} label={label} value={fmtOz(oz)} />
              )}
              {Object.values(c.fishOz).every((v) => v === 0) && (
                <div style={{ fontFamily: F, fontSize: 13, color: FAINT, fontStyle: "italic", padding: "8px 0" }}>No roll data.</div>
              )}
            </Sec>
          </div>
        )}
      </div>

      <EventChecklist bookingId={b.id} ingredients={calcIngredients(b, c)} isDropoff={isDropoff} />
    </div>
  );
}

// ── Event checklist ───────────────────────────────────────────────────────────
function useChecklist(bookingId) {
  const key = `checklist_${bookingId}`;
  const [checked, setChecked] = useState(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch { return {}; }
  });
  const toggle = (id) => setChecked((prev) => {
    const next = { ...prev, [id]: !prev[id] };
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
    return next;
  });
  const reset = () => { setChecked({}); try { localStorage.removeItem(key); } catch {} };
  return [checked, toggle, reset];
}

function EventChecklist({ bookingId, ingredients, isDropoff }) {
  const [checked, toggle, reset] = useChecklist(bookingId);
  const [confirmReset, setConfirmReset] = useState(false);

  const foodItems   = isDropoff ? [] : buildFoodOrderItems(ingredients);
  const beforeItems = PREP_DAY_BEFORE.map((text, i) => ({ id: `before_${i}`, text }));
  const dayOfItems  = PREP_DAY_OF.map((text, i) => ({ id: `dayof_${i}`, text }));
  const totalItems  = foodItems.length + beforeItems.length + dayOfItems.length;
  const totalChecked = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ marginTop: 48, borderTop: `1px solid ${BORDER}`, paddingTop: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: F, fontSize: 12, color: GOLD2, letterSpacing: "0.3em", textTransform: "uppercase" }}>Prep Checklist</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontFamily: F, fontSize: 12, color: totalChecked === totalItems ? GREEN : FAINT }}>
            {totalChecked} / {totalItems}
          </span>
          {confirmReset ? (
            <span style={{ fontFamily: F, fontSize: 12, color: MUTED }}>
              Reset?{" "}
              <button onClick={() => { reset(); setConfirmReset(false); }} style={{ background: "none", border: "none", color: RED, fontFamily: F, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}>yes</button>
              {" · "}
              <button onClick={() => setConfirmReset(false)} style={{ background: "none", border: "none", color: FAINT, fontFamily: F, fontSize: 12, cursor: "pointer", padding: 0 }}>no</button>
            </span>
          ) : (
            <button onClick={() => setConfirmReset(true)} style={{ background: "none", border: "none", color: FAINT, fontFamily: F, fontSize: 12, cursor: "pointer", textDecoration: "underline", padding: 0 }}>reset</button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 1, background: BORDER2, marginBottom: 36 }}>
        <div style={{ height: 1, background: totalChecked === totalItems ? GREEN : GOLD2, width: `${totalItems > 0 ? (totalChecked / totalItems) * 100 : 0}%`, transition: "width 0.3s" }} />
      </div>

      <div className="admin-checklist-grid" style={{ display: "grid", gridTemplateColumns: isDropoff ? "1fr" : "1fr 1fr", gap: 40 }}>
        {!isDropoff && (
          <ChecklistSection title="Food Ordering" items={foodItems} checked={checked} toggle={toggle} />
        )}
        <div>
          <ChecklistSection title="Day Before" items={beforeItems} checked={checked} toggle={toggle} />
          <ChecklistSection title="Day Of"     items={dayOfItems}  checked={checked} toggle={toggle} />
        </div>
      </div>
    </div>
  );
}

function ChecklistSection({ title, items, checked, toggle }) {
  const done = items.filter((i) => checked[i.id]).length;
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${BORDER}` }}>
        <span style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.25em", textTransform: "uppercase" }}>{title}</span>
        <span style={{ fontFamily: F, fontSize: 11, color: done === items.length ? GREEN : FAINT }}>{done}/{items.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((item) => {
          const isDone = !!checked[item.id];
          return (
            <button key={item.id} onClick={() => toggle(item.id)} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "10px 0", background: "transparent", border: "none",
              cursor: "pointer", textAlign: "left", width: "100%", minHeight: 44,
            }}>
              <div style={{
                width: 16, height: 16, flexShrink: 0, marginTop: 1,
                border: `1px solid ${isDone ? GREEN : BORDER2}`,
                background: isDone ? GREEN : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s",
              }}>
                {isDone && <span style={{ color: BG, fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <span style={{ fontFamily: F, fontSize: 13, color: isDone ? FAINT : MUTED, textDecoration: isDone ? "line-through" : "none", lineHeight: 1.5 }}>
                  {item.text}
                </span>
                {item.detail && !isDone && (
                  <span style={{ fontFamily: F, fontSize: 11, color: GOLD2, fontStyle: "italic", marginLeft: 8 }}>{item.detail}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Promo codes tab ───────────────────────────────────────────────────────────
const EMPTY_FORM = { code: "", discount_type: "percent", discount_value: "", description: "", expires_at: "", max_uses: "" };

function PromoCodesTab({ promoCodes, onRefresh }) {
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formError, setFormError]     = useState("");
  const today = new Date().toISOString().split("T")[0];

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setFormError(""); setShowForm(true); };
  const openEdit   = (pc) => {
    setForm({ code: pc.code, discount_type: pc.discount_type, discount_value: String(pc.discount_value), description: pc.description || "", expires_at: pc.expires_at || "", max_uses: pc.max_uses != null ? String(pc.max_uses) : "" });
    setEditingId(pc.id); setFormError(""); setShowForm(true);
  };
  const cancelForm = () => { setShowForm(false); setEditingId(null); setFormError(""); };

  const saveForm = async () => {
    if (!form.code.trim()) { setFormError("Code is required"); return; }
    if (!form.discount_value || isNaN(Number(form.discount_value)) || Number(form.discount_value) <= 0) { setFormError("Discount value must be positive"); return; }
    setSaving(true); setFormError("");
    const payload = { code: form.code.toUpperCase().trim(), discount_type: form.discount_type, discount_value: Number(form.discount_value), description: form.description.trim() || null, expires_at: form.expires_at || null, max_uses: form.max_uses !== "" ? Number(form.max_uses) : null };
    const method = editingId ? "PATCH" : "POST";
    const body   = editingId ? { id: editingId, ...payload } : payload;
    const res    = await fetch("/api/admin/promo-codes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data   = await res.json();
    setSaving(false);
    if (data.error) { setFormError(data.error); return; }
    cancelForm(); onRefresh();
  };

  const toggleActive = async (pc) => {
    await fetch("/api/admin/promo-codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pc.id, active: !pc.active }) });
    onRefresh();
  };

  const deleteCode = async (id) => {
    await fetch("/api/admin/promo-codes", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setDeleteConfirm(null); onRefresh();
  };

  const fmtDate = (d) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  const inp = { width: "100%", padding: "10px 14px", background: BG3, border: `1px solid ${BORDER}`, color: CREAM, fontFamily: F, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <SectionHead>Promo Codes</SectionHead>
        {!showForm && (
          <button onClick={openCreate} style={{ background: GOLD, color: BG, border: "none", padding: "10px 22px", fontFamily: F, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer" }}>
            + new code
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, borderTop: `2px solid ${GOLD2}`, padding: "28px 32px", marginBottom: 32 }}>
          <div style={{ fontFamily: F, fontSize: 13, color: MUTED, marginBottom: 20, letterSpacing: "0.1em" }}>
            {editingId ? "edit code" : "new code"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            {[
              { label: "Code *",                field: "code",           type: "text",   ph: "SUMMER20",   transform: (v) => v.toUpperCase() },
              { label: "Discount Type *",        field: "discount_type",  type: "select"  },
              { label: form.discount_type === "percent" ? "Percent Off *" : "Amount Off ($) *", field: "discount_value", type: "number", ph: "20" },
              { label: "Max Uses (blank = ∞)",   field: "max_uses",       type: "number", ph: "Unlimited" },
              { label: "Expires On",             field: "expires_at",     type: "date"    },
              { label: "Admin Note",             field: "description",    type: "text",   ph: "Internal note…" },
            ].map(({ label, field, type, ph, transform }) => (
              <div key={field}>
                <label style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: 8 }}>{label}</label>
                {type === "select" ? (
                  <select value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} style={{ ...inp, colorScheme: "dark" }}>
                    <option value="percent">Percent Off (%)</option>
                    <option value="flat">Flat Amount ($)</option>
                  </select>
                ) : (
                  <input type={type} value={form[field]} placeholder={ph} min={type === "number" ? "0" : undefined}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: transform ? transform(e.target.value) : e.target.value }))}
                    style={{ ...inp, colorScheme: type === "date" ? "dark" : undefined }}
                  />
                )}
              </div>
            ))}
          </div>
          {formError && <div style={{ fontFamily: F, fontSize: 12, color: RED, marginBottom: 14 }}>{formError}</div>}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={saveForm} disabled={saving} style={{ background: GOLD, color: BG, border: "none", padding: "10px 24px", fontFamily: F, fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "saving…" : "save"}
            </button>
            <button onClick={cancelForm} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: FAINT, padding: "10px 18px", fontFamily: F, fontSize: 11, cursor: "pointer" }}>cancel</button>
          </div>
        </div>
      )}

      {promoCodes.length === 0 && !showForm ? (
        <div style={{ fontFamily: F, fontSize: 13, color: FAINT, fontStyle: "italic", padding: "60px 0", textAlign: "center" }}>No promo codes yet.</div>
      ) : (
        <div style={{ background: BG2, border: `1px solid ${BORDER}`, overflowX: "auto" }}>
          <THead cols={["Code", "Type", "Value", "Uses", "Max", "Expires", "Status", "Actions"]} />
          {promoCodes.map((pc) => {
            const isExpired = pc.expires_at && pc.expires_at < today;
            const statusColor = !pc.active ? FAINT : isExpired ? RED : GREEN;
            return (
              <div key={pc.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr 0.7fr 0.5fr 0.5fr 0.9fr 0.7fr 1fr", padding: "14px 20px", borderTop: `1px solid ${BORDER}`, alignItems: "center", minWidth: 700 }}>
                <div style={{ fontFamily: F, fontSize: 13, color: statusColor, letterSpacing: "0.06em" }}>{pc.code}</div>
                <TCell muted small>{pc.discount_type === "percent" ? "percent" : "flat"}</TCell>
                <TCell>{pc.discount_type === "percent" ? `${pc.discount_value}%` : `$${Number(pc.discount_value).toFixed(0)}`}</TCell>
                <TCell muted>{pc.uses_count || 0}</TCell>
                <TCell muted>{pc.max_uses ?? "∞"}</TCell>
                <TCell color={isExpired ? RED : MUTED} small>{fmtDate(pc.expires_at)}</TCell>
                <div>
                  <button onClick={() => toggleActive(pc)} style={{ background: "transparent", border: `1px solid ${statusColor}`, color: statusColor, padding: "4px 12px", fontFamily: F, fontSize: 11, cursor: "pointer", letterSpacing: "0.1em" }}>
                    {pc.active ? "active" : "off"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(pc)} style={{ background: "transparent", border: `1px solid ${BORDER}`, color: FAINT, padding: "4px 12px", fontFamily: F, fontSize: 11, cursor: "pointer" }}>edit</button>
                  {deleteConfirm === pc.id ? (
                    <span style={{ fontFamily: F, fontSize: 12, color: MUTED }}>
                      sure?{" "}
                      <button onClick={() => deleteCode(pc.id)} style={{ background: "none", border: "none", color: RED, fontFamily: F, fontSize: 12, cursor: "pointer", padding: 0, textDecoration: "underline" }}>yes</button>
                      {" / "}
                      <button onClick={() => setDeleteConfirm(null)} style={{ background: "none", border: "none", color: FAINT, fontFamily: F, fontSize: 12, cursor: "pointer", padding: 0 }}>no</button>
                    </span>
                  ) : (
                    <button onClick={() => setDeleteConfirm(pc.id)} style={{ background: "transparent", border: `1px solid rgba(197,85,45,0.3)`, color: RED, padding: "4px 12px", fontFamily: F, fontSize: 11, cursor: "pointer" }}>delete</button>
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

// ── Banner tab ────────────────────────────────────────────────────────────────
function BannerTab({ promoCodes }) {
  const [enabled, setEnabled]     = useState(false);
  const [text, setText]           = useState("");
  const [selectedPromo, setSelectedPromo] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [saveError, setSaveError] = useState("");
  const [loaded, setLoaded]       = useState(false);

  useEffect(() => {
    fetch("/api/banner").then((r) => r.json()).then((d) => { setEnabled(d.enabled); setText(d.text); setLoaded(true); }).catch(() => setLoaded(true));
  }, []);

  const insertPromo = (code) => {
    if (!code) return;
    const sep = text && !text.endsWith(" ") && !text.endsWith("·") ? " · " : "";
    setText((t) => `${t}${sep}${code}`);
    setSelectedPromo("");
  };

  const save = async () => {
    setSaving(true); setSaved(false); setSaveError("");
    try {
      const res  = await fetch("/api/admin/save-banner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, text }) });
      const data = await res.json();
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
      else setSaveError(data.error || "Save failed.");
    } catch { setSaveError("Network error."); }
    setSaving(false);
  };

  const previewText = text || "Founding guest pricing ends July 31 · Use code FOUNDING for 20% off";
  const activeCodes = promoCodes.filter((p) => p.active);

  if (!loaded) return <div style={{ padding: "60px 0", textAlign: "center", fontFamily: F, fontSize: 13, color: FAINT, fontStyle: "italic" }}>Loading…</div>;

  return (
    <div>
      <style>{`
        @keyframes banner-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .btk { display:inline-flex; align-items:center; white-space:nowrap; height:38px; animation:banner-ticker 40s linear infinite; }
        .bseg { font-family:'Shippori Mincho',Georgia,serif; font-size:12px; color:${GOLD}; letter-spacing:.15em; padding:0 40px; }
      `}</style>

      <SectionHead>Announcement Banner</SectionHead>

      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28, padding: "20px 24px", background: BG2, border: `1px solid ${BORDER}` }}>
        <div onClick={() => setEnabled((v) => !v)} style={{ width: 44, height: 24, borderRadius: 12, flexShrink: 0, background: enabled ? GOLD2 : BG3, border: `1px solid ${enabled ? GOLD2 : BORDER2}`, cursor: "pointer", position: "relative", transition: "all 0.2s" }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", background: enabled ? CREAM : FAINT, position: "absolute", top: 3, left: enabled ? 24 : 3, transition: "left 0.2s" }} />
        </div>
        <span style={{ fontFamily: F, fontSize: 13, color: enabled ? GOLD : FAINT }}>{enabled ? "banner active" : "banner off"}</span>
      </div>

      {/* Text input */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.25em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Message</label>
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Founding guest pricing ends July 31 · Use code FOUNDING for 20% off"
          style={{ width: "100%", padding: "12px 16px", background: BG2, border: `1px solid ${BORDER}`, color: CREAM, fontFamily: F, fontSize: 13, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      {activeCodes.length > 0 && (
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.2em", textTransform: "uppercase", flexShrink: 0 }}>Insert Code</label>
          <select value={selectedPromo} onChange={(e) => { setSelectedPromo(e.target.value); if (e.target.value) insertPromo(e.target.value); }}
            style={{ padding: "8px 14px", background: BG2, border: `1px solid ${BORDER}`, color: CREAM, fontFamily: F, fontSize: 13, cursor: "pointer", outline: "none", colorScheme: "dark" }}>
            <option value="">— select active code —</option>
            {activeCodes.map((pc) => <option key={pc.id} value={pc.code}>{pc.code} ({pc.discount_type === "percent" ? `${pc.discount_value}% off` : `$${Number(pc.discount_value).toFixed(0)} off`})</option>)}
          </select>
        </div>
      )}

      {/* Preview */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.25em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Preview</label>
        <div style={{ height: 38, background: "#1a1a1a", border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          {enabled ? (
            <div style={{ overflow: "hidden", height: "100%" }}>
              <div className="btk">
                {[...Array(4)].map((_, i) => <span key={i} className="bseg">{previewText}</span>)}
              </div>
            </div>
          ) : (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: F, fontSize: 11, color: FAINT, fontStyle: "italic", letterSpacing: "0.15em" }}>banner is off</span>
            </div>
          )}
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ width: "100%", height: 52, background: GOLD, color: BG, border: "none", fontFamily: F, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
        {saving ? "saving…" : "save banner"}
      </button>
      {saved      && <div style={{ fontFamily: F, fontSize: 13, color: GREEN, marginTop: 14, fontStyle: "italic" }}>Saved.</div>}
      {saveError  && <div style={{ fontFamily: F, fontSize: 13, color: RED,   marginTop: 14 }}>{saveError}</div>}
    </div>
  );
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function SectionHead({ children }) {
  return <div style={{ fontFamily: F, fontSize: 10, color: GOLD2, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 20 }}>{children}</div>;
}

function THead({ cols }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, 1fr)`, padding: "10px 20px", borderBottom: `1px solid ${BORDER}` }}>
      {cols.map((h) => <div key={h} style={{ fontFamily: F, fontSize: 10, color: FAINT, letterSpacing: "0.2em", textTransform: "uppercase" }}>{h}</div>)}
    </div>
  );
}

function TCell({ children, muted, small, color }) {
  return <div style={{ fontFamily: F, fontSize: small ? 11 : 13, color: color || (muted ? MUTED : CREAM), overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{children}</div>;
}

function Pill({ children, color }) {
  return <span style={{ fontFamily: F, fontSize: 11, color, background: color + "18", border: `1px solid ${color}44`, padding: "2px 10px", letterSpacing: "0.06em" }}>{children}</span>;
}

function marginColor(m) { return m >= 60 ? GREEN : m >= 40 ? GOLD2 : RED; }
