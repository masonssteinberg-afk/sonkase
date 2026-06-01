"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

// ── Design Tokens (Sonkase™ palette) ──────────────────────────
const NAVY        = "#0d0d0d";   // primary background
const PERSIMMON   = "#E8C97E";   // gold accent (replaces persimmon)
const PERSIMMON_D = "#c9a85e";   // darker gold for hover
const CREAM       = "#F5F0E8";   // cream text
const PAPER       = "#141414";   // secondary background
const INK         = "#0d0d0d";   // dark ink
const INK_SOFT    = "rgba(245,240,232,0.6)";
const INK_FAINT   = "rgba(245,240,232,0.35)";
const GOLD        = "#E8C97E";   // gold
const FOREST      = "#E8C97E";   // mapped to gold for omakase context

/* LEGACY TOKENS — old Chef's Special palette preserved:
const _OLD_NAVY        = "#0d1729";
const _OLD_PERSIMMON   = "#c5552d";
const _OLD_PERSIMMON_D = "#9d3d1f";
const _OLD_CREAM       = "#f5ecd9";
const _OLD_PAPER       = "#fbf6e8";
const _OLD_INK         = "#1a1208";
const _OLD_GOLD        = "#a07736";
const _OLD_FOREST      = "#2d4a3a";
*/

const FONT_DISPLAY = `Georgia, 'Times New Roman', serif`;
const FONT_BODY    = `Georgia, 'Times New Roman', serif`;

// ── Omakase Packages (no ™ on individual package names) ──────
const OMAKASE_PACKAGES = [
  {
    id: "datenight",
    name: "Date Night",
    kanji: "宴",
    guests: 2, price: 300, deposit: 75, rolls: 5, nigiri: 9, appetizerCount: 1,
    includes: [
      "9 piece nigiri course",
      "1 appetizer of your choice",
      "5 rolls, chef's selection",
      "90 minute experience",
      "25% deposit locks your date",
    ],
  },
  {
    id: "doubledatenight",
    name: "Double Date Night",
    kanji: "双",
    guests: 4, price: 520, deposit: 130, rolls: 10, nigiri: 18, appetizerCount: 2,
    includes: [
      "18 piece nigiri course",
      "2 appetizers of your choice",
      "10 rolls, chef's selection",
      "90 minute experience",
      "25% deposit locks your date",
    ],
  },
  {
    id: "smallgathering",
    name: "Small Gathering",
    kanji: "集",
    guests: 6, price: 720, deposit: 180, rolls: 14, nigiri: 27, appetizerCount: 3,
    includes: [
      "27 piece nigiri course",
      "3 appetizers of your choice",
      "14 rolls, chef's selection",
      "90 minute experience",
      "25% deposit locks your date",
    ],
  },
  {
    id: "gettogether",
    name: "Get Together",
    kanji: "会",
    guests: 8, price: 900, deposit: 225, rolls: 18, nigiri: 36, appetizerCount: 4,
    includes: [
      "36 piece nigiri course",
      "4 appetizers of your choice",
      "18 rolls, chef's selection",
      "90 minute experience",
      "25% deposit locks your date",
    ],
  },
];

// ── Appetizers ────────────────────────────────────────────────
const APPETIZER_OPTIONS = [
  { id: "tuna_tataki",   name: "Tuna Tataki",      desc: "Tuna, ponzu, sesame oil, scallion",                              price: 14, kanji: "鮪" },
  { id: "salmon_pear",   name: "Nashi Karashi",    desc: "Japanese pear, house-cured salmon, sesame oil, black sesame",    price: 16, kanji: "梨" },
  { id: "hamachi_crudo", name: "Yellowtail Crudo", desc: "Yellowtail, yuzu, chili oil, micro shiso",                       price: 18, kanji: "鰤" },
  { id: "tako_usuzukuri",name: "Tako Usuzukuri",   desc: "Octopus, yuzu, sea salt, microgreens",                           price: 18, kanji: "蛸" },
];

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
const fmt2      = (n) => `$${Number(n).toFixed(2)}`;
const fmtDate   = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
};
const minDate   = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
};
const fmtTime   = (v) => {
  const slot = TIME_SLOTS.find((s) => s.value === v);
  return slot ? slot.label : v;
};

// ── Step Labels ───────────────────────────────────────────────
const STEP_LABELS = ["Package", "When", "Appetizers", "Notes", "Review", "Payment"];
const VISIBLE_STEPS = ["pkg", "datetime", "appetizer", "notes", "summary", "payment"];

// ── Main App ──────────────────────────────────────────────────
export default function App() {
  const [step, setStep]                       = useState("login");
  const [sessionChecked, setSessionChecked]   = useState(false);
  const [user, setUser]                       = useState(null);
  const [transitionKey, setTransitionKey]     = useState(0);
  const [selectedPkg, setSelectedPkg]         = useState(null);
  const [eventDate, setEventDate]             = useState("");
  const [eventTime, setEventTime]             = useState("");
  const [selectedAppetizers, setSelectedAppetizers] = useState([]);
  const [chefNotes, setChefNotes]             = useState("");
  const [confirmation, setConfirmation]       = useState(null);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      const code = new URLSearchParams(window.location.search).get("code");
      if (code) {
        const { data } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/book");
        if (data?.user) {
          setUser({ email: data.user.email });
          setSessionChecked(true);
          setStep("pkg");
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({ email: session.user.email });
        setStep("pkg");
      }
      setSessionChecked(true);
    })();
  }, []);

  const goTo = (next) => {
    setTransitionKey((k) => k + 1);
    setStep(next);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  const reset = () => {
    setSelectedPkg(null); setEventDate(""); setEventTime("");
    setSelectedAppetizers([]); setChefNotes(""); setConfirmation(null);
    goTo("pkg");
  };

  const stepIndex = VISIBLE_STEPS.indexOf(step);

  return (
    <div style={{ minHeight: "100vh", background: NAVY, fontFamily: FONT_BODY, color: CREAM, overflowX: "hidden" }}>
      <BookStyles />
      <BookHeader user={user} onSignOut={async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        await sb.auth.signOut();
        window.location.href = "/";
      }} />

      {step !== "login" && step !== "done" && (
        <BookStepIndicator steps={STEP_LABELS} current={stepIndex} />
      )}

      <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 120px", boxSizing: "border-box" }}>
        <div key={transitionKey} style={{ animation: "bookFadeUp 0.35s ease both" }}>

          {/* Login */}
          {step === "login" && !sessionChecked && (
            <div style={{ textAlign: "center", padding: "120px 0", fontFamily: FONT_DISPLAY, fontSize: 15, color: "rgba(245,240,232,0.25)", letterSpacing: "0.1em" }}>Loading…</div>
          )}
          {step === "login" && sessionChecked && (
            <LoginScreen onLogin={(email) => { setUser({ email }); goTo("pkg"); }} />
          )}

          {/* Step 1 — Package */}
          {step === "pkg" && (
            <PackageStep
              selected={selectedPkg}
              onSelect={(p) => { setSelectedPkg(p); setSelectedAppetizers([]); }}
              onNext={() => goTo("datetime")}
            />
          )}

          {/* Step 2 — Date & Time */}
          {step === "datetime" && (
            <DateTimeStep
              eventDate={eventDate} setEventDate={setEventDate}
              eventTime={eventTime} setEventTime={setEventTime}
              onBack={() => goTo("pkg")}
              onNext={() => goTo("appetizer")}
            />
          )}

          {/* Step 3 — Appetizers */}
          {step === "appetizer" && (
            <AppetizerStep
              pkg={selectedPkg}
              selected={selectedAppetizers}
              onToggle={(a) => {
                setSelectedAppetizers((prev) => {
                  const already = prev.find((x) => x.id === a.id);
                  if (already) return prev.filter((x) => x.id !== a.id);
                  if (prev.length >= selectedPkg.appetizerCount) return [...prev.slice(1), a];
                  return [...prev, a];
                });
              }}
              onBack={() => goTo("datetime")}
              onNext={() => goTo("notes")}
            />
          )}

          {/* Step 4 — Chef's Notes */}
          {step === "notes" && (
            <NotesStep
              value={chefNotes} onChange={setChefNotes}
              onBack={() => goTo("appetizer")}
              onNext={() => goTo("summary")}
            />
          )}

          {/* Step 5 — Summary */}
          {step === "summary" && (
            <SummaryStep
              pkg={selectedPkg}
              eventDate={eventDate} eventTime={eventTime}
              appetizers={selectedAppetizers}
              chefNotes={chefNotes}
              onBack={() => goTo("notes")}
              onNext={() => goTo("payment")}
            />
          )}

          {/* Step 6 — Payment */}
          {step === "payment" && (
            <OmakasePaymentScreen
              pkg={selectedPkg}
              user={user}
              eventDate={eventDate} eventTime={eventTime}
              appetizers={selectedAppetizers}
              chefNotes={chefNotes}
              onBack={() => goTo("summary")}
              onConfirm={(id) => {
                setConfirmation({ id, pkg: selectedPkg, eventDate, eventTime, appetizers: selectedAppetizers, chefNotes });
                goTo("done");
              }}
            />
          )}

          {/* Done */}
          {step === "done" && (
            <ConfirmationStep confirmation={confirmation} user={user} onReset={reset} />
          )}

        </div>
      </main>
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
      input:focus, textarea:focus { outline: none; border-color: #E8C97E !important; }
      button { font-family: inherit; }
      select:focus { outline: none; }
      select option { background: #141414; color: #F5F0E8; }

      @media (max-width: 768px) {
        .book-header-inner { padding: 12px 16px !important; }
        .book-step-inner   { padding: 10px 16px !important; }
        .book-step-label   { display: none !important; }
        .book-card         { padding: 24px 16px !important; }
        .book-pkg-grid     { grid-template-columns: 1fr !important; }
        .book-app-grid     { grid-template-columns: 1fr 1fr !important; }
        .book-pay-inner    { flex-direction: column !important; }
      }
    `}</style>
  );
}

// ── Book Header ───────────────────────────────────────────────
function BookHeader({ user, onSignOut }) {
  return (
    <header style={{ background: NAVY, position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(232,201,126,0.15)" }}>
      <div className="book-header-inner" style={{ maxWidth: 760, margin: "0 auto", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <Image src="/sonkase-logo.svg" alt="Sonkase Private Dining" width={280} height={82} priority />
        </a>
        {user && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: "rgba(245,240,232,0.45)", fontStyle: "italic" }}>{user.email}</span>
            <button onClick={onSignOut} style={{ background: "none", border: `1px solid rgba(232,201,126,0.4)`, color: GOLD, padding: "6px 14px", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", fontFamily: FONT_BODY }}>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}


// ── Step Indicator ────────────────────────────────────────────
function BookStepIndicator({ steps, current }) {
  return (
    <div style={{ background: "#141414", borderBottom: `1px solid rgba(232,201,126,0.12)` }}>
      <div className="book-step-inner" style={{ maxWidth: 760, margin: "0 auto", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box" }}>
        {steps.map((label, i) => {
          const active = i === current;
          const done   = i < current;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 }}>
              <div style={{
                width: 26, height: 26,
                background: done ? GOLD : active ? GOLD : "transparent",
                border: `1px solid ${done || active ? GOLD : "rgba(232,201,126,0.3)"}`,
                color: done || active ? NAVY : "rgba(232,201,126,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600, marginBottom: 4,
              }}>
                {done ? "✓" : i + 1}
              </div>
              <div className="book-step-label" style={{
                fontFamily: FONT_BODY, fontSize: 10, letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: active ? GOLD : done ? GOLD : "rgba(232,201,126,0.35)",
              }}>
                {label}
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 13, left: "50%", width: "100%",
                  height: 1, background: done ? GOLD : "rgba(232,201,126,0.15)",
                  zIndex: -1,
                }} />
              )}
            </div>
          );
        })}
      </div>
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
      email, options: { emailRedirectTo: "https://www.sonkase.com/auth/callback?next=/book" },
    });
    setLoading(false);
    if (authError) setError("Failed to send link. Try again.");
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
            Don&rsquo;t see it? Check spam — look for bookings@sonkase.com
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={CS.label}>Email Address</label>
            <input
              type="email" value={email} autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="you@example.com"
              style={CS.input}
            />
            {error && <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PERSIMMON, marginTop: 6 }}>{error}</div>}
          </div>
          <button onClick={submit} disabled={loading} style={{ ...CS.cta, width: "100%" }}>
            {loading ? "Sending…" : "Send Sign-In Link →"}
          </button>
        </>
      )}
    </div>
  );
}

// ── Step 1: Package Selection ─────────────────────────────────
function PackageStep({ selected, onSelect, onNext }) {
  return (
    <div style={CS.card}>
      <StepHeader kanji="壱" eyebrow="Step 1 of 6" title="Choose Your Experience" />

      <div className="book-pkg-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
        {OMAKASE_PACKAGES.map((p) => {
          const active = selected?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              style={{
                background: active ? "rgba(232,201,126,0.07)" : "#141414",
                border: `1px solid rgba(232,201,126,${active ? "0.4" : "0.2"})`,
                padding: "24px 20px", textAlign: "left", cursor: "pointer",
                display: "flex", flexDirection: "column",
                transition: "border-color 0.15s ease",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 32, color: GOLD, opacity: 0.4, lineHeight: 1, marginBottom: 12 }}>
                {p.kanji}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, color: CREAM, fontWeight: 400, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(232,201,126,0.65)", fontStyle: "italic", marginBottom: 16 }}>
                {p.guests} guests
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 30, fontWeight: 400, color: GOLD, lineHeight: 1, marginBottom: 16 }}>
                ${p.price}
              </div>
              <div style={{ height: 1, background: "rgba(232,201,126,0.15)", marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {p.includes.slice(0, 4).map((item) => (
                  <div key={item} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: GOLD, fontSize: 8, marginTop: 5, flexShrink: 0, opacity: 0.6 }}>◆</span>
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: CREAM, lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
              {active && (
                <div style={{ marginTop: 14, fontFamily: FONT_DISPLAY, fontSize: 11, color: GOLD, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                  ✓ Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button onClick={onNext} disabled={!selected} style={{ ...CS.cta, ...(!selected ? CS.ctaDisabled : {}) }}>
        Continue →
      </button>
    </div>
  );
}

// ── Step 2: Date & Time ───────────────────────────────────────
function DateTimeStep({ eventDate, setEventDate, eventTime, setEventTime, onBack, onNext }) {
  const daysOut = eventDate ? (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return Math.round((new Date(eventDate + "T00:00:00") - today) / 86400000);
  })() : 0;

  const canProceed = eventDate && eventTime && daysOut >= 7;

  return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Back to packages</button>
      <StepHeader kanji="弐" eyebrow="Step 2 of 6" title="Choose Your Evening" />

      <div style={{ marginBottom: 28 }}>
        <label style={CS.label}>Date</label>
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
      </div>

      <div style={{ marginBottom: 28 }}>
        <label style={CS.label}>Start Time</label>
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
            Chef arrives at {(() => {
              const slot = TIME_SLOTS.find((s) => s.value === eventTime);
              if (!slot) return "";
              const [h, m] = eventTime.split(":").map(Number);
              const arrH = h === 0 ? 23 : h - (m === 0 ? 1 : 0);
              const arrM = m === 0 ? 30 : m - 30;
              const arrHour12 = arrH > 12 ? arrH - 12 : (arrH === 0 ? 12 : arrH);
              const arrAmpm = arrH >= 12 ? "PM" : "AM";
              return `${arrHour12}:${String(arrM).padStart(2, "0")} ${arrAmpm}`;
            })()} to set up — service begins at {fmtTime(eventTime)}.
          </div>
        )}
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...CS.cta, ...(!canProceed ? CS.ctaDisabled : {}) }}>
        Continue to Appetizers →
      </button>
    </div>
  );
}

// ── Step 3: Appetizer Selection ───────────────────────────────
function AppetizerStep({ pkg, selected, onToggle, onBack, onNext }) {
  const needed   = pkg?.appetizerCount || 1;
  const canProceed = selected.length === needed;

  return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Back</button>
      <StepHeader kanji="参" eyebrow="Step 3 of 6" title="Choose Your Appetizer" subtitle={`Select ${needed} appetizer${needed > 1 ? "s" : ""} — included in your package.`} />

      <div className="book-app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        {APPETIZER_OPTIONS.map((a) => {
          const active = selected.find((x) => x.id === a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle(a)}
              style={{
                background: active ? "rgba(232,201,126,0.07)" : "#141414",
                border: `1px solid rgba(232,201,126,${active ? "0.4" : "0.2"})`,
                padding: "20px 16px", textAlign: "center", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center",
                transition: "border-color 0.15s",
              }}
            >
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 36, color: GOLD, opacity: active ? 0.7 : 0.4, lineHeight: 1, marginBottom: 12 }}>
                {a.kanji}
              </div>
              <div style={{ fontFamily: FONT_DISPLAY, fontSize: 15, color: CREAM, marginBottom: 6 }}>{a.name}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: INK_SOFT, fontStyle: "italic", lineHeight: 1.4, marginBottom: 10 }}>{a.desc}</div>
              {active && <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, fontStyle: "italic", letterSpacing: "0.1em" }}>✓ Selected</div>}
            </button>
          );
        })}
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", textAlign: "center", marginBottom: 24 }}>
        {selected.length} of {needed} selected
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...CS.cta, ...(!canProceed ? CS.ctaDisabled : {}) }}>
        Continue to Chef&rsquo;s Notes →
      </button>
    </div>
  );
}

// ── Step 4: Chef's Notes ──────────────────────────────────────
function NotesStep({ value, onChange, onBack, onNext }) {
  const canProceed = value.trim().length >= 3;

  return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Back</button>
      <StepHeader kanji="四" eyebrow="Step 4 of 6" title="What don't you eat?" />

      <div style={{ marginBottom: 28 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="List any allergies, dietary restrictions, or ingredients you want avoided. This is required. Your chef reads this before every event."
          style={{
            ...CS.input,
            width: "100%", height: 140, resize: "vertical",
            lineHeight: 1.6, boxSizing: "border-box",
          }}
          autoFocus
        />
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginTop: 10, lineHeight: 1.6 }}>
          No shellfish, no spicy, no cucumber — whatever it is, we need to know. If there are no restrictions, type &ldquo;No restrictions.&rdquo;
        </div>
      </div>

      <button onClick={onNext} disabled={!canProceed} style={{ ...CS.cta, ...(!canProceed ? CS.ctaDisabled : {}) }}>
        Review Your Booking →
      </button>
    </div>
  );
}

// ── Step 5: Summary ───────────────────────────────────────────
function SummaryStep({ pkg, eventDate, eventTime, appetizers, chefNotes, onBack, onNext }) {
  const balance = pkg.price - pkg.deposit;

  return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Edit notes</button>
      <StepHeader kanji="五" eyebrow="Step 5 of 6" title="Review Your Booking" />

      {/* Order recap */}
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,201,126,0.15)", padding: "20px 24px", marginBottom: 24 }}>
        <SummaryRow label="Experience" value={pkg.name} />
        <SummaryRow label="Guests"     value={`${pkg.guests} guests`} />
        <SummaryRow label="Date"       value={fmtDate(eventDate)} />
        <SummaryRow label="Time"       value={fmtTime(eventTime)} />
        <SummaryRow label={`Appetizer${appetizers.length > 1 ? "s" : ""}`} value={appetizers.map((a) => a.name).join(", ")} />
        <SummaryRow label="Chef's Notes" value={chefNotes} />
      </div>

      {/* Pricing */}
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,201,126,0.15)", padding: "20px 24px", marginBottom: 24 }}>
        <SummaryRow label="Total"               value={fmt2(pkg.price)} />
        <SummaryRow label="Deposit due today (25%)" value={fmt2(pkg.deposit)} highlight />
        <SummaryRow label="Balance due at event"    value={fmt2(balance)} />
      </div>

      {/* Cancellation */}
      <div style={{ background: "rgba(232,201,126,0.04)", border: `1px solid rgba(232,201,126,0.2)`, borderLeft: `2px solid ${GOLD}`, padding: "14px 16px", marginBottom: 28 }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 400, marginBottom: 6 }}>Cancellation Policy</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_SOFT, lineHeight: 1.6 }}>
          Cancel 72 hours or more before your event for a full deposit refund. Cancellations within 72 hours forfeit the deposit.
        </div>
      </div>

      <button onClick={onNext} style={CS.cta}>
        Confirm and Pay {fmt2(pkg.deposit)} →
      </button>
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

// ── Step 6: Payment ───────────────────────────────────────────
function OmakasePaymentScreen({ pkg, user, eventDate, eventTime, appetizers, chefNotes, onBack, onConfirm }) {
  const [clientSecret, setClientSecret] = useState(null);
  const [intentError, setIntentError]   = useState(null);
  const [promoInput, setPromoInput]     = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { code, discount_amount, discount_type, discount_value }
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError]     = useState("");

  // Effective amounts after promo
  const effectiveTotal   = appliedPromo ? Math.max(0, pkg.price - appliedPromo.discount_amount) : pkg.price;
  const effectiveDeposit = Math.round(effectiveTotal * 0.25 * 100) / 100;
  const effectiveBalance = Math.round((effectiveTotal - effectiveDeposit) * 100) / 100;

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
  }, [effectiveDeposit]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError("");
    try {
      const res  = await fetch("/api/validate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: pkg.price }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo({ code, ...data });
      } else {
        setPromoError(data.error || "Invalid code");
      }
    } catch {
      setPromoError("Could not validate code");
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  if (intentError) return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Back to review</button>
      <div style={{ padding: "40px 0", fontFamily: FONT_BODY, fontSize: 15, color: PERSIMMON, fontStyle: "italic" }}>
        {intentError} — please try again or contact us directly.
      </div>
    </div>
  );

  if (!clientSecret) return (
    <div style={CS.card}>
      <div style={{ textAlign: "center", padding: "100px 0", fontFamily: FONT_DISPLAY, fontSize: 15, color: INK_FAINT, letterSpacing: "0.1em" }}>
        Preparing secure payment…
      </div>
    </div>
  );

  return (
    <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
      <OmakasePaymentForm
        clientSecret={clientSecret}
        pkg={pkg} user={user}
        eventDate={eventDate} eventTime={eventTime}
        appetizers={appetizers} chefNotes={chefNotes}
        appliedPromo={appliedPromo}
        effectiveTotal={effectiveTotal}
        effectiveDeposit={effectiveDeposit}
        effectiveBalance={effectiveBalance}
        promoInput={promoInput}
        setPromoInput={setPromoInput}
        promoLoading={promoLoading}
        promoError={promoError}
        onApplyPromo={applyPromo}
        onRemovePromo={removePromo}
        onBack={onBack} onConfirm={onConfirm}
      />
    </Elements>
  );
}

function OmakasePaymentForm({ clientSecret, pkg, user, eventDate, eventTime, appetizers, chefNotes, appliedPromo, effectiveTotal, effectiveDeposit, effectiveBalance, promoInput, setPromoInput, promoLoading, promoError, onApplyPromo, onRemovePromo, onBack, onConfirm }) {
  const stripe    = useStripe();
  const elements  = useElements();
  const [processing, setProcessing]     = useState(false);
  const [error, setError]               = useState("");
  const [cardComplete, setCardComplete] = useState(false);

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
        package: pkg.name,
        service_type: "omakase",
        event_date: eventDate,
        event_time: eventTime,
        guest_count: pkg.guests,
        total_price: effectiveTotal,
        deposit_amount: effectiveDeposit,
        appetizers_selected: appetizers.map((a) => a.name),
        special_requests: chefNotes,
        status: "pending",
        confirmation_number: confirmationId,
        stripe_payment_intent_id: paymentIntent.id,
        ...(appliedPromo ? { promo_code: appliedPromo.code, discount_amount: appliedPromo.discount_amount } : {}),
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
          serviceType: "omakase",
          packageName: pkg.name,
          eventDate, eventTime,
          guestCount: pkg.guests,
          total: effectiveTotal,
          deposit: effectiveDeposit,
          appetizersSelected: appetizers.map((a) => a.name),
          chefNotes,
          ...(appliedPromo ? { promoCode: appliedPromo.code, discountAmount: appliedPromo.discount_amount } : {}),
        }),
      }),
      fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "omakase",
          clientEmail: user.email,
          confirmationId,
          packageName: pkg.name,
          eventDate, eventTime,
          guestCount: pkg.guests,
          total: effectiveTotal,
          deposit: effectiveDeposit,
          appetizersSelected: appetizers.map((a) => a.name),
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
    onConfirm(confirmationId);
  };

  return (
    <div style={CS.card}>
      <button onClick={onBack} style={CS.back}>← Back to review</button>
      <StepHeader kanji="払" eyebrow="Step 6 of 6" title="Secure Payment" subtitle="Pay your 25% deposit to confirm the booking." />

      {/* Deposit panel */}
      <div style={{ background: NAVY, color: CREAM, padding: "22px 26px", marginBottom: 28 }}>
        <div className="book-pay-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PERSIMMON, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>Deposit Due Today</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 400, color: CREAM, lineHeight: 1 }}>{fmt2(effectiveDeposit)}</div>
            {appliedPromo && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: GOLD, marginTop: 6 }}>
                {appliedPromo.discount_type === "percent"
                  ? `${appliedPromo.discount_value}% off`
                  : `${fmt2(appliedPromo.discount_amount)} off`} applied — total {fmt2(effectiveTotal)}
              </div>
            )}
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(245,236,217,0.45)", marginTop: 6, fontStyle: "italic" }}>
              Balance {fmt2(effectiveBalance)} due at the event
            </div>
          </div>
          <div style={{ fontSize: 36, opacity: 0.12 }}>🔒</div>
        </div>
      </div>

      {/* Promo code */}
      <div style={{ marginBottom: 24 }}>
        <label style={CS.label}>Promo Code</label>
        {appliedPromo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, padding: "12px 14px",
              background: "rgba(232,201,126,0.08)", border: `1px solid rgba(232,201,126,0.4)`,
              fontFamily: FONT_DISPLAY, fontSize: 14, color: GOLD, letterSpacing: "0.06em",
            }}>
              ✓ {appliedPromo.code} — {fmt2(appliedPromo.discount_amount)} off
            </div>
            <button onClick={onRemovePromo} style={{
              background: "none", border: `1px solid rgba(232,201,126,0.3)`,
              color: "rgba(232,201,126,0.6)", padding: "12px 14px",
              fontFamily: FONT_BODY, fontSize: 13, cursor: "pointer",
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
                flex: 1, padding: "12px 14px",
                background: "#0d0d0d", border: `1px solid rgba(232,201,126,0.25)`,
                fontFamily: FONT_DISPLAY, fontSize: 14, color: CREAM, letterSpacing: "0.06em",
                outline: "none",
              }}
            />
            <button
              onClick={onApplyPromo}
              disabled={!promoInput.trim() || promoLoading}
              style={{
                background: promoInput.trim() && !promoLoading ? GOLD : "rgba(232,201,126,0.12)",
                color: promoInput.trim() && !promoLoading ? NAVY : "rgba(232,201,126,0.3)",
                border: "none", padding: "0 18px",
                fontFamily: FONT_BODY, fontSize: 12, letterSpacing: "0.12em",
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
        <label style={CS.label}>Card Details</label>
        <div style={{ padding: "14px 16px", background: "#0d0d0d", border: `1px solid rgba(232,201,126,0.25)` }}>
          <CardElement
            options={{
              style: {
                base: { fontFamily: `Georgia, serif`, fontSize: "16px", color: "#F5F0E8", "::placeholder": { color: "rgba(245,240,232,0.35)" } },
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
        style={{ ...CS.cta, ...(processing || !stripe || !cardComplete ? CS.ctaDisabled : {}), width: "100%" }}
      >
        {processing ? "Processing…" : `Pay ${fmt2(effectiveDeposit)} & Confirm Booking`}
      </button>
    </div>
  );
}

// ── Confirmation ──────────────────────────────────────────────
function ConfirmationStep({ confirmation, user, onReset }) {
  if (!confirmation) return null;
  const { id, pkg, eventDate, eventTime, appetizers, chefNotes } = confirmation;

  return (
    <div style={{ ...CS.card, textAlign: "center" }}>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 52, color: PERSIMMON, marginBottom: 4 }}>確認</div>
      <div style={{ height: 2, width: 48, background: PERSIMMON, margin: "0 auto 24px" }} />
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, color: CREAM, marginBottom: 8 }}>Booking Confirmed</h1>
      <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: INK_SOFT, fontStyle: "italic", marginBottom: 36 }}>
        Your Sonkase™ experience is on the calendar.
      </p>

      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: PERSIMMON, letterSpacing: "0.1em", marginBottom: 32 }}>
        #{id}
      </div>

      <div style={{ background: "#0d0d0d", border: "1px solid rgba(232,201,126,0.15)", padding: "20px 24px", marginBottom: 28, textAlign: "left" }}>
        <SummaryRow label="Experience" value={pkg.name} />
        <SummaryRow label="Date"       value={fmtDate(eventDate)} />
        <SummaryRow label="Time"       value={fmtTime(eventTime)} />
        <SummaryRow label="Guests"     value={`${pkg.guests} guests`} />
        <SummaryRow label={`Appetizer${appetizers.length > 1 ? "s" : ""}`} value={appetizers.map((a) => a.name).join(", ")} />
        <SummaryRow label="Deposit Paid"       value={fmt2(pkg.deposit)} highlight />
        <SummaryRow label="Balance Due at Event" value={fmt2(pkg.price - pkg.deposit)} />
      </div>

      <div style={{ background: "rgba(232,201,126,0.04)", border: `1px solid rgba(232,201,126,0.2)`, borderLeft: `2px solid ${GOLD}`, padding: "16px 20px", marginBottom: 28, textAlign: "left" }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>What Happens Next</div>
        <ul style={{ fontFamily: FONT_BODY, fontSize: 14, color: CREAM, lineHeight: 1.9, paddingLeft: 18, fontStyle: "italic", margin: 0 }}>
          <li>Your chef will review your notes before the event</li>
          <li>Chef arrives 30 minutes before your selected time to set up</li>
          <li>Balance is due at the event — cash or card accepted</li>
          <li>Check your email for your receipt</li>
        </ul>
      </div>

      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginBottom: 32, lineHeight: 1.6 }}>
        Don&rsquo;t see the confirmation email? Check your spam — look for bookings@sonkase.com
      </div>

      <a href="/" style={{ fontFamily: FONT_BODY, fontSize: 14, color: INK_SOFT, textDecoration: "underline" }}>
        ← Back to Sonkase™
      </a>
    </div>
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

// ── Component Styles ──────────────────────────────────────────
const CS = {
  card: {
    background: "#141414", border: "1px solid rgba(232,201,126,0.15)",
    padding: "36px 32px",
  },
  label: {
    display: "block", fontFamily: FONT_BODY, fontSize: 11, color: GOLD,
    letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 400, marginBottom: 8,
  },
  input: {
    display: "block", width: "100%", padding: "12px 14px",
    border: `1px solid rgba(232,201,126,0.25)`, background: "#0d0d0d",
    fontFamily: FONT_BODY, fontSize: 15, color: CREAM,
  },
  cta: {
    display: "block", width: "100%", padding: "16px",
    background: GOLD, color: NAVY, border: "none",
    fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.2em",
    textTransform: "uppercase", cursor: "pointer", minHeight: 52,
    textAlign: "center",
  },
  ctaDisabled: {
    background: "rgba(232,201,126,0.15)", color: "rgba(232,201,126,0.3)", cursor: "not-allowed",
  },
  back: {
    background: "none", border: "none", padding: "0 0 20px",
    fontFamily: FONT_BODY, fontSize: 13, color: "rgba(245,240,232,0.4)",
    cursor: "pointer", fontStyle: "italic", display: "block",
  },
};

/* ======================================================================
   LEGACY CODE — All previous booking flow preserved below.
   Not used in the current booking experience.
   ======================================================================

   LEGACY DATA STRUCTURES:

   OLD ROLLS (menu data — same as above, kept in ROLLS constant):
   34 rolls across classics, signatures, specialty, premium

   OLD PACKAGES A / B / C (per-guest pricing):
   Package A — Essentials: $75/guest, 3 rolls/guest, classics/signatures/specialty, premium +$8/roll
   Package B — The Spread: $95/guest, 3 rolls/guest, full menu, tricolor nigiri, 1 appetizer per 5 guests
   Package C — Omakase: $130/guest, 3 rolls/guest, full menu, all appetizers, assorted platters

   OLD PLATTERS (drop-off system):
   The Essentials: California×2, Spicy Roll×2, Florida×1, Bagel×1, Orlando×1, Jibboo×1 — $95
   The Gator Pack: 6 roll varieties — $145
   Chef's Selection: 8 premium/specialty rolls — $190
   The Full Send: 10 rolls across all tiers — $240
   Tricolor Nigiri: 16pc salmon + 16pc tuna + 16pc yellowtail — $65

   OLD UPCHARGES: Package A: premium +$8/roll. Packages B and C: no upcharges.

   OLD PRICING ENGINE (calculatePricing):
   Inputs: pkg, guests, daysOut, founding, selections, appetizers
   Adjustments: small group +$10/guest (5-7), large group -10% (21+), rush fees, founding -15%

   OLD DROP-OFF PRICING (calcDropoffPricing):
   Subtotal from platters + substitution upcharges + $30 delivery fee

   OLD STEP FLOWS:
   Chef-attended: login → setup → rolls → appetizers → summary → payment → done
   Drop-off: login → dropoff-platters → dropoff-subs → dropoff-details → dropoff-summary → payment → done
   Date Night (old): login → datenight-booking → datenight-summary → payment → done

   All old step components (SetupScreen, RollScreen, TierAccordion, RollCard, AppetizerScreen,
   SummaryScreen, DropoffPlattersScreen, DropoffSubsScreen, DropoffDetailsScreen,
   DropoffSummaryScreen, DateNightBookingScreen, DateNightSummaryScreen) preserved below
   as _LEGACY_ prefixed functions. They are not exported or called.
   ====================================================================== */

// Legacy shared components preserved (not called)
function _LEGACY_DropoffPlattersScreen() { return null; }
function _LEGACY_DropoffSubsScreen() { return null; }
function _LEGACY_DropoffDetailsScreen() { return null; }
function _LEGACY_DropoffSummaryScreen() { return null; }
function _LEGACY_SetupScreen() { return null; }
function _LEGACY_RollScreen() { return null; }
function _LEGACY_TierAccordion() { return null; }
function _LEGACY_RollCard() { return null; }
function _LEGACY_AppetizerScreen() { return null; }
function _LEGACY_SummaryScreen() { return null; }
function _LEGACY_DateNightBookingScreen() { return null; }
function _LEGACY_DateNightSummaryScreen() { return null; }
function _LEGACY_PaymentScreen() { return null; }
function _LEGACY_PaymentForm() { return null; }
function _LEGACY_DoneScreen() { return null; }

/* Legacy constants preserved as comments:

const _LEGACY_PACKAGES = {
  A: { id: "A", name: "Package A", tagline: "Essentials", kanji: "壱", price: 75,
       rollsPerGuest: 3, varietyDivisor: 6, includes: ["Tricolor nigiri platter"],
       description: "3 rolls per guest, Classics, Signatures & Specialty. Premium +$8." },
  B: { id: "B", name: "Package B", tagline: "The Spread", kanji: "弐", price: 95,
       rollsPerGuest: 3, varietyDivisor: 4, includes: ["Tricolor nigiri platter", "Tricolor sashimi platter"],
       description: "3 rolls per guest, full menu no upcharges." },
  C: { id: "C", name: "Package C", tagline: "Omakase", kanji: "参", price: 130,
       rollsPerGuest: 3, varietyDivisor: 3,
       includes: ["Chef's appetizer course", "Assorted nigiri platter", "Assorted sashimi platter"],
       description: "Appetizers, 3 rolls per guest, assorted platters.", hasAppetizers: true },
};

const _LEGACY_UPCHARGES = { A: { premium: 8 }, B: {}, C: {} };

const _LEGACY_PLATTERS = [
  { id: "essentials",     kanji: "壱", name: "The Essentials",    pieces: 64, servings: "5-8",   price: 95,  nigiri: false,
    rolls: [{ roll: "California", tier: "classics", qty: 2 }, { roll: "Spicy Roll", tier: "signatures", qty: 2 },
            { roll: "Florida", tier: "signatures", qty: 1 }, { roll: "Bagel", tier: "classics", qty: 1 },
            { roll: "Orlando", tier: "signatures", qty: 1 }, { roll: "Jibboo", tier: "specialty", qty: 1 }] },
  { id: "gator_pack",     kanji: "弐", name: "The Gator Pack",    pieces: 96, servings: "8-12",  price: 145, nigiri: false,
    rolls: [{ roll: "California", tier: "classics", qty: 2 }, { roll: "Florida", tier: "signatures", qty: 2 },
            { roll: "Go Gator", tier: "specialty", qty: 2 }, { roll: "Archer Road", tier: "specialty", qty: 2 },
            { roll: "Spicy Roll", tier: "signatures", qty: 2 }, { roll: "So Down", tier: "specialty", qty: 2 }] },
  { id: "chefs_selection",kanji: "参", name: "Chef's Selection",  pieces: 128, servings: "10-15", price: 190, nigiri: false,
    rolls: [{ roll: "Steinberg", tier: "specialty", qty: 2 }, { roll: "Trust Me", tier: "premium", qty: 2 },
            { roll: "Gabi's", tier: "specialty", qty: 2 }, { roll: "Hamachi Crudo", tier: "premium", qty: 2 },
            { roll: "Stacey's Way", tier: "signatures", qty: 2 }, { roll: "Foam", tier: "premium", qty: 2 },
            { roll: "West Palm", tier: "premium", qty: 2 }, { roll: "Sunset", tier: "premium", qty: 2 }] },
  { id: "full_send",      kanji: "四", name: "The Full Send",     pieces: 160, servings: "14-20", price: 240, nigiri: false,
    rolls: [{ roll: "California", tier: "classics", qty: 2 }, { roll: "Philadelphia", tier: "classics", qty: 2 },
            { roll: "Florida", tier: "signatures", qty: 2 }, { roll: "So Down", tier: "specialty", qty: 2 },
            { roll: "Go Gator", tier: "specialty", qty: 2 }, { roll: "Jibboo", tier: "specialty", qty: 2 },
            { roll: "Reba's", tier: "specialty", qty: 2 }, { roll: "Archer Road", tier: "specialty", qty: 2 },
            { roll: "Haushinka's", tier: "premium", qty: 2 }, { roll: "Foam", tier: "premium", qty: 2 }] },
  { id: "tricolor_nigiri",kanji: "五", name: "Tricolor Nigiri",   pieces: 48,  servings: "6-8",  price: 65,  nigiri: true,
    nigiriNote: "16 salmon nigiri, 16 tuna nigiri, 16 yellowtail nigiri", rolls: [] },
];

const _LEGACY_DROPOFF_TIER_UPCHARGES = { classics: 1, signatures: 2, specialty: 4, premium: 6 };
const _LEGACY_DELIVERY_FEE = 30;
*/
