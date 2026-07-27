"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  quoteForGuests, totalAfterDiscount, EVENT_INCLUDES, PIECES_PER_GUEST, MIN_GUESTS, MAX_GUESTS, formatUSD,
} from "@/lib/pricing";

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
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser]                     = useState(null);
  const [guestInput, setGuestInput]         = useState("");
  const [eventDate, setEventDate]           = useState("");
  const [eventTime, setEventTime]           = useState("");
  const [eventAddress, setEventAddress]     = useState("");
  const [chefNotes, setChefNotes]           = useState("");
  const [confirmation, setConfirmation]     = useState(null);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get("code");
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/book");
        if (data?.user) {
          setUser({ email: data.user.email });
          setSessionChecked(true);
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUser({ email: session.user.email });
      setSessionChecked(true);
    })();
  }, []);

  // The quote is derived from the guest count on every render — no stored
  // tier state — so changing the count re-resolves tier, total, and deposit.
  const guests    = parseInt(guestInput, 10);
  const quote     = Number.isFinite(guests) && guests >= 1 ? quoteForGuests(guests) : null;
  const tooMany   = Number.isFinite(guests) && guests > MAX_GUESTS;

  const daysOut = eventDate ? (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((new Date(eventDate + "T00:00:00") - today) / 86400000);
  })() : 0;
  const dateValid    = eventDate && eventTime && daysOut >= 7;
  const readyForPay  = !!quote && dateValid;

  const reset = () => {
    setGuestInput(""); setEventDate(""); setEventTime("");
    setEventAddress(""); setChefNotes(""); setConfirmation(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ minHeight: "100vh", background: NAVY, fontFamily: FONT_BODY, color: CREAM, overflowX: "hidden" }} className="book-page-wrapper">
      <BookStyles />
      <BookHeader user={user} onSignOut={async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        await sb.auth.signOut();
        window.location.href = "/";
      }} />

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 120px", boxSizing: "border-box" }}>
        {!sessionChecked && (
          <div style={{ textAlign: "center", padding: "120px 0", fontFamily: FONT_DISPLAY, fontSize: 15, color: "rgba(245,240,232,0.25)", letterSpacing: "0.1em" }}>Loading…</div>
        )}

        {sessionChecked && !user && (
          <LoginScreen onLogin={(email) => setUser({ email })} />
        )}

        {sessionChecked && user && confirmation && (
          <ConfirmationScreen confirmation={confirmation} onReset={reset} />
        )}

        {sessionChecked && user && !confirmation && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* Guest count → tier resolves automatically */}
            <div style={CS.card}>
              <StepHeader kanji="客" eyebrow="your event" title="how many guests?" subtitle={`${MIN_GUESTS} to ${MAX_GUESTS} guests. the tier and total resolve automatically.`} />
              <label style={CS.label}>guest count</label>
              <input
                type="number"
                inputMode="numeric"
                min={1} max={MAX_GUESTS + 1}
                value={guestInput}
                onChange={(e) => setGuestInput(e.target.value)}
                placeholder="Enter number of guests"
                style={{ ...CS.input, maxWidth: 260 }}
              />

              {tooMany && <Over50Panel />}
              {quote && <TierPanel quote={quote} />}
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
                    Rush bookings may be available — reach out and we&rsquo;ll do our best to make it work.
                  </div>
                  <a href={`/?subject=${encodeURIComponent("I'd like to request an event within 7 days")}#contact`} style={{ display: "inline-block", marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: GOLD, letterSpacing: "0.1em", textDecoration: "none" }}>
                    Contact us →
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
                    Chef arrives about 30 minutes early to set up — service begins at {fmtTime(eventTime)} and runs roughly ninety minutes.
                  </div>
                )}
              </div>
            </div>

            {/* Contact details & preferences */}
            <div style={CS.card}>
              <StepHeader kanji="宛" eyebrow="details" title="where, and anything we should know" />
              <div style={{ marginBottom: 24 }}>
                <label style={CS.label}>event address</label>
                <input
                  type="text"
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
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginTop: 14 }}>
                Booking as <strong style={{ color: INK_SOFT }}>{user.email}</strong> — your receipt goes here.
              </div>
            </div>

            {/* Payment — appears once guests + date + time are set */}
            {readyForPay ? (
              <PaymentSection
                quote={quote}
                user={user}
                eventDate={eventDate}
                eventTime={eventTime}
                eventAddress={eventAddress}
                chefNotes={chefNotes}
                onConfirm={(id, totals) => {
                  setConfirmation({ id, quote, eventDate, eventTime, ...totals });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ) : (
              <div style={{ ...CS.card, textAlign: "center", fontFamily: FONT_BODY, fontSize: 14, color: INK_FAINT, fontStyle: "italic" }}>
                {tooMany
                  ? "Events over 50 guests are booked through the contact form above."
                  : "Enter your guest count, date, and time to continue to payment."}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Tier panel — live quote under the guest input ─────────────
function TierPanel({ quote }) {
  const { tier, guests, total, deposit, balance, minimumApplied } = quote;
  const belowRange = guests < MIN_GUESTS;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ background: "rgba(232,201,126,0.05)", border: "1px solid rgba(232,201,126,0.3)", borderRadius: 16, padding: "22px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: GOLD }}>{tier.name}</div>
          <div style={{ fontFamily: FONT_UI, fontSize: 11, color: "rgba(232,201,126,0.7)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            {tier.minGuests}–{tier.maxGuests} guests · {formatUSD(tier.perGuest)} per guest
          </div>
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", marginBottom: 16 }}>{tier.tagline}</div>

        <SummaryRow label="Total"                value={formatUSD(total)} highlight />
        <SummaryRow label="Deposit due today"    value={formatUSD(deposit)} />
        <SummaryRow label="Balance due at event" value={formatUSD(balance)} />

        {minimumApplied && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(232,201,126,0.75)", fontStyle: "italic", marginTop: 12 }}>
            {formatUSD(tier.eventMinimum)} event minimum applies at this guest count.
          </div>
        )}
        {belowRange && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", marginTop: 6 }}>
            Smaller gathering? You&rsquo;re welcome to book — the event minimum covers parties under {MIN_GUESTS}.
          </div>
        )}

        <div style={{ height: 1, background: "rgba(232,201,126,0.15)", margin: "18px 0 14px" }} />
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.65, marginBottom: 14 }}>
          The menu is the chef&rsquo;s choice that day — about {PIECES_PER_GUEST} pieces per guest, built around the freshest catch.
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
        Events this size are planned directly with the chef. Tell us about your event and we&rsquo;ll build it together.
      </div>
      <a
        href={`/?subject=${encodeURIComponent(`Large event inquiry (over ${MAX_GUESTS} guests)`)}#contact`}
        style={{ display: "inline-block", fontFamily: FONT_BODY, fontSize: 13, color: GOLD, letterSpacing: "0.1em", textDecoration: "none" }}
      >
        Contact us →
      </a>
    </div>
  );
}

// ── Payment ───────────────────────────────────────────────────
function PaymentSection({ quote, user, eventDate, eventTime, eventAddress, chefNotes, onConfirm }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [intentError, setIntentError]   = useState(null);
  const [promoInput, setPromoInput]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState("");

  // Discounts apply first; the event minimum is applied LAST (in
  // totalAfterDiscount), so no booking settles below its tier floor.
  // The deposit stays fixed by tier regardless of promos.
  const effectiveTotal   = appliedPromo ? totalAfterDiscount(quote, appliedPromo.discount_amount) : quote.total;
  const promoSavings     = quote.total - effectiveTotal; // actual reduction after the floor
  const effectiveDeposit = quote.deposit;
  const effectiveBalance = Math.round((effectiveTotal - effectiveDeposit) * 100) / 100;

  // Recreate the payment intent whenever the amount changes (tier change or promo)
  useEffect(() => {
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
  }, [effectiveDeposit]);

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
      <div style={{ padding: "40px 0", fontFamily: FONT_BODY, fontSize: 15, color: PERSIMMON, fontStyle: "italic" }}>
        {intentError} — please try again or contact us directly.
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
        quote={quote} user={user}
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

function PaymentForm({ clientSecret, quote, user, eventDate, eventTime, eventAddress, chefNotes, appliedPromo, promoSavings, effectiveTotal, effectiveDeposit, effectiveBalance, promoInput, setPromoInput, promoLoading, promoError, onApplyPromo, onRemovePromo, onConfirm }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const [processing, setProcessing]     = useState(false);
  const [error, setError]               = useState("");
  const [cardComplete, setCardComplete] = useState(false);

  const { tier, guests } = quote;

  const submit = async () => {
    if (!stripe || !elements || !cardComplete) return;
    setProcessing(true); setError("");

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement), billing_details: { email: user.email } },
    });

    if (stripeError) { setError(stripeError.message); setProcessing(false); return; }
    if (paymentIntent.status !== "succeeded") { setError("Payment did not complete. Please try again."); setProcessing(false); return; }

    const confirmationId = `CS${Date.now().toString(36).toUpperCase().slice(-6)}`;

    const saveRes = await fetch("/api/save-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_email: user.email,
        package: tier.name,
        service_type: "countertop",
        event_date: eventDate,
        event_time: eventTime,
        guest_count: guests,
        price_per_guest: tier.perGuest,
        total_price: effectiveTotal,
        deposit_amount: effectiveDeposit,
        delivery_address: eventAddress || null,
        special_requests: chefNotes,
        status: "pending",
        confirmation_number: confirmationId,
        stripe_payment_intent_id: paymentIntent.id,
        ...(appliedPromo ? { promo_code: appliedPromo.code, discount_amount: promoSavings } : {}),
      }),
    });
    const saveData = await saveRes.json();
    if (!saveData.success) {
      setError(`Booking could not be saved: ${saveData.error}. Your payment was charged — please contact us directly.`);
      setProcessing(false); return;
    }

    await Promise.allSettled([
      fetch("/api/send-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          confirmationId,
          serviceType: "countertop",
          packageName: tier.name,
          eventDate, eventTime,
          guestCount: guests,
          pricePerGuest: tier.perGuest,
          total: effectiveTotal,
          deposit: effectiveDeposit,
          chefNotes,
          ...(appliedPromo ? { promoCode: appliedPromo.code, discountAmount: promoSavings } : {}),
        }),
      }),
      fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "countertop",
          clientEmail: user.email,
          confirmationId,
          packageName: tier.name,
          eventDate, eventTime,
          guestCount: guests,
          pricePerGuest: tier.perGuest,
          total: effectiveTotal,
          deposit: effectiveDeposit,
          deliveryAddress: eventAddress || null,
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
    onConfirm(confirmationId, { total: effectiveTotal, deposit: effectiveDeposit, balance: effectiveBalance });
  };

  return (
    <div style={CS.card}>
      <StepHeader kanji="払" eyebrow="secure payment" title="reserve with your deposit" subtitle="the balance is due at the event." />

      {/* Review + deposit panel */}
      <div style={{ background: "rgba(13,13,13,0.6)", border: "1px solid rgba(232,201,126,0.15)", borderRadius: 16, color: CREAM, padding: "22px 26px", marginBottom: 28 }}>
        <SummaryRow label="Experience" value={`${tier.name} · ${guests} guests`} />
        <SummaryRow label="Date"       value={fmtDate(eventDate)} />
        <SummaryRow label="Time"       value={fmtTime(eventTime)} />
        <SummaryRow label="Total"      value={formatUSD(effectiveTotal)} />
        {appliedPromo && promoSavings > 0 && (
          <SummaryRow label={`Promo (${appliedPromo.code})`} value={`−${formatUSD(promoSavings)}`} />
        )}
        {appliedPromo && promoSavings === 0 && (
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_FAINT, fontStyle: "italic", padding: "9px 0" }}>
            {appliedPromo.code} applied — the {formatUSD(quote.tier.eventMinimum)} event minimum still sets this total.
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
        Receipt will be sent to <strong>{user.email}</strong>
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
  const { id, quote, eventDate, eventTime, total, deposit, balance } = confirmation;

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
        <SummaryRow label="Experience"   value={`${quote.tier.name} · ${quote.guests} guests`} />
        <SummaryRow label="Date"         value={fmtDate(eventDate)} />
        <SummaryRow label="Time"         value={fmtTime(eventTime)} />
        <SummaryRow label="Total"        value={formatUSD(total)} />
        <SummaryRow label="Deposit Paid" value={formatUSD(deposit)} highlight />
        <SummaryRow label="Balance Due"  value={formatUSD(balance)} />
      </div>
      <div style={{ background: "rgba(232,201,126,0.04)", border: `1px solid rgba(232,201,126,0.2)`, borderLeft: `2px solid ${GOLD}`, borderRadius: 14, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>what happens next</div>
        <ul style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.9, paddingLeft: 18, fontStyle: "italic", margin: 0 }}>
          <li>Your chef will review your notes before the event</li>
          <li>Chef arrives 30 minutes before your selected time to set up</li>
          <li>Balance is due at the event — cash or card accepted</li>
          <li>Check your email for your receipt</li>
        </ul>
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginBottom: 32, lineHeight: 1.6 }}>
        Don&rsquo;t see the confirmation email? Check your spam — look for bookings@sonakase.com
      </div>
      <a href="/" style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, textDecoration: "underline" }}>
        ← Back to Sonakase™
      </a>
    </div>
  );
}

// ── Login Screen ──────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) { onLogin(session.user.email); return; }
      const { data: { subscription } } = sb.auth.onAuthStateChange((_, s) => {
        if (s?.user) onLogin(s.user.email);
      });
      unsub = () => subscription.unsubscribe();
    })();
    return () => unsub();
  }, []);

  const submit = async () => {
    if (!email.includes("@") || email.length < 5) { setError("Enter a valid email"); return; }
    setLoading(true);
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { error: authError } = await sb.auth.signInWithOtp({
      email, options: { emailRedirectTo: "https://www.sonakase.com/auth/callback?next=/book" },
    });
    setLoading(false);
    if (authError) setError(authError.message || "Failed to send link. Try again.");
    else setSent(true);
  };

  return (
    <div style={CS.card}>
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 48, color: PERSIMMON, opacity: 0.25, lineHeight: 1, marginBottom: 16 }}>寿司</div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: CREAM, marginBottom: 8 }}>Sign in to book</h1>
        <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK_SOFT, fontStyle: "italic" }}>
          We&rsquo;ll email you a secure link. No password needed.
        </p>
      </div>

      {sent ? (
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: GOLD, fontStyle: "italic", lineHeight: 1.6, marginBottom: 10 }}>
            Check your email for a sign-in link. Come back to this page after clicking it.
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", lineHeight: 1.6 }}>
            Don&rsquo;t see it? Check spam — look for bookings@sonakase.com
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={CS.label}>email address</label>
            <input
              type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              style={CS.input}
            />
            {error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PERSIMMON, marginTop: 6 }}>{error}</div>}
          </div>
          <button onClick={submit} disabled={loading} className="book-cta" style={{ ...CS.cta, width: "100%" }}>
            {loading ? "Sending…" : "Send Sign-In Link →"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Book Header ───────────────────────────────────────────────
function BookHeader({ user, onSignOut }) {
  return (
    <header style={{ background: "rgba(13,13,13,0.72)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(232,201,126,0.15)" }}>
      <div className="book-header-inner" style={{ maxWidth: 760, margin: "0 auto", padding: "9px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <Image src="/sonakase-logo.svg" alt="Sonakase Private Dining" width={280} height={82} priority className="book-header-logo" />
        </a>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "rgba(245,240,232,0.45)", fontStyle: "italic" }}>{user.email}</span>
            <button onClick={onSignOut} className="book-signout" style={{ background: "rgba(232,201,126,0.05)", border: `1px solid rgba(232,201,126,0.4)`, borderRadius: 999, color: GOLD, padding: "7px 16px", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_UI }}>
              Sign out
            </button>
          </div>
        )}
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
};
