"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

// ── Design Tokens ──────────────────────────────────────────────
const BG    = "#0d0d0d";
const BG2   = "#141414";
const GOLD  = "#E8C97E";
const CREAM = "#F5F0E8";

// ── Packages (no ™ on individual names per brand guidelines) ──
const PACKAGES = [
  {
    id: "datenight", name: "Date Night", guests: 2, price: 300,
    includes: ["9 piece nigiri course", "1 appetizer of your choice", "5 rolls, chef's selection", "90 minute experience"],
  },
  {
    id: "doubledatenight", name: "Double Date Night", guests: 4, price: 520,
    includes: ["18 piece nigiri course", "2 appetizers of your choice", "10 rolls, chef's selection", "90 minute experience"],
  },
  {
    id: "smallgathering", name: "Small Gathering", guests: 6, price: 720,
    includes: ["27 piece nigiri course", "2 appetizers of your choice", "14 rolls, chef's selection", "90 minute experience"],
  },
  {
    id: "gettogether", name: "Get Together", guests: 8, price: 900,
    includes: ["36 piece nigiri course", "3 appetizers of your choice", "18 rolls, chef's selection", "90 minute experience"],
  },
];

const HOW_STEPS = [
  { num: "一", title: "Reserve",    desc: "Book online, select your experience, pay a 25% deposit to lock your date." },
  { num: "二", title: "We Prepare", desc: "Your chef sources fresh fish and preps everything the day before." },
  { num: "三", title: "We Arrive",  desc: "Chef arrives 30 minutes early and sets up in your kitchen." },
  { num: "四", title: "You Enjoy",  desc: "Sit back while your chef rolls course by course." },
];

/* ======================================================================
   LEGACY CODE — All previous Chef's Special homepage code preserved below.
   Not displayed. Not deleted.
   ======================================================================

   Previous brand: Chef's Special™ · Private Sushi · Gainesville
   Previous color palette: NAVY #0d1729, PERSIMMON #c5552d, CREAM #f5ecd9, GOLD #a07736
   Previous fonts: Shippori Mincho (display), Crimson Pro (body)

   Previous homepage sections:
   - Nav with "Chef's Special™" wordmark, "How It Works" + "Book Now" links
   - Hero with rotating headlines (5 phrases), full viewport, dark navy background
   - ExperienceSection: 4 package cards in 2x2 grid (Date Night, Double Date Night, Small Gathering, Get Together)
   - HowItWorksSection: 4 steps, navy background
   - MenuSection: 34 rolls organized by tier (Classics, Signatures, Specialty, Premium)
   - PhotoSection: placeholder
   - SiteFooter: wordmark left, CTA right

   Previous OMAKASE_PACKAGES data, ROLLS data, TIERS data, HOW_STEPS (4 steps)
   are all preserved in comments in book/page.js.

   Previous PER-GUEST PACKAGES A / B / C and DROP-OFF PLATTERS are preserved
   in the LEGACY DATA block in book/page.js.
   ====================================================================== */

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.location.href = "/profile" + window.location.hash;
    }
  }, []);

  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "Georgia, 'Times New Roman', serif", overflowX: "hidden" }}>
      <PageStyles />
      <Nav />
      <Hero />
      <ExperiencesSection />
      <HowItWorksSection />
      <ContactSection />
      <PhotoSection />
      <SiteFooter />
    </div>
  );
}


// ── Page Styles ───────────────────────────────────────────────
function PageStyles() {
  return (
    <style>{`
      .sk-hero { padding: 140px 40px 100px; }

      @keyframes float {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(-10px); }
        100% { transform: translateY(0px); }
      }
      .hero-icon { animation: float 3s ease-in-out infinite; }

      .sk-nav-link {
        font-family: Georgia, serif;
        font-size: 12px;
        letter-spacing: 0.25em;
        text-transform: uppercase;
        color: rgba(245,240,232,0.55);
        text-decoration: none;
        transition: color 0.2s;
        padding: 0 20px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
      }
      .sk-nav-link:hover { color: ${CREAM}; }

      .sk-btn-fill {
        background: ${GOLD};
        color: ${BG};
        border: none;
        font-family: Georgia, serif;
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        padding: 0 32px;
        transition: opacity 0.2s;
      }
      .sk-btn-fill:hover { opacity: 0.88; }

      .sk-btn-ghost {
        background: transparent;
        color: ${GOLD};
        border: 1px solid ${GOLD};
        font-family: Georgia, serif;
        font-size: 12px;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 52px;
        padding: 0 32px;
        transition: background 0.2s;
      }
      .sk-btn-ghost:hover { background: rgba(232,201,126,0.08); }

      .sk-contact-field {
        background: transparent;
        border: none;
        border-bottom: 1px solid rgba(232,201,126,0.4);
        color: ${CREAM};
        font-family: Georgia, serif;
        font-size: 16px;
        width: 100%;
        padding: 14px 0;
        outline: none;
        transition: border-color 0.2s;
      }
      .sk-contact-field::placeholder { color: rgba(245,240,232,0.35); }
      .sk-contact-field:focus { border-bottom-color: ${GOLD}; }

      .sk-pkg-card {
        background: ${BG};
        border: 1px solid rgba(232,201,126,0.2);
        padding: 40px 36px 36px;
        display: flex;
        flex-direction: column;
        transition: border-color 0.2s;
      }
      .sk-pkg-card:hover { border-color: rgba(232,201,126,0.45); }

      @media (max-width: 768px) {
        .sk-nav-links { display: none !important; }
        .sk-pkg-grid  { grid-template-columns: 1fr !important; }
        .sk-how-grid  { grid-template-columns: 1fr !important; }
        .sk-hero-logo { width: 220px !important; }
        .sk-section   { padding: 80px 24px !important; }
        .sk-hero      { padding: 140px 24px 80px !important; }
        .sk-footer-inner { flex-direction: column !important; gap: 32px !important; align-items: flex-start !important; }
      }
    `}</style>
  );
}

// ── Nav ───────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    (async () => {
      const { createClient } = await import("@supabase/supabase-js");
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
      const { data: { session } } = await sb.auth.getSession();
      setLoggedIn(!!session?.user);
      sb.auth.onAuthStateChange((_, s) => setLoggedIn(!!s?.user));
    })();
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: BG,
      borderBottom: `1px solid rgba(232,201,126,${scrolled ? "0.18" : "0.1"})`,
      transition: "border-color 0.3s",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 32px", height: 72,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxSizing: "border-box",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <img src="/sonkase-logo.svg" alt="Sonkase Private Dining" width={200} height={58} style={{ display: "block" }} />
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="sk-nav-links" style={{ display: "flex", alignItems: "center" }}>
            <a href="#experiences" className="sk-nav-link">Experiences</a>
            <a href="#contact"     className="sk-nav-link">Contact</a>
            <a href="/profile"     className="sk-nav-link">{loggedIn ? "My Bookings" : "Login"}</a>
          </div>
          <a href="/book" className="sk-btn-fill" style={{ fontSize: 11, letterSpacing: "0.2em", minHeight: 44, padding: "0 22px" }}>
            Reserve
          </a>
        </div>
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      background: BG, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center",
    }}
      className="sk-hero"
      id="top"
    >
      <a href="/" style={{ textDecoration: "none", marginBottom: 36 }}>
        <Image src="/favicon-transparent.png" alt="Sonkase" width={110} height={110} priority className="hero-icon" />
      </a>

      {/* Gold line */}
      <div style={{ width: 120, height: 1, background: GOLD, opacity: 0.6, margin: "0 auto 24px" }} />

      {/* Location */}
      <div style={{
        fontFamily: "Georgia, serif", fontSize: 11,
        color: GOLD, letterSpacing: "0.45em", textTransform: "uppercase",
        marginBottom: 72,
      }}>
        Gainesville, FL
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 340 }}>
        <a href="/book" className="sk-btn-fill" style={{ width: "100%" }}>
          Reserve Your Experience →
        </a>
        <a href="#experiences" className="sk-btn-ghost" style={{ width: "100%" }}>
          Learn More
        </a>
      </div>
    </section>
  );
}

// ── Experiences Section ───────────────────────────────────────
function ExperiencesSection() {
  return (
    <section id="experiences" style={{ background: BG2 }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
          The Experience
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 52px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 24, lineHeight: 1.1 }}>
          True omakase. Your home.
        </h2>

        {/* Body */}
        <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: `rgba(245,240,232,0.6)`, textAlign: "center", maxWidth: 560, margin: "0 auto 80px", lineHeight: 1.8 }}>
          A private chef arrives at your home, rolls course by course while you watch. For sushi lovers of all kinds. Not a fan of cream cheese in your sushi? No worries. Don't like spicy food? We will make sure your experience is as sweet as can be!
        </p>

        {/* Package cards */}
        <div className="sk-pkg-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 48 }}>
          {PACKAGES.map((p) => (
            <div key={p.id} className="sk-pkg-card">
              {/* Name */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: CREAM, letterSpacing: "0.1em", marginBottom: 10 }}>
                {p.name}
              </div>

              {/* Guest count */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>
                {p.guests} guests
              </div>

              {/* Price */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 38, color: CREAM, fontWeight: 400, marginBottom: 28, lineHeight: 1 }}>
                ${p.price}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: GOLD, opacity: 0.2, marginBottom: 28 }} />

              {/* Includes */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 36 }}>
                {p.includes.map((item) => (
                  <div key={item} style={{ fontFamily: "Georgia, serif", fontSize: 14, color: `rgba(245,240,232,0.7)`, lineHeight: 1.5 }}>
                    {item}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <a href="/book" style={{ fontFamily: "Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.2em", textDecoration: "none", textTransform: "uppercase", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
                Reserve →
              </a>
            </div>
          ))}
        </div>

        {/* Below cards note */}
        <p style={{ fontFamily: "Georgia, serif", fontSize: 13, color: `rgba(245,240,232,0.4)`, fontStyle: "italic", textAlign: "center", lineHeight: 1.7 }}>
          Gratuity appreciated, never expected. All experiences include wasabi, pickled ginger, soy sauce, and chopsticks.
        </p>
      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section style={{ background: BG }}>
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
          The Process
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 44px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 80, lineHeight: 1.15 }}>
          Simple from start to finish.
        </h2>

        {/* Steps */}
        <div className="sk-how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>
          {HOW_STEPS.map((s, i) => (
            <div key={s.num} style={{
              padding: "0 32px 0 0",
              borderRight: i < HOW_STEPS.length - 1 ? `1px solid rgba(232,201,126,0.15)` : "none",
              marginRight: i < HOW_STEPS.length - 1 ? 0 : 0,
              paddingLeft: i > 0 ? 32 : 0,
            }}>
              {/* Numeral */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 52, color: GOLD, opacity: 0.3, lineHeight: 1, marginBottom: 20, fontWeight: 400 }}>
                {s.num}
              </div>
              {/* Title */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, letterSpacing: "0.08em", marginBottom: 14, fontWeight: 400 }}>
                {s.title}
              </div>
              {/* Description */}
              <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: `rgba(245,240,232,0.55)`, lineHeight: 1.75 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Contact Section ───────────────────────────────────────────
function ContactSection() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState("idle"); // idle | sending | success | error

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" style={{ background: BG2 }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 480, margin: "0 auto", boxSizing: "border-box" }}>
        {/* Eyebrow */}
        <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
          Get In Touch
        </div>

        {/* Headline */}
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 40px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 56, lineHeight: 1.2 }}>
          Have a question?
        </h2>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "Georgia, serif", fontSize: 18, color: GOLD, fontStyle: "italic", lineHeight: 1.6 }}>
            Thank you. We&rsquo;ll be in touch.
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <div>
              <input
                type="text"
                className="sk-contact-field"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="email"
                className="sk-contact-field"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <textarea
                className="sk-contact-field"
                placeholder="Message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            {status === "error" && (
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "#c5552d", fontStyle: "italic" }}>
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="sk-btn-fill"
              style={{ width: "100%", opacity: status === "sending" ? 0.6 : 1 }}
            >
              {status === "sending" ? "Sending…" : "Send Message"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

// ── Photo Placeholder ─────────────────────────────────────────
function PhotoSection() {
  return (
    <section style={{ background: BG, position: "relative", overflow: "hidden", minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* "S" watermark */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Georgia, serif", fontSize: 300, fontWeight: 400,
        color: GOLD, opacity: 0.05, lineHeight: 1,
        pointerEvents: "none", userSelect: "none",
      }}>S</div>
      <div style={{ position: "relative", zIndex: 2, textAlign: "center", padding: "80px 40px" }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 14, color: `rgba(245,240,232,0.3)`, fontStyle: "italic" }}>
          Photography coming soon.
        </p>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer style={{ background: BG }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px 36px", boxSizing: "border-box" }}>
        <div className="sk-footer-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <Image src="/sonkase-logo.svg" alt="Sonkase Private Dining" width={136} height={40} />
          </a>
          <a href="/book" className="sk-btn-fill" style={{ fontSize: 11 }}>
            Reserve Your Experience →
          </a>
        </div>
        <div style={{ borderTop: `1px solid rgba(232,201,126,0.12)`, paddingTop: 24 }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 11, color: `rgba(245,240,232,0.3)`, letterSpacing: "0.05em" }}>
            © 2025 Sonkase™ · Gainesville, FL · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
