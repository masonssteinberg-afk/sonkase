"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  quoteForBoard, quotesForGuests, totalAfterDiscount, effectiveRates, EVENT_INCLUDES,
  BOARDS, boardById, MIN_GUESTS, MAX_GUESTS, SECOND_CHEF_THRESHOLD, SECOND_CHEF_FEE, formatUSD,
  ROLL_LIBRARY, rollById, ROLL_ALLOWANCE, chefsSelection,
  addonById, addonAvailable, addonTotal, effectiveAddonPrice,
} from "@/lib/pricing";

// Number words for the roll-allowance headers ("six roll styles").
const NUM_WORD = { 2: "two", 4: "four", 6: "six" };
const numWord = (n) => NUM_WORD[n] || String(n);

// Smooth-scroll to a step card, clearing the fixed header.
const scrollToStep = (id) => {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 96;
  window.scrollTo({ top, behavior: "smooth" });
};

// ── Design Tokens (Sonakase™ palette) ──────────────────────────
const NAVY        = "#0d0d0d";   // primary background
const PERSIMMON   = "#E8C97E";   // gold accent
const CREAM       = "#F5F0E8";   // cream text
const INK_SOFT    = "rgba(245,240,232,0.6)";
const INK_FAINT   = "rgba(245,240,232,0.35)";
const GOLD        = "#E8C97E";

const FONT_DISPLAY = `'Shippori Mincho', Georgia, serif`;
const FONT_BODY    = `'Shippori Mincho', Georgia, serif`;
const FONT_UI      = `'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif`;

// ── Time Slots (11am – 11pm, 30-min increments) ───────────────
const TIME_SLOTS = (() => {
  const slots = [];
  for (let h = 11; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      const ampm   = h >= 12 ? "PM" : "AM";
      const label  = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
      const value  = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      slots.push({ label, value });
    }
  }
  return slots;
})();

// ── Stripe ────────────────────────────────────────────────────
const stripePromise = typeof window !== "undefined"
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};
const minDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};
const fmtTime = (v) => {
  const slot = TIME_SLOTS.find((s) => s.value === v);
  return slot ? slot.label : v;
};

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [guestInput, setGuestInput]         = useState("");
  const [boardId, setBoardId]               = useState(BOARDS[0].id);
  const [eventDate, setEventDate]           = useState("");
  const [eventTime, setEventTime]           = useState("");
  const [contactName, setContactName]       = useState("");
  const [contactEmail, setContactEmail]     = useState("");
  const [contactPhone, setContactPhone]     = useState("");
  const [eventAddress, setEventAddress]     = useState("");
  const [chefNotes, setChefNotes]           = useState("");
  const [selectedRolls, setSelectedRolls]   = useState([]);   // roll ids, capped at ROLL_ALLOWANCE
  const [sashimiAdded, setSashimiAdded]     = useState(false);
  const [confirmation, setConfirmation]     = useState(null);

  // Prefill guest count from ?guests= and board from ?board= (quote finder
  // / board-card Reserve links).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get("guests");
    if (g && /^\d+$/.test(g)) setGuestInput(g);
    const b = params.get("board");
    if (b && boardById(b)) setBoardId(b);
  }, []);

  // The quote is derived from the guest count and the chosen board on every
  // render — no stored total — so changing either re-resolves the total,
  // deposit, and balance. Every count from MIN_GUESTS to MAX_GUESTS books.
  const guests    = parseInt(guestInput, 10);
  const inRange   = Number.isFinite(guests) && guests >= MIN_GUESTS && guests <= MAX_GUESTS;
  const tooFew    = Number.isFinite(guests) && guests >= 1 && guests < MIN_GUESTS;
  const tooMany   = Number.isFinite(guests) && guests > MAX_GUESTS;
  const boardQuotes = inRange ? quotesForGuests(guests) : null;  // both boards, for the chooser
  const quote     = inRange ? quoteForBoard(boardId, guests) : null;

  // ── Menu selection ────────────────────────────────────────────────
  // Guests pick their rolls; nigiri is the chef's choice, shaped to order at
  // the event, so it isn't selected here.
  const rollAllowance  = ROLL_ALLOWANCE(boardId);
  const menuComplete   = selectedRolls.length === rollAllowance;

  // Sashimi add-on — the only add-on, per-guest, gated by its 6-guest minimum.
  const sashimi         = addonById("sashimi");
  const sashimiEligible = inRange && addonAvailable(sashimi, guests);
  const sashimiIncluded = sashimiEligible && sashimiAdded;
  const addonsTotal     = sashimiIncluded ? addonTotal(sashimi, guests) : 0;

  // Changing the board changes the roll allowance, so a stale selection can no
  // longer be valid — clear it and let the guest rechoose for the new board.
  useEffect(() => { setSelectedRolls([]); }, [boardId]);
  // Drop sashimi if the party falls below its minimum.
  useEffect(() => { if (!sashimiEligible) setSashimiAdded(false); }, [sashimiEligible]);

  const toggleRoll = (id) => setSelectedRolls((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id)
      : prev.length >= rollAllowance ? prev            // at the cap — ignore new picks
      : [...prev, id]);

  // Chef's selection: fill the board's default rolls and jump to the next step.
  const applyChefsSelection = () => {
    setSelectedRolls(chefsSelection(boardId).rolls);
    setTimeout(() => scrollToStep(sashimiEligible ? "step-sashimi" : "step-contact"), 60);
  };

  // The chosen order, resolved to display names — passed to payment, the save
  // payload, the receipt, and the confirmation screen. Nigiri is the chef's
  // choice at the event, so it is not part of the guest's selection.
  const menuOrder = {
    boardId,
    rolls: selectedRolls,
    rollNames: selectedRolls.map((id) => rollById(id)?.name ?? id),
    sashimi: sashimiIncluded,
  };

  const emailValid = contactEmail.includes("@") && contactEmail.trim().length >= 5;
  const phoneValid = contactPhone.replace(/\D/g, "").length >= 7;
  const contactValid = contactName.trim().length >= 2 && emailValid && phoneValid;

  const daysOut = eventDate ? (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((new Date(eventDate + "T00:00:00") - today) / 86400000);
  })() : 0;
  const dateValid    = eventDate && eventTime && daysOut >= 7;
  const readyForPay  = !!quote && dateValid && contactValid && menuComplete;

  const reset = () => {
    setGuestInput(""); setEventDate(""); setEventTime("");
    setContactName(""); setContactEmail(""); setContactPhone("");
    setEventAddress(""); setChefNotes("");
    setSelectedRolls([]); setSashimiAdded(false);
    setConfirmation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY, fontFamily: FONT_BODY, color: CREAM, overflowX: "hidden" }} className="book-page-wrapper">
      <BookStyles />
      <BookHeader />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 120px", boxSizing: "border-box" }}>
        {confirmation && (
          <ConfirmationScreen confirmation={confirmation} onReset={reset} />
        )}

        {!confirmation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Guest count → board totals resolve automatically */}
            <div style={CS.card}>
              <StepHeader kanji="客" eyebrow="your event" title="how many guests?" subtitle={`${MIN_GUESTS} to ${MAX_GUESTS} guests. choose a board and the total resolves automatically.`} />
              <label style={CS.label}>guest count</label>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_GUESTS} max={MAX_GUESTS + 1}
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="Enter number of guests"
                style={{ ...CS.input, maxWidth: 260 }}
              />

              {tooFew && (
                <div style={{ marginTop: 12, fontFamily: FONT_BODY, fontSize: 13, color: PERSIMMON, fontStyle: "italic" }}>
                  Please enter at least {MIN_GUESTS} guests.
                </div>
              )}
              {tooMany && <Over50Panel />}
              {boardQuotes && (
                <BoardChooser boardQuotes={boardQuotes} boardId={boardId} onSelect={setBoardId} />
              )}
              {quote && <BoardPanel quote={quote} />}
            </div>

            {/* Date & time */}
            <div style={CS.card}>
              <StepHeader kanji="宵" eyebrow="when" title="choose your evening" />
              <div style={{ marginBottom: 28 }}>
                <label style={CS.label}>date</label>
                <input
                  type="date" value={eventDate} min={minDate()}
                  onChange={(e) => setEventDate(e.target.value)}
                  style={{ ...CS.input, maxWidth: 260, colorScheme: "dark" }}
                />
                {eventDate && (
                  <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: PERSIMMON, marginTop: 10 }}>{fmtDate(eventDate)}</div>
                )}
                {eventDate && daysOut < 7 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PERSIMMON, marginTop: 8, fontStyle: "italic" }}>
                    7-day minimum lead time required — please choose a later date.
                  </div>
                )}
                {!eventDate && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, marginTop: 8, fontStyle: "italic" }}>
                    7-day minimum lead time required.
                  </div>
                )}
                <div style={{ marginTop: 16, padding: "14px 16px", background: "rgba(232,201,126,0.04)", border: "1px solid rgba(232,201,126,0.15)", borderLeft: `2px solid rgba(232,201,126,0.35)`, borderRadius: 14 }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>Need it sooner?</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, lineHeight: 1.65 }}>
                    Rush bookings may be available — send the date and you&rsquo;ll get an answer quickly.
                  </div>
                  <a href={`/?subject=${encodeURIComponent("Rush booking request (within 7 days)")}#contact`} style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: GOLD, letterSpacing: "0.1em", textDecoration: "none" }}>
                    Get in touch →
                  </a>
                </div>
              </div>

              <div>
                <label style={CS.label}>start time</label>
                <select
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  style={{ ...CS.input, maxWidth: 220, cursor: "pointer", background: "#0d0d0d" }}
                >
                  <option value="">Select a time</option>
                  {TIME_SLOTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                {eventTime && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, marginTop: 10, fontStyle: "italic" }}>
                    Chef arrives about 30 minutes early to set up — service begins at {fmtTime(eventTime)} and runs about two hours.
                  </div>
                )}
              </div>
            </div>

            {/* Your menu — roll selection (nigiri is the chef's choice) */}
            <MenuStep
              rollAllowance={rollAllowance}
              selectedRolls={selectedRolls}
              onToggleRoll={toggleRoll}
              onChefsSelection={applyChefsSelection}
            />

            {/* Sashimi add-on — hidden entirely below its 6-guest minimum */}
            {sashimiEligible && (
              <SashimiStep
                addon={sashimi}
                guests={guests}
                added={sashimiAdded}
                onToggle={() => setSashimiAdded((v) => !v)}
              />
            )}

            {/* Contact details & preferences — no account needed */}
            <div id="step-contact" style={CS.card}>
              <StepHeader kanji="宛" eyebrow="your details" title="who's hosting, and where" subtitle="no account needed — your confirmation number arrives by email." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }} className="book-contact-grid">
                <div>
                  <label style={CS.label}>name</label>
                  <input
                    type="text"
                    autoComplete="name"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full name"
                    style={CS.input}
                  />
                </div>
                <div>
                  <label style={CS.label}>phone</label>
                  <input
                    type="tel"
                    autoComplete="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(352) 555-0100"
                    style={CS.input}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={CS.label}>email</label>
                <input
                  type="email"
                  autoComplete="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={CS.input}
                />
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_FAINT, fontStyle: "italic", marginTop: 6 }}>
                  Your receipt and confirmation number go here.
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={CS.label}>event address</label>
                <input
                  type="text"
                  autoComplete="street-address"
                  value={eventAddress}
                  onChange={(e) => setEventAddress(e.target.value)}
                  placeholder="Street address in the Gainesville area"
                  style={CS.input}
                />
              </div>
              <div>
                <label style={CS.label}>allergies, restrictions, or notes for your chef</label>
                <textarea
                  value={chefNotes}
                  onChange={(e) => setChefNotes(e.target.value)}
                  placeholder="allergies, strong dislikes, or anything your chef should know…"
                  rows={3}
                  style={{ ...CS.input, resize: "vertical", lineHeight: 1.6, padding: "12px 14px" }}
                />
              </div>
            </div>

            {/* Payment — appears once guests + date + time are set */}
            {readyForPay ? (
              <PaymentSection
                quote={quote}
                menuOrder={menuOrder}
                addonsTotal={addonsTotal}
                contact={{ name: contactName.trim(), email: contactEmail.trim().toLowerCase(), phone: contactPhone.trim() }}
                eventDate={eventDate}
                eventTime={eventTime}
                eventAddress={eventAddress}
                chefNotes={chefNotes}
                onConfirm={(id, totals) => {
                  setConfirmation({ id, quote, menuOrder, eventDate, eventTime, email: contactEmail.trim().toLowerCase(), ...totals });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ) : (
              <div style={{ ...CS.card, textAlign: "center", fontFamily: FONT_BODY, fontSize: 14, color: INK_FAINT, fontStyle: "italic" }}>
                {tooMany
                  ? "Events over 50 guests are booked through the contact form."
                  : !quote
                  ? "Enter your guest count, date, time, and contact details to continue to payment."
                  : !menuComplete
                  ? `Choose your ${numWord(rollAllowance)} rolls, then add your date, time, and contact details to continue to payment.`
                  : "Enter your date, time, and contact details to continue to payment."}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Board chooser — pick Full or Short, each priced live for the count ─
function BoardChooser({ boardQuotes, boardId, onSelect }) {
  return (
    <div style={{ marginTop: 24 }}>
      <label style={CS.label}>choose your board</label>
      <div style={{ display: "grid", gap: 12 }} className="book-board-grid">
        {boardQuotes.map((q) => {
          const selected = q.board.id === boardId;
          return (
            <button
              key={q.board.id}
              type="button"
              onClick={() => onSelect(q.board.id)}
              style={{
                textAlign: "left", cursor: "pointer", width: "100%",
                background: selected ? "rgba(232,201,126,0.08)" : "rgba(245,240,232,0.03)",
                border: `1px solid ${selected ? "rgba(232,201,126,0.55)" : "rgba(232,201,126,0.18)"}`,
                borderRadius: 16, padding: "16px 18px",
                display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: selected ? GOLD : CREAM, marginBottom: 4 }}>{q.board.name}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.45 }}>{q.board.menu}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: CREAM, lineHeight: 1, whiteSpace: "nowrap" }}>{formatUSD(q.total)}</div>
                <div style={{ fontFamily: FONT_UI, fontSize: 10.5, color: "rgba(232,201,126,0.7)", letterSpacing: "0.06em", marginTop: 5 }}>
                  {q.minimumApplied ? "event minimum" : `${formatUSD(q.perGuest)}/guest`}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Board panel — selected board's full quote under the chooser ───────
function BoardPanel({ quote }) {
  const { board, total, baseTotal, secondChefFee, deposit, balance, minimumApplied, secondChefApplied } = quote;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ background: "rgba(232,201,126,0.05)", border: "1px solid rgba(232,201,126,0.3)", borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: GOLD }}>{board.name}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: 11, color: "rgba(232,201,126,0.7)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {formatUSD(quote.perGuest)} per guest
          </div>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", marginBottom: 16 }}>{board.tagline}</div>

        {secondChefApplied && (
          <>
            <SummaryRow label="Sushi & service"  value={formatUSD(baseTotal)} />
            <SummaryRow label="Second chef"      value={`+${formatUSD(secondChefFee)}`} />
          </>
        )}
        <SummaryRow label="Total"                value={formatUSD(total)} highlight />
        <SummaryRow label="Deposit due today"    value={formatUSD(deposit)} />
        <SummaryRow label="Balance due at event" value={formatUSD(balance)} />

        {minimumApplied && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(232,201,126,0.75)", fontStyle: "italic", marginTop: 12 }}>
            {formatUSD(effectiveRates(board).minimum)} event minimum applies at this guest count.
          </div>
        )}
        {secondChefApplied && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(232,201,126,0.75)", fontStyle: "italic", marginTop: 12 }}>
            Parties over {SECOND_CHEF_THRESHOLD} guests bring a second chef ({formatUSD(SECOND_CHEF_FEE)}).
          </div>
        )}

        <div style={{ height: 1, background: "rgba(232,201,126,0.15)", margin: "18px 0 14px" }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.65, marginBottom: 14 }}>
          {board.menu} — you choose your rolls in the next step; nigiri is the chef&rsquo;s choice, shaped to order around the freshest catch, served at any hour.
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
          also included
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px" }}>
          {EVENT_INCLUDES.map((item) => (
            <span key={item} style={{ fontFamily: FONT_BODY, fontSize: 13, color: CREAM, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: GOLD, fontSize: 7, opacity: 0.6 }}>◆</span>{item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Over-50 panel — route to contact form ─────────────────────
function Over50Panel() {
  return (
    <div style={{ marginTop: 24, background: "rgba(232,201,126,0.04)", border: "1px solid rgba(232,201,126,0.25)", borderLeft: `2px solid ${GOLD}`, borderRadius: 14, padding: "18px 20px" }}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
        over {MAX_GUESTS} guests
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, lineHeight: 1.7, marginBottom: 10 }}>
        Events this size are planned directly with the chef. Send the details and you&rsquo;ll get a custom plan.
      </div>
      <a
        href={`/?subject=${encodeURIComponent(`Large event inquiry (over ${MAX_GUESTS} guests)`)}#contact`}
        style={{ display: "inline-block", fontFamily: FONT_BODY, fontSize: 13, color: GOLD, letterSpacing: "0.1em", textDecoration: "none" }}
      >
        Get in touch →
      </a>
    </div>
  );
}

// ── Your menu — roll & nigiri selection ───────────────────────
function MenuStep({ rollAllowance, selectedRolls, onToggleRoll, onChefsSelection }) {
  const rollsAtCap = selectedRolls.length >= rollAllowance;

  return (
    <div id="step-menu" style={CS.card}>
      <StepHeader
        kanji="膳"
        eyebrow="your menu"
        title={`choose your ${numWord(rollAllowance)} roll styles`}
        subtitle="build your board below — tap to add, tap again to swap."
      />

      {/* Chef's selection — one tap fills the board and moves on */}
      <button type="button" onClick={onChefsSelection} className="book-chefs-btn" style={CS.chefsBtn}>
        ✦ Chef&rsquo;s selection — fill my board
      </button>

      {/* Rolls */}
      <div style={CS.pickerHead}>
        <label style={{ ...CS.label, marginBottom: 0 }}>rolls</label>
        <span style={CS.counter}>{selectedRolls.length} of {rollAllowance} selected</span>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {ROLL_LIBRARY.filter((r) => r.available).map((r) => {
          const selected = selectedRolls.includes(r.id);
          return (
            <RollCard key={r.id} roll={r} selected={selected} disabled={!selected && rollsAtCap} onToggle={() => onToggleRoll(r.id)} />
          );
        })}
      </div>

      {/* Nigiri — the chef's choice at the event */}
      <div style={{ marginTop: 26 }}>
        <label style={CS.label}>nigiri</label>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.6, padding: "12px 16px", background: "rgba(245,240,232,0.03)", border: "1px solid rgba(232,201,126,0.18)", borderRadius: 14 }}>
          Nigiri is the chef&rsquo;s choice — shaped to order at your counter during service.
        </div>
      </div>
    </div>
  );
}

function RollCard({ roll, selected, disabled, onToggle }) {
  const tag = roll.vegetarian ? "Vegetarian" : roll.cooked ? "Cooked" : "Raw";
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      className="book-select-card"
      style={{
        textAlign: "left", width: "100%",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        background: selected ? "rgba(232,201,126,0.08)" : "rgba(245,240,232,0.03)",
        border: `1px solid ${selected ? "rgba(232,201,126,0.55)" : "rgba(232,201,126,0.18)"}`,
        borderRadius: 16, padding: "14px 16px",
        display: "flex", alignItems: "flex-start", gap: 12,
      }}
    >
      <span style={{
        marginTop: 1, width: 18, height: 18, borderRadius: 6, flexShrink: 0,
        border: `1px solid ${selected ? GOLD : "rgba(232,201,126,0.4)"}`,
        background: selected ? GOLD : "transparent",
        color: NAVY, fontSize: 12, lineHeight: "17px", textAlign: "center", fontWeight: 700,
      }}>{selected ? "✓" : ""}</span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: selected ? GOLD : CREAM }}>{roll.name}</span>
          <span style={{ fontFamily: FONT_UI, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(232,201,126,0.75)", border: "1px solid rgba(232,201,126,0.3)", borderRadius: 999, padding: "1px 7px" }}>{tag}</span>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12.5, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.45, marginTop: 4 }}>{roll.description}</div>
      </div>
    </button>
  );
}

// ── Sashimi add-on step (rendered only for parties of six or more) ─────
function SashimiStep({ addon, guests, added, onToggle }) {
  const unit   = effectiveAddonPrice(addon);
  const isLaunch = unit < addon.standardPrice;
  const total  = addonTotal(addon, guests);

  return (
    <div id="step-sashimi" style={CS.card}>
      <StepHeader kanji="刺" eyebrow="add a course" title="add a sashimi course?" subtitle="an optional upgrade — the day's freshest cuts, served without rice." />
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={added}
        className="book-select-card"
        style={{
          textAlign: "left", width: "100%", cursor: "pointer",
          background: added ? "rgba(232,201,126,0.08)" : "rgba(245,240,232,0.03)",
          border: `1px solid ${added ? "rgba(232,201,126,0.55)" : "rgba(232,201,126,0.2)"}`,
          borderRadius: 18, padding: "20px 22px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 19, color: added ? GOLD : CREAM }}>{addon.name}</div>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            {isLaunch && (
              <span style={{ fontFamily: FONT_UI, fontSize: 12, color: INK_FAINT, textDecoration: "line-through", marginRight: 8 }}>
                {formatUSD(addon.standardPrice)}
              </span>
            )}
            <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: CREAM }}>{formatUSD(unit)}</span>
            <span style={{ fontFamily: FONT_UI, fontSize: 11, color: "rgba(232,201,126,0.7)" }}> / guest</span>
          </div>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13.5, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.6, marginBottom: 16 }}>
          {addon.description}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, paddingTop: 14, borderTop: "1px dotted rgba(232,201,126,0.2)" }}>
          <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: CREAM }}>
            {added ? "Added" : "Add"} for {guests} guests — <strong style={{ color: GOLD }}>{formatUSD(total)}</strong>
          </span>
          <span style={{
            fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "8px 16px", borderRadius: 999,
            background: added ? GOLD : "transparent",
            color: added ? NAVY : GOLD,
            border: `1px solid ${GOLD}`,
          }}>{added ? "✓ Added" : "Add course"}</span>
        </div>
      </button>
    </div>
  );
}

// ── Payment ───────────────────────────────────────────────────
function PaymentSection({ quote, menuOrder, addonsTotal, contact, eventDate, eventTime, eventAddress, chefNotes, onConfirm }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [intentError, setIntentError]   = useState(null);
  const [promoInput, setPromoInput]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState("");

  // Discounts apply to the per-guest base first; the event minimum is
  // applied LAST (in totalAfterDiscount) and the second-chef fee is added
  // back untouched, so no booking settles below its board floor. The flat
  // deposit never changes with promos.
  const baseAfterPromo   = appliedPromo ? totalAfterDiscount(quote, appliedPromo.discount_amount) : quote.total;
  const promoSavings     = quote.total - baseAfterPromo; // actual reduction after the floor
  const effectiveTotal   = baseAfterPromo + addonsTotal; // grand total incl. the sashimi add-on
  const effectiveDeposit = quote.deposit;                // flat deposit — never moved by promos or add-ons
  const effectiveBalance = Math.round((effectiveTotal - effectiveDeposit) * 100) / 100;

  // Create/recreate the payment intent for the current deposit. Callable so
  // the error state can offer a Retry.
  const requestIntent = () => {
    if (!effectiveDeposit) return;
    setClientSecret(null);
    setIntentError(null);
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: effectiveDeposit }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else setIntentError(data.error || "Could not initialize payment");
      })
      .catch(() => setIntentError("Could not connect to payment service"));
  };
  useEffect(() => { requestIntent(); }, [effectiveDeposit]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the guest count (and so the total) changes with a promo applied,
  // re-validate so percent discounts track the new subtotal.
  useEffect(() => {
    if (!appliedPromo) return;
    fetch("/api/validate-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: appliedPromo.code, subtotal: quote.total }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) setAppliedPromo({ code: appliedPromo.code, ...data });
        else { setAppliedPromo(null); setPromoError(data.error || "Code no longer valid"); }
      })
      .catch(() => {});
  }, [quote.total]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res  = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: quote.total }),
      });
      const data = await res.json();
      if (data.valid) setAppliedPromo({ code, ...data });
      else setPromoError(data.error || "Invalid code");
    } catch {
      setPromoError("Could not validate code");
    }
    setPromoLoading(false);
  };

  if (intentError) return (
    <div style={CS.card}>
      <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: CREAM, marginBottom: 10 }}>
          We couldn&rsquo;t start the payment
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, lineHeight: 1.6, maxWidth: 380, margin: "0 auto 22px" }}>
          Your card was not charged. This is usually momentary — try again, or reserve by message and you&rsquo;ll get a reply the same day.
        </div>
        <button onClick={requestIntent} className="book-cta" style={{ ...CS.cta, display: "inline-block", width: "auto", padding: "13px 34px" }}>
          Try again
        </button>
        <div style={{ marginTop: 16 }}>
          <a
            href={`/?subject=${encodeURIComponent(`Booking request — ${quote.guests} guests, ${quote.board.name}`)}#contact`}
            style={{ fontFamily: FONT_BODY, fontSize: 13, color: GOLD, letterSpacing: "0.04em", textDecoration: "none" }}
          >
            Reserve by message →
          </a>
        </div>
      </div>
    </div>
  );

  if (!clientSecret) return (
    <div style={CS.card}>
      <div style={{ textAlign: "center", padding: "60px 0", fontFamily: FONT_DISPLAY, fontSize: 15, color: INK_FAINT, letterSpacing: "0.1em" }}>
        Preparing secure payment…
      </div>
    </div>
  );

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm
        clientSecret={clientSecret}
        quote={quote} contact={contact}
        menuOrder={menuOrder} addonsTotal={addonsTotal}
        eventDate={eventDate} eventTime={eventTime}
        eventAddress={eventAddress} chefNotes={chefNotes}
        appliedPromo={appliedPromo}
        promoSavings={promoSavings}
        effectiveTotal={effectiveTotal}
        effectiveDeposit={effectiveDeposit}
        effectiveBalance={effectiveBalance}
        promoInput={promoInput}
        setPromoInput={setPromoInput}
        promoLoading={promoLoading}
        promoError={promoError}
        onApplyPromo={applyPromo}
        onRemovePromo={() => { setAppliedPromo(null); setPromoInput(""); setPromoError(""); }}
        onConfirm={onConfirm}
      />
    </Elements>
  );
}

function PaymentForm({ clientSecret, quote, contact, menuOrder, addonsTotal, eventDate, eventTime, eventAddress, chefNotes, appliedPromo, promoSavings, effectiveTotal, effectiveDeposit, effectiveBalance, promoInput, setPromoInput, promoLoading, promoError, onApplyPromo, onRemovePromo, onConfirm }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const [processing, setProcessing]     = useState(false);
  const [error, setError]               = useState("");
  const [cardComplete, setCardComplete] = useState(false);

  const { board, guests } = quote;

  const submit = async () => {
    if (!stripe || !elements || !cardComplete) return;
    setProcessing(true); setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement), billing_details: { name: contact.name, email: contact.email, phone: contact.phone } },
    });

    if (stripeError) { setError(stripeError.message); setProcessing(false); return; }
    if (paymentIntent.status !== "succeeded") { setError("Payment did not complete. Please try again."); setProcessing(false); return; }

    const confirmationId = `CS${Date.now().toString(36).toUpperCase().slice(-6)}`;

    // The chosen order, as rows for booking_selections / booking_addons. The
    // server recomputes every total from lib/pricing and snapshots the names
    // and prices — the client-side total is never trusted for the write.
    const selections = menuOrder.rolls.map((id) => ({ item_type: "roll", item_id: id }));
    const addons = menuOrder.sashimi ? [{ addon_id: "sashimi" }] : [];

    const saveRes = await fetch("/api/save-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: contact.email,
        contact_name: contact.name,
        contact_phone: contact.phone,
        package: board.name,
        board_type: board.id,
        service_type: "countertop",
        event_date: eventDate,
        event_time: eventTime,
        guest_count: guests,
        price_per_guest: quote.perGuest,
        delivery_address: eventAddress || null,
        special_requests: chefNotes,
        status: "pending",
        confirmation_number: confirmationId,
        stripe_payment_intent_id: paymentIntent.id,
        selections,
        addons,
        ...(appliedPromo ? { promo_code: appliedPromo.code, discount_amount: promoSavings } : {}),
      }),
    });
    const saveData = await saveRes.json();
    if (!saveData.success) {
      setError(`Booking could not be saved: ${saveData.error}. Your payment was charged — please get in touch right away and it will be sorted out.`);
      setProcessing(false); return;
    }

    // Use the server-recomputed totals everywhere downstream, so the receipt,
    // confirmation screen, and admin note all match exactly what was written.
    const saved   = saveData.booking || {};
    const total   = Number(saved.subtotal ?? saved.total_price ?? effectiveTotal);
    const deposit = Number(saved.deposit_amount ?? effectiveDeposit);
    const balance = Math.round((total - deposit) * 100) / 100;

    await Promise.allSettled([
      fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          guestName: contact.name,
          confirmationId,
          serviceType: "countertop",
          packageName: board.name,
          boardType: board.id,
          eventDate, eventTime,
          guestCount: guests,
          pricePerGuest: quote.perGuest,
          total, deposit,
          rolls: menuOrder.rollNames,
          sashimi: menuOrder.sashimi,
          chefNotes,
          ...(appliedPromo ? { promoCode: appliedPromo.code, discountAmount: promoSavings } : {}),
        }),
      }),
      fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "countertop",
          clientEmail: contact.email,
          clientName: contact.name,
          clientPhone: contact.phone,
          confirmationId,
          packageName: board.name,
          boardType: board.id,
          eventDate, eventTime,
          guestCount: guests,
          pricePerGuest: quote.perGuest,
          total, deposit,
          deliveryAddress: eventAddress || null,
          rolls: menuOrder.rollNames,
          sashimi: menuOrder.sashimi,
          chefNotes,
        }),
      }),
      ...(appliedPromo ? [fetch("/api/apply-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: appliedPromo.code }),
      })] : []),
    ]);

    setProcessing(false);
    onConfirm(confirmationId, { total, deposit, balance });
  };

  return (
    <div style={CS.card}>
      <StepHeader kanji="払" eyebrow="secure payment" title="reserve with your deposit" subtitle="the balance is due at the event." />

      {/* Review + deposit panel */}
      <div style={{ background: "rgba(13,13,13,0.6)", border: "1px solid rgba(232,201,126,0.15)", borderRadius: 16, color: CREAM, padding: "22px 26px", marginBottom: 28 }}>
        <SummaryRow label="Experience" value={`${board.name} · ${guests} guests`} />
        <SummaryRow label="Date"       value={fmtDate(eventDate)} />
        <SummaryRow label="Time"       value={fmtTime(eventTime)} />
        {menuOrder.sashimi && addonsTotal > 0 && (
          <SummaryRow label="Sashimi course" value={`+${formatUSD(addonsTotal)}`} />
        )}
        <SummaryRow label="Total"      value={formatUSD(effectiveTotal)} />
        {appliedPromo && promoSavings > 0 && (
          <SummaryRow label={`Promo (${appliedPromo.code})`} value={`−${formatUSD(promoSavings)}`} />
        )}
        {appliedPromo && promoSavings === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_FAINT, fontStyle: "italic", padding: "9px 0" }}>
            {appliedPromo.code} applied — the {formatUSD(effectiveRates(quote.board).minimum)} event minimum still sets this total.
          </div>
        )}
        <div style={{ marginTop: 18 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PERSIMMON, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>deposit due today</div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 400, color: CREAM, lineHeight: 1 }}>{formatUSD(effectiveDeposit)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(245,236,217,0.45)", marginTop: 6, fontStyle: "italic" }}>
            Balance {formatUSD(effectiveBalance)} due at the event
          </div>
        </div>
      </div>

      {/* Menu recap */}
      <div style={{ marginBottom: 24 }}>
        <div style={CS.label}>your menu</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.6 }}>
          {menuOrder.rollNames.join(", ")}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", marginTop: 6, lineHeight: 1.6 }}>
          Nigiri: chef&rsquo;s choice{menuOrder.sashimi ? " · sashimi course" : ""}
        </div>
      </div>

      {/* Promo code */}
      <div style={{ marginBottom: 24 }}>
        <label style={CS.label}>promo code</label>
        {appliedPromo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, padding: "12px 16px",
              background: "rgba(232,201,126,0.08)", border: `1px solid rgba(232,201,126,0.4)`,
              borderRadius: 14,
              fontFamily: FONT_UI, fontSize: 14, fontWeight: 500, color: GOLD, letterSpacing: "0.04em",
            }}>
              ✓ {appliedPromo.code} — {formatUSD(promoSavings)} off
            </div>
            <button onClick={onRemovePromo} style={{
              background: "none", border: `1px solid rgba(232,201,126,0.3)`,
              borderRadius: 12,
              color: "rgba(232,201,126,0.6)", padding: "12px 14px",
              fontFamily: FONT_UI, fontSize: 13, cursor: "pointer",
            }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); }}
              onKeyDown={(e) => e.key === "Enter" && onApplyPromo()}
              placeholder="Optional"
              disabled={promoLoading}
              style={{
                flex: 1, padding: "12px 16px",
                background: "rgba(245,240,232,0.045)", border: `1px solid rgba(232,201,126,0.25)`,
                borderRadius: 14,
                fontFamily: FONT_UI, fontSize: 14, color: CREAM, letterSpacing: "0.04em",
                outline: "none",
              }}
            />
            <button
              onClick={onApplyPromo}
              disabled={!promoInput.trim() || promoLoading}
              style={{
                background: promoInput.trim() && !promoLoading ? GOLD : "rgba(232,201,126,0.12)",
                color: promoInput.trim() && !promoLoading ? NAVY : "rgba(232,201,126,0.3)",
                border: "none", borderRadius: 999, padding: "0 20px",
                fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
                textTransform: "uppercase", cursor: promoInput.trim() ? "pointer" : "not-allowed",
                whiteSpace: "nowrap",
              }}
            >
              {promoLoading ? "…" : "Apply"}
            </button>
          </div>
        )}
        {promoError && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(232,201,126,0.7)", marginTop: 8, fontStyle: "italic" }}>
            {promoError}
          </div>
        )}
      </div>

      {/* Card input */}
      <div style={{ marginBottom: 20 }}>
        <label style={CS.label}>card details</label>
        <div style={{ padding: "15px 18px", background: "rgba(245,240,232,0.045)", border: `1px solid rgba(232,201,126,0.25)`, borderRadius: 14 }}>
          <CardElement
            options={{
              style: {
                base: { fontFamily: "Inter, -apple-system, sans-serif", fontSize: "16px", color: "#F5F0E8", "::placeholder": { color: "rgba(245,240,232,0.35)" } },
                invalid: { color: "#E8C97E" },
              },
              hidePostalCode: true,
            }}
            onChange={(e) => { setCardComplete(e.complete); if (e.error) setError(e.error.message); else if (error) setError(""); }}
          />
        </div>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginBottom: 20 }}>
        Receipt will be sent to <strong>{contact.email}</strong>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_FAINT, lineHeight: 1.6, marginBottom: 24 }}>
        Cancel 72 hours or more before your event for a full deposit refund. Cancellations within 72 hours forfeit the deposit.
      </div>

      {error && <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PERSIMMON, marginBottom: 16, fontStyle: "italic" }}>{error}</div>}

      <button
        onClick={submit}
        disabled={processing || !stripe || !cardComplete}
        className="book-cta" style={{ ...CS.cta, ...(processing || !stripe || !cardComplete ? CS.ctaDisabled : {}), width: "100%" }}
      >
        {processing ? "Processing…" : `Pay ${formatUSD(effectiveDeposit)} & Confirm Booking`}
      </button>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────
function ConfirmationScreen({ confirmation, onReset }) {
  if (!confirmation) return null;
  const { id, quote, menuOrder, eventDate, eventTime, total, deposit, balance, email } = confirmation;

  return (
    <div style={{ ...CS.card, textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 52, color: PERSIMMON, marginBottom: 4 }}>確認</div>
      <div style={{ height: 2, width: 48, background: PERSIMMON, margin: "0 auto 24px" }} />
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: CREAM, marginBottom: 8 }}>booking confirmed</h1>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK_SOFT, fontStyle: "italic", marginBottom: 36 }}>
        your Sonakase™ event is on the calendar.
      </p>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: PERSIMMON, letterSpacing: "0.1em", marginBottom: 32 }}>#{id}</div>
      <div style={{ background: "rgba(13,13,13,0.5)", border: "1px solid rgba(232,201,126,0.15)", borderRadius: 16, padding: "20px 24px", marginBottom: 28, textAlign: "left" }}>
        <SummaryRow label="Experience"   value={`${quote.board.name} · ${quote.guests} guests`} />
        <SummaryRow label="Date"         value={fmtDate(eventDate)} />
        <SummaryRow label="Time"         value={fmtTime(eventTime)} />
        <SummaryRow label="Total"        value={formatUSD(total)} />
        <SummaryRow label="Deposit Paid" value={formatUSD(deposit)} highlight />
        <SummaryRow label="Balance Due"  value={formatUSD(balance)} />
      </div>
      {menuOrder && (
        <div style={{ background: "rgba(13,13,13,0.5)", border: "1px solid rgba(232,201,126,0.15)", borderRadius: 16, padding: "18px 24px", marginBottom: 28, textAlign: "left" }}>
          <div style={{ ...CS.label, marginBottom: 10 }}>your menu</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.6 }}>{menuOrder.rollNames.join(", ")}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", marginTop: 6, lineHeight: 1.6 }}>
            Nigiri: chef&rsquo;s choice{menuOrder.sashimi ? " · sashimi course" : ""}
          </div>
        </div>
      )}
      <div style={{ background: "rgba(232,201,126,0.04)", border: `1px solid rgba(232,201,126,0.2)`, borderLeft: `2px solid ${GOLD}`, borderRadius: 14, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>what happens next</div>
        <ul style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.9, paddingLeft: 18, fontStyle: "italic", margin: 0 }}>
          <li>Your chef will review your notes before the event</li>
          <li>Chef arrives 30 minutes before your selected time to set up</li>
          <li>Balance is due at the event — cash or card accepted</li>
          <li>Check your email for your receipt</li>
        </ul>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginBottom: 16, lineHeight: 1.6 }}>
        Don&rsquo;t see the confirmation email? Check your spam — look for bookings@sonakase.com
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, marginBottom: 32, lineHeight: 1.6 }}>
        Save your confirmation number — you can view this booking anytime at{" "}
        <a href={`/lookup?c=${encodeURIComponent(id)}${email ? `&e=${encodeURIComponent(email)}` : ""}`} style={{ color: GOLD, textDecoration: "underline" }}>
          the booking lookup page
        </a>.
      </div>
      <a href="/" style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, textDecoration: "underline" }}>
        ← Back to Sonakase™
      </a>
    </div>
  );
}

// ── Book Header ───────────────────────────────────────────────
function BookHeader() {
  return (
    <header style={{ background: "rgba(13,13,13,0.72)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(232,201,126,0.15)" }}>
      <div className="book-header-inner" style={{ maxWidth: 760, margin: "0 auto", padding: "9px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <Image src="/sonakase-logo.svg" alt="Sonakase Private Dining" width={280} height={82} priority className="book-header-logo" />
        </a>
        <a href="/lookup" style={{ fontFamily: FONT_UI, fontSize: 12, color: "rgba(232,201,126,0.8)", textDecoration: "none", letterSpacing: "0.04em" }}>
          find a booking
        </a>
      </div>
    </header>
  );
}

// ── Shared Components ─────────────────────────────────────────
function StepHeader({ kanji, eyebrow, title, subtitle }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: GOLD, opacity: 0.4, lineHeight: 1 }}>{kanji}</span>
        <div style={{ height: 1, flex: 1, background: "rgba(232,201,126,0.15)" }} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(232,201,126,0.6)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{eyebrow}</span>
      </div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 400, color: CREAM, margin: "0 0 8px" }}>{title}</h1>
      {subtitle && <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK_SOFT, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>{subtitle}</p>}
    </div>
  );
}

function SummaryRow({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px dotted rgba(232,201,126,0.12)", gap: 16 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(232,201,126,0.7)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 400, flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: highlight ? 16 : 14, color: highlight ? GOLD : CREAM, textAlign: "right", fontWeight: 400 }}>{value}</span>
    </div>
  );
}

// ── Book Styles ───────────────────────────────────────────────
function BookStyles() {
  return (
    <style>{`
      @keyframes bookFadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      input::placeholder { color: rgba(245,240,232,0.35); }
      input:focus, textarea:focus, select:focus {
        outline: none;
        border-color: rgba(232,201,126,0.6) !important;
        box-shadow: 0 0 0 3px rgba(232,201,126,0.12);
      }
      button { font-family: inherit; }
      select option { background: #141414; color: #F5F0E8; }

      :root { --header-h: 100px; }
      @media (max-width: 768px) { :root { --header-h: 72px; } }

      .book-page-wrapper { padding-top: calc(100px + var(--banner-h, 0px)); }

      .book-cta {
        position: relative;
        overflow: hidden;
        transition: transform 0.3s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.3s cubic-bezier(0.34,1.3,0.64,1);
      }
      .book-cta::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%);
        transform: translateX(-120%);
        transition: transform 0.6s ease;
        pointer-events: none;
      }
      .book-cta:disabled::after { display: none; }
      .book-cta:not(:disabled):hover {
        transform: translateY(-2px) scale(1.01);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 10px 32px rgba(232,201,126,0.3);
      }
      .book-cta:not(:disabled):hover::after { transform: translateX(120%); }
      .book-cta:not(:disabled):active {
        transform: scale(0.97);
        box-shadow: 0 3px 12px rgba(232,201,126,0.15);
      }

      .book-signout { transition: border-color 0.2s, color 0.2s; }
      .book-signout:hover { border-color: #E8C97E !important; color: #fff8ec !important; }

      .book-select-card { transition: background 0.15s, border-color 0.15s, opacity 0.15s, transform 0.15s; }
      .book-select-card:not(:disabled):hover { border-color: rgba(232,201,126,0.5) !important; }
      .book-select-card:not(:disabled):active { transform: scale(0.99); }
      .book-chefs-btn:hover { background: rgba(232,201,126,0.08) !important; }

      @media (prefers-reduced-motion: reduce) {
        .book-cta, .book-signout { transition: none !important; }
        .book-cta::after { display: none; }
        .book-cta:not(:disabled):hover { transform: none; }
      }

      @media (max-width: 768px) {
        .book-header-inner { padding: 7px 16px !important; }
        .book-header-logo  { width: 200px !important; height: 58px !important; }
        .book-page-wrapper { padding-top: calc(72px + var(--banner-h, 0px)); }
        .book-card         { padding: 24px 16px !important; }
        .book-contact-grid { grid-template-columns: 1fr !important; }
        .book-board-grid   { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}

// ── Component Styles ──────────────────────────────────────────
const CS = {
  card: {
    background: "linear-gradient(180deg, rgba(245,240,232,0.04) 0%, rgba(245,240,232,0.015) 100%)",
    border: "1px solid rgba(232,201,126,0.14)",
    borderRadius: 24,
    boxShadow: "inset 0 1px 0 rgba(245,240,232,0.06), 0 4px 24px rgba(0,0,0,0.25)",
    padding: "36px 32px",
  },
  label: {
    display: "block", fontFamily: FONT_UI, fontSize: 11, color: GOLD,
    letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 8,
  },
  input: {
    display: "block", width: "100%", padding: "13px 16px",
    border: `1px solid rgba(232,201,126,0.18)`, background: "rgba(245,240,232,0.045)",
    borderRadius: 14,
    fontFamily: FONT_UI, fontSize: 15, color: CREAM,
    boxSizing: "border-box",
  },
  cta: {
    display: "block", width: "100%", padding: "16px",
    background: `linear-gradient(180deg, #F0D796 0%, ${GOLD} 100%)`, color: NAVY, border: "none",
    borderRadius: 999,
    fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
    textTransform: "uppercase", cursor: "pointer", minHeight: 52,
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0,0,0,0.3), 0 6px 20px rgba(232,201,126,0.12)",
  },
  ctaDisabled: {
    background: "rgba(232,201,126,0.15)", color: "rgba(232,201,126,0.3)", cursor: "not-allowed",
    boxShadow: "none",
  },
  chefsBtn: {
    display: "block", width: "100%", padding: "13px", marginBottom: 24,
    background: "transparent", color: GOLD, border: `1px solid rgba(232,201,126,0.5)`,
    borderRadius: 999, boxShadow: "none",
    fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", cursor: "pointer", minHeight: 48, textAlign: "center",
  },
  pickerHead: {
    display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: 12,
  },
  counter: {
    fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
    color: "rgba(232,201,126,0.85)", textTransform: "uppercase",
  },
};
