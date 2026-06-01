"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = typeof window !== "undefined"
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null;

// ── Sonkase palette ───────────────────────────────────────────
const BG    = "#0d0d0d";
const BG2   = "#141414";
const GOLD  = "#E8C97E";
const CREAM = "#F5F0E8";
const MUTED = "rgba(245,240,232,0.55)";
const FAINT = "rgba(245,240,232,0.3)";
const F     = "Georgia, 'Times New Roman', serif";

const STATUS_STYLE = {
  confirmed: { color: GOLD,                        border: GOLD },
  pending:   { color: "rgba(232,201,126,0.65)",    border: "rgba(232,201,126,0.65)" },
  cancelled: { color: "rgba(245,240,232,0.3)",     border: "rgba(245,240,232,0.3)" },
};

function fmtDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function fmt2(n) {
  if (n == null) return null;
  return "$" + Number(n).toFixed(2);
}

function SectionLabel({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
      <span style={{ fontFamily: F, fontSize: 10, color: "rgba(232,201,126,0.6)", letterSpacing: "0.3em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {children}
      </span>
      <div style={{ flex: 1, height: 1, background: "rgba(232,201,126,0.12)" }} />
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="profile-detail-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "8px 0", borderBottom: "1px dotted rgba(232,201,126,0.1)", gap: 16 }}>
      <span className="profile-detail-label" style={{ fontFamily: F, fontSize: 10, color: "rgba(232,201,126,0.7)", letterSpacing: "0.2em", textTransform: "uppercase", flexShrink: 0, marginRight: 16 }}>
        {label}
      </span>
      <span className="profile-detail-value" style={{ fontFamily: F, fontSize: 14, color: CREAM, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

function CancellationModal({ booking, onClose, onConfirm, sending }) {
  const balance = booking.total_price != null && booking.deposit_amount != null
    ? Number(booking.total_price) - Number(booking.deposit_amount)
    : null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: BG2, maxWidth: 480, width: "100%", padding: "36px 32px",
        border: `1px solid rgba(232,201,126,0.2)`, borderTop: `2px solid ${GOLD}`,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontFamily: F, fontSize: 22, color: CREAM, marginBottom: 8 }}>Request Cancellation</div>
        <div style={{ fontFamily: F, fontSize: 13, color: MUTED, fontStyle: "italic", marginBottom: 24 }}>
          Confirmation #{booking.confirmation_number || "—"}
        </div>

        <div style={{ background: "rgba(232,201,126,0.06)", border: `1px solid rgba(232,201,126,0.2)`, borderLeft: `2px solid ${GOLD}`, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontFamily: F, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
            You qualify for a full refund
          </div>
          <div style={{ fontFamily: F, fontSize: 13, color: CREAM, lineHeight: 1.6 }}>
            Your event is more than 72 hours away. A full refund of{" "}
            <strong>${Number(booking.deposit_amount || 0).toFixed(2)}</strong> (deposit) will be issued.
            {balance != null && balance > 0 && ` No additional charges apply.`}
          </div>
        </div>

        <div style={{ fontFamily: F, fontSize: 12, color: FAINT, fontStyle: "italic", marginBottom: 24, lineHeight: 1.6 }}>
          Cancellation policy: Full refund 72+ hours before event. Cancellations within 72 hours forfeit the deposit.
        </div>

        <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
          <button
            onClick={onConfirm}
            disabled={sending}
            style={{
              background: GOLD, color: BG, border: "none",
              padding: "14px", fontFamily: F, fontSize: 13, letterSpacing: "0.15em",
              textTransform: "uppercase", cursor: sending ? "wait" : "pointer",
              opacity: sending ? 0.7 : 1, minHeight: 52,
            }}
          >
            {sending ? "Sending…" : "Submit Cancellation Request →"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none", border: `1px solid rgba(232,201,126,0.25)`, color: MUTED,
              padding: "12px", fontFamily: F, fontSize: 13, cursor: "pointer",
            }}
          >
            Keep My Booking
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingCard({ booking: b, expanded, onToggle }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSending, setCancelSending] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const ss  = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
  const pkg = b.package || "—";
  const serviceLabel = b.service_type === "dropoff" ? "Drop-Off"
    : b.service_type === "omakase" ? "Omakase"
    : b.service_type === "datenight" ? "Date Night Omakase"
    : "Chef-Attended";

  const hoursUntilEvent = b.event_date
    ? (new Date(b.event_date + "T00:00:00") - new Date()) / 3600000
    : 0;
  const canRequestCancellation =
    (b.status === "pending" || b.status === "confirmed") &&
    hoursUntilEvent > 72 &&
    !cancelDone;

  const submitCancellation = async () => {
    setCancelSending(true);
    try {
      await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "cancellation_request",
          clientEmail: b.user_email,
          confirmationId: b.confirmation_number,
          packageName: b.service_type === "dropoff" ? "Drop-Off Platter Order" : (b.package || "—"),
          eventDate: b.event_date,
          bookingId: b.id,
        }),
      });
      setCancelDone(true);
      setShowCancelModal(false);
    } catch (e) {
      console.error(e);
    }
    setCancelSending(false);
  };

  const rollsByTier = {};
  if (Array.isArray(b.rolls_selected)) {
    for (const r of b.rolls_selected) {
      if (!rollsByTier[r.tier]) rollsByTier[r.tier] = [];
      rollsByTier[r.tier].push(r);
    }
  }
  const hasRolls = Object.keys(rollsByTier).length > 0;
  const hasAppetizers = Array.isArray(b.appetizers_ordered) && b.appetizers_ordered.length > 0;

  const balance = b.total_price != null && b.deposit_amount != null
    ? Number(b.total_price) - Number(b.deposit_amount)
    : null;

  return (
    <div style={{ background: BG2, border: `1px solid rgba(232,201,126,0.15)`, overflow: "hidden" }}>
      {showCancelModal && (
        <CancellationModal
          booking={b}
          onClose={() => setShowCancelModal(false)}
          onConfirm={submitCancellation}
          sending={cancelSending}
        />
      )}

      <button
        onClick={onToggle}
        className="profile-booking-btn"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "none", border: "none", padding: "22px 28px", cursor: "pointer", textAlign: "left", gap: 16, minHeight: 44 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: F, fontSize: 17, color: CREAM, fontWeight: 400, lineHeight: 1.2 }}>{pkg}</span>
            <span style={{
              fontFamily: F, fontSize: 10, color: ss.color,
              border: `1px solid ${ss.border}`,
              padding: "3px 10px", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0,
            }}>
              {b.status}
            </span>
          </div>
          <div style={{ fontFamily: F, fontSize: 13, color: MUTED, fontStyle: "italic" }}>
            {fmtDate(b.event_date)}
            {b.guest_count ? ` · ${b.guest_count} guests` : ""}
            {` · ${serviceLabel}`}
          </div>
        </div>
        <div style={{
          fontFamily: F, fontSize: 14, color: FAINT, flexShrink: 0,
          transition: "transform 0.25s ease",
          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        }}>▾</div>
      </button>

      {expanded && (
        <div className="profile-expanded" style={{ borderTop: `1px solid rgba(232,201,126,0.1)`, padding: "24px 28px 28px", background: BG }}>

          {b.confirmation_number && (
            <div style={{ fontFamily: F, fontSize: 11, color: "rgba(232,201,126,0.6)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 22 }}>
              Booking #{b.confirmation_number}
            </div>
          )}

          {/* Event info */}
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Event Details</SectionLabel>
            <div style={{ padding: "4px 0" }}>
              <DetailRow label="Date"    value={fmtDate(b.event_date)} />
              {b.event_time && <DetailRow label="Time" value={(() => { const [h, m] = b.event_time.split(":").map(Number); const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h); return `${h12}:${String(m).padStart(2,"0")} ${h >= 12 ? "PM" : "AM"}`; })()} />}
              <DetailRow label="Service" value={serviceLabel} />
              <DetailRow label="Guests"  value={b.guest_count ? `${b.guest_count} guests` : null} />
              <DetailRow label="Rate"    value={fmt2(b.price_per_guest) ? `${fmt2(b.price_per_guest)} / guest` : null} />
            </div>
          </div>

          {/* Omakase appetizers */}
          {b.service_type === "omakase" && Array.isArray(b.appetizers_selected) && b.appetizers_selected.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Appetizers</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {b.appetizers_selected.map((a) => (
                  <span key={a} style={{ fontFamily: F, fontSize: 13, color: GOLD, background: "rgba(232,201,126,0.08)", border: `1px solid rgba(232,201,126,0.2)`, padding: "5px 12px" }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Financial */}
          {(b.total_price != null || b.deposit_amount != null) && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Payment</SectionLabel>
              <div style={{ padding: "4px 0" }}>
                <DetailRow label="Total"        value={fmt2(b.total_price)} />
                <DetailRow label="Deposit Paid" value={fmt2(b.deposit_amount)} />
                <DetailRow
                  label="Balance Due"
                  value={balance != null
                    ? (balance <= 0 ? "Paid in full" : `${fmt2(balance)} · due at event`)
                    : null}
                />
              </div>
            </div>
          )}

          {/* Rolls */}
          {hasRolls && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Rolls Selected</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {["classics", "signatures", "specialty", "premium"].map((tier) => {
                  const items = rollsByTier[tier];
                  if (!items?.length) return null;
                  return (
                    <div key={tier}>
                      <div style={{ fontFamily: F, fontSize: 10, color: "rgba(232,201,126,0.6)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6 }}>
                        {tier}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {items.map((r) => (
                          <span key={r.name} className="profile-roll-pill" style={{
                            fontFamily: F, fontSize: 13, color: CREAM,
                            background: BG2, border: `1px solid rgba(232,201,126,0.15)`,
                            padding: "5px 12px",
                          }}>
                            {r.name} × {r.qty}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Appetizers (legacy format) */}
          {hasAppetizers && (() => {
            const included = b.appetizers_ordered.filter((a) => (a.included_qty || 0) > 0);
            const extras   = b.appetizers_ordered.filter((a) => (a.extra_qty    || 0) > 0);
            return (
              <div style={{ marginBottom: 22 }}>
                {included.length > 0 && (
                  <div style={{ marginBottom: extras.length > 0 ? 14 : 0 }}>
                    <SectionLabel>Included Appetizers</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {included.map((a) => (
                        <span key={`inc-${a.name}`} style={{
                          fontFamily: F, fontSize: 13, color: GOLD,
                          background: "rgba(232,201,126,0.08)", border: `1px solid rgba(232,201,126,0.2)`,
                          padding: "5px 12px",
                        }}>
                          {a.name} × {a.included_qty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {extras.length > 0 && (
                  <div>
                    <SectionLabel>Extra Appetizers</SectionLabel>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {extras.map((a) => (
                        <span key={`ext-${a.name}`} style={{
                          fontFamily: F, fontSize: 13, color: CREAM,
                          background: BG2, border: `1px solid rgba(232,201,126,0.15)`,
                          padding: "5px 12px",
                        }}>
                          {a.name} × {a.extra_qty}
                          {a.extra_cost ? ` · $${Number(a.extra_cost).toFixed(0)}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Drop-off platters */}
          {b.service_type === "dropoff" && Array.isArray(b.platters_ordered) && b.platters_ordered.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Platters Ordered</SectionLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {b.platters_ordered.map((po, i) => (
                  <div key={i} style={{ background: BG2, border: `1px solid rgba(232,201,126,0.15)`, padding: "12px 16px" }}>
                    <div style={{ fontFamily: F, fontSize: 14, color: CREAM, marginBottom: 4 }}>
                      {po.quantity}× {po.platter_name}
                    </div>
                    {Array.isArray(po.substitutions) && po.substitutions.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                        {po.substitutions.map((s, j) => (
                          <div key={j} style={{ fontFamily: F, fontSize: 12, color: MUTED, fontStyle: "italic" }}>
                            {s.original_roll} → {s.replacement_roll}
                            {s.upcharge_per_roll > 0 && <span style={{ color: GOLD }}> (+${(s.upcharge_per_roll * s.slot_qty).toFixed(0)}/platter)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {b.delivery_address && (
                <div style={{ marginTop: 10, fontFamily: F, fontSize: 13, color: CREAM }}>
                  <span style={{ color: "rgba(232,201,126,0.7)", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>Delivery: </span>
                  {b.delivery_address}
                </div>
              )}
            </div>
          )}

          {/* Special requests / Chef's notes */}
          {b.special_requests && b.service_type !== "omakase" && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Special Requests</SectionLabel>
              <p style={{ fontFamily: F, fontSize: 14, color: MUTED, fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
                {b.special_requests}
              </p>
            </div>
          )}
          {b.special_requests && b.service_type === "omakase" && (
            <div style={{ marginBottom: 22 }}>
              <SectionLabel>Your Notes to the Chef</SectionLabel>
              <p style={{ fontFamily: F, fontSize: 14, color: MUTED, fontStyle: "italic", margin: 0, lineHeight: 1.6 }}>
                {b.special_requests}
              </p>
            </div>
          )}

          {/* Cancellation */}
          {cancelDone && (
            <div style={{ padding: "12px 16px", background: "rgba(232,201,126,0.06)", border: `1px solid rgba(232,201,126,0.2)`, fontFamily: F, fontSize: 13, color: GOLD, fontStyle: "italic" }}>
              Cancellation request sent. We&rsquo;ll follow up via email within 24 hours.
            </div>
          )}
          {canRequestCancellation && !cancelDone && (
            <div style={{ paddingTop: 16, borderTop: `1px solid rgba(232,201,126,0.1)` }}>
              <button
                onClick={() => setShowCancelModal(true)}
                style={{
                  background: "none", border: `1px solid rgba(232,201,126,0.35)`, color: GOLD,
                  padding: "10px 20px", fontFamily: F, fontSize: 12, letterSpacing: "0.12em",
                  textTransform: "uppercase", cursor: "pointer",
                }}
              >
                Request Cancellation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const [user, setUser]             = useState(null);
  const [bookings, setBookings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [email, setEmail]           = useState("");
  const [sent, setSent]             = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [nextParam, setNextParam]   = useState(null);

  const fetchBookings = async (userEmail) => {
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_email", userEmail)
      .order("event_date", { ascending: true });
    setBookings(data || []);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let token_hash = params.get("token_hash");
    let type = params.get("type");

    if (!token_hash && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      token_hash = hashParams.get("token_hash");
      type = hashParams.get("type");
    }

    const nextUrl = params.get("next") || null;
    if (nextUrl) setNextParam(nextUrl);

    if (token_hash && type) {
      supabase.auth.verifyOtp({ token_hash, type }).then(({ data }) => {
        if (data?.user) {
          setUser(data.user);
          fetchBookings(data.user.email);
          if (nextUrl) { window.location.href = nextUrl; return; }
          window.history.replaceState({}, "", "/profile");
        }
        setLoading(false);
      });
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchBookings(session.user.email);
        if (nextUrl) { window.location.href = nextUrl; return; }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchBookings(session.user.email);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setBookings([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("profile-bookings-live")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings" }, (payload) => {
        if (payload.new?.user_email === user.email) {
          setBookings((prev) => prev.map((b) => b.id === payload.new.id ? payload.new : b));
        }
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const signIn = async () => {
    if (!email.includes("@")) return;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/profile${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}` },
    });
    if (!error) setSent(true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F, fontSize: 16, color: FAINT }}>
      Loading…
    </div>
  );

  if (!user) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: F, fontSize: 28, color: CREAM, marginBottom: 6 }}>Sign In</div>
        <div style={{ fontFamily: F, fontSize: 14, color: MUTED, fontStyle: "italic", marginBottom: 36 }}>
          Enter your email and we&rsquo;ll send you a sign-in link.
        </div>
        {sent ? (
          <div style={{ fontFamily: F, fontSize: 15, color: GOLD, fontStyle: "italic" }}>
            Check your email for your sign-in link.
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && signIn()}
              placeholder="you@example.com"
              autoFocus
              style={{ width: "100%", padding: "14px 16px", background: "#141414", border: "1px solid rgba(232,201,126,0.25)", fontFamily: F, fontSize: 15, color: CREAM, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
            />
            <button onClick={signIn} style={{ width: "100%", padding: 16, background: GOLD, color: BG, border: "none", fontFamily: F, fontSize: 13, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", minHeight: 52 }}>
              Send Sign-In Link →
            </button>
          </>
        )}
        <div style={{ marginTop: 24 }}>
          <a href="/" style={{ fontFamily: F, fontSize: 12, color: FAINT, fontStyle: "italic", textDecoration: "none" }}>← Back to Sonkase™</a>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: "48px 20px", overflowX: "hidden", color: CREAM, fontFamily: F }}>
      <style>{`
        @media (max-width: 768px) {
          .profile-header { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; margin-bottom: 28px !important; }
          .profile-header-title { font-size: 22px !important; }
          .profile-email { max-width: 260px !important; overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important; }
          .profile-header-actions { flex-direction: row !important; gap: 12px !important; align-items: center !important; width: 100% !important; }
          .profile-booking-btn { padding: 16px 20px !important; }
          .profile-expanded { padding: 16px 16px 20px !important; }
          .profile-detail-row { flex-wrap: wrap !important; gap: 2px !important; align-items: flex-start !important; }
          .profile-detail-label { margin-right: 0 !important; }
          .profile-detail-value { width: 100% !important; text-align: left !important; font-size: 13px !important; }
          .profile-roll-pill { font-size: 12px !important; padding: 4px 10px !important; }
        }
      `}</style>
      <div style={{ maxWidth: 800, margin: "0 auto", boxSizing: "border-box" }}>

        <div className="profile-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 48 }}>
          <div style={{ minWidth: 0 }}>
            <div className="profile-header-title" style={{ fontFamily: F, fontSize: 28, color: CREAM, fontWeight: 400 }}>Your Bookings</div>
            <div className="profile-email" style={{ fontFamily: F, fontSize: 13, color: MUTED, fontStyle: "italic", marginTop: 4 }}>{user.email}</div>
          </div>
          <div className="profile-header-actions" style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
            <a href="/" style={{ fontFamily: F, fontSize: 12, color: FAINT, fontStyle: "italic", textDecoration: "none", whiteSpace: "nowrap" }}>← Home</a>
            <button onClick={signOut} style={{ background: "none", border: `1px solid rgba(232,201,126,0.25)`, padding: "10px 20px", fontFamily: F, fontSize: 12, color: MUTED, letterSpacing: "0.1em", cursor: "pointer", whiteSpace: "nowrap", minHeight: 44, textTransform: "uppercase" }}>
              Sign Out
            </button>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontFamily: F, fontSize: 22, color: CREAM, marginBottom: 12 }}>No upcoming events</div>
            <div style={{ fontFamily: F, fontSize: 15, color: MUTED, fontStyle: "italic", marginBottom: 28 }}>
              Book your first private dining experience.
            </div>
            <a href="/book" style={{ background: GOLD, color: BG, padding: "14px 28px", fontFamily: F, fontSize: 13, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", display: "inline-block", minHeight: 52, lineHeight: "24px" }}>
              Reserve an Experience →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {bookings.map((b) => (
              <BookingCard
                key={b.id}
                booking={b}
                expanded={expandedId === b.id}
                onToggle={() => setExpandedId(expandedId === b.id ? null : b.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
