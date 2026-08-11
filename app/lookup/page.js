"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

const NAVY      = "#0d0d0d";
const CREAM     = "#F5F0E8";
const GOLD      = "#E8C97E";
const INK_SOFT  = "rgba(245,240,232,0.6)";
const INK_FAINT = "rgba(245,240,232,0.35)";
const FONT_DISPLAY = `'Shippori Mincho', Georgia, serif`;
const FONT_BODY    = `'Shippori Mincho', Georgia, serif`;
const FONT_UI      = `'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif`;

const fmt2 = (n) => (n != null ? `$${Number(n).toFixed(2)}` : null);
const fmtDate = (d) => {
  if (!d) return null;
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};
const fmtTime = (v) => {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  const hour12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  return `${hour12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function LookupPage() {
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail]               = useState("");
  const [booking, setBooking]           = useState(null);
  const [error, setError]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [cancelState, setCancelState]   = useState("idle"); // idle | sending | sent

  // Prefill from confirmation email links: /lookup?c=CSXXXX&e=you@example.com
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("c"), e = params.get("e");
    if (c) setConfirmation(c);
    if (e) setEmail(e);
  }, []);

  const submit = async (ev) => {
    ev?.preventDefault();
    if (!confirmation.trim() || !email.includes("@")) return;
    setLoading(true); setError(""); setBooking(null); setCancelState("idle");
    try {
      const res  = await fetch("/api/lookup-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation, email }),
      });
      const data = await res.json();
      if (data.booking) setBooking(data.booking);
      else setError(data.error || "No booking found.");
    } catch {
      setError("Lookup failed. Please try again.");
    }
    setLoading(false);
  };

  const requestCancellation = async () => {
    if (!booking || cancelState !== "idle") return;
    setCancelState("sending");
    try {
      await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cancellation_request",
          clientEmail: booking.user_email,
          confirmationId: booking.confirmation_number,
          eventDate: booking.event_date,
          packageName: booking.package,
        }),
      });
      setCancelState("sent");
    } catch {
      setCancelState("idle");
    }
  };

  const balance = booking && booking.total_price != null && booking.deposit_amount != null
    ? Number(booking.total_price) - Number(booking.deposit_amount)
    : null;

  const sels        = booking && Array.isArray(booking.selections) ? booking.selections : [];
  const lookupRolls = sels.filter((s) => s.item_type === "roll").map((s) => s.name_snapshot);
  const hasSashimi  = booking && Array.isArray(booking.addons) && booking.addons.some((a) => a.addon_id === "sashimi");
  const hasMenu     = lookupRolls.length || hasSashimi;

  return (
    <div style={{ minHeight: "100vh", background: NAVY, fontFamily: FONT_BODY, color: CREAM, paddingTop: "calc(100px + var(--banner-h, 0px))" }}>
      <style>{`
        input::placeholder { color: rgba(245,240,232,0.35); }
        input:focus { outline: none; border-color: rgba(232,201,126,0.6) !important; box-shadow: 0 0 0 3px rgba(232,201,126,0.12); }
        @media (max-width: 768px) { .lookup-header-logo { width: 200px !important; height: 58px !important; } }
      `}</style>

      <header style={{ background: "rgba(13,13,13,0.72)", backdropFilter: "blur(20px) saturate(160%)", WebkitBackdropFilter: "blur(20px) saturate(160%)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, borderBottom: "1px solid rgba(232,201,126,0.15)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "9px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <Image src="/sonakase-logo.svg" alt="Sonakase Private Dining" width={280} height={82} priority className="lookup-header-logo" />
          </a>
          <a href="/book" style={{ fontFamily: FONT_UI, fontSize: 12, color: "rgba(232,201,126,0.8)", textDecoration: "none", letterSpacing: "0.04em" }}>
            book an event
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 120px", boxSizing: "border-box" }}>
        <div style={CS.card}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 400, color: CREAM, margin: "0 0 8px" }}>find your booking</h1>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK_SOFT, fontStyle: "italic", margin: 0, lineHeight: 1.5 }}>
              Enter the confirmation number from your receipt and the email used to book.
            </p>
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={CS.label}>confirmation number</label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                placeholder="CSXXXXXX"
                style={CS.input}
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={CS.label}>email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={CS.input}
              />
            </div>
            <button type="submit" disabled={loading || !confirmation.trim() || !email.includes("@")} style={{ ...CS.cta, opacity: loading ? 0.6 : 1 }}>
              {loading ? "Looking up…" : "Find Booking"}
            </button>
          </form>

          {error && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: GOLD, fontStyle: "italic", marginTop: 18, lineHeight: 1.6 }}>
              {error}
            </div>
          )}
        </div>

        {booking && (
          <div style={{ ...CS.card, marginTop: 24 }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 20, color: GOLD, letterSpacing: "0.08em", marginBottom: 18 }}>
              #{booking.confirmation_number}
            </div>
            <Row label="Experience" value={booking.package} />
            {booking.contact_name && <Row label="Name" value={booking.contact_name} />}
            <Row label="Date"       value={fmtDate(booking.event_date)} />
            <Row label="Time"       value={fmtTime(booking.event_time)} />
            <Row label="Guests"     value={booking.guest_count ? `${booking.guest_count} guests` : null} />
            <Row label="Address"    value={booking.delivery_address} />
            <Row label="Status"     value={booking.status} />
            <Row label="Total"      value={fmt2(booking.total_price)} />
            {booking.promo_code && booking.discount_amount > 0 && (
              <Row label={`Promo (${booking.promo_code})`} value={`−${fmt2(booking.discount_amount)}`} />
            )}
            <Row label="Deposit Paid" value={fmt2(booking.deposit_amount)} highlight />
            <Row label="Balance Due"  value={fmt2(balance)} />
            <Row label="Notes"        value={booking.special_requests} />

            {hasMenu ? (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(232,201,126,0.15)" }}>
                <div style={{ fontFamily: FONT_UI, fontSize: 11, color: GOLD, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>your menu</div>
                {lookupRolls.length > 0 && (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.6, marginBottom: 6 }}>
                    <span style={{ color: "rgba(232,201,126,0.8)" }}>Rolls:</span> {lookupRolls.join(", ")}
                  </div>
                )}
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.6, marginBottom: 6 }}>
                  <span style={{ color: "rgba(232,201,126,0.8)" }}>Nigiri:</span> Chef&rsquo;s choice at the event
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.6 }}>
                  <span style={{ color: "rgba(232,201,126,0.8)" }}>Sashimi course:</span> {hasSashimi ? "Yes" : "No"}
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: 24, fontFamily: FONT_BODY, fontSize: 12, color: INK_FAINT, lineHeight: 1.6 }}>
              Cancel 72 hours or more before the event for a full deposit refund. Cancellations within 72 hours forfeit the deposit.
            </div>
            {cancelState === "sent" ? (
              <div style={{ marginTop: 14, fontFamily: FONT_BODY, fontSize: 14, color: GOLD, fontStyle: "italic" }}>
                Cancellation request sent — you&rsquo;ll hear back by email shortly.
              </div>
            ) : (
              <button
                onClick={requestCancellation}
                disabled={cancelState === "sending"}
                style={{ marginTop: 14, background: "none", border: "1px solid rgba(232,201,126,0.3)", borderRadius: 999, color: "rgba(232,201,126,0.7)", padding: "10px 20px", fontFamily: FONT_UI, fontSize: 12, cursor: "pointer" }}
              >
                {cancelState === "sending" ? "Sending…" : "Request cancellation"}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "9px 0", borderBottom: "1px dotted rgba(232,201,126,0.12)", gap: 16 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(232,201,126,0.7)", letterSpacing: "0.18em", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
      <span style={{ fontFamily: FONT_DISPLAY, fontSize: highlight ? 16 : 14, color: highlight ? GOLD : CREAM, textAlign: "right" }}>{value}</span>
    </div>
  );
}

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
    border: "1px solid rgba(232,201,126,0.18)", background: "rgba(245,240,232,0.045)",
    borderRadius: 14,
    fontFamily: FONT_UI, fontSize: 15, color: CREAM,
    boxSizing: "border-box",
  },
  cta: {
    display: "block", width: "100%", padding: "16px",
    background: "linear-gradient(180deg, #F0D796 0%, #E8C97E 100%)", color: "#0d0d0d", border: "none",
    borderRadius: 999,
    fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
    textTransform: "uppercase", cursor: "pointer", minHeight: 52, textAlign: "center",
  },
};
