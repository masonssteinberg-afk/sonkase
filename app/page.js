"use client";
import { useState, useEffect, useRef } from "react";
import { TIERS, PIECES_PER_GUEST, tierTotalRange, formatUSD } from "@/lib/pricing";

/* ── Design tokens — editorial minimalism ─────────────────────
   Type-led, heavy whitespace, one strong image per section.
   One accent, used on links, Reserve buttons, and eyebrows only. */
const PAPER  = "#FAF8F4";
const INK    = "#1A1A18";
const MUTED  = "#6B6862";
const HAIR   = "#E2DED6";
const ACCENT = "#C4562F";
const IMGBG  = "#EDE9E1";

const SERIF = "'Fraunces', Georgia, serif";
const SANS  = "'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";

// Sections not yet live — flip on when content exists.
const SHOW_TESTIMONIALS = false;
const SHOW_INSTAGRAM    = false;

// ── Page ──────────────────────────────────────────────────────
export default function Home() {
  const [pastHero, setPastHero] = useState(false);
  const heroEndRef = useRef(null);

  // Supabase magic-link redirect (unchanged auth behavior)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/profile" + window.location.hash;
    }
  }, []);

  // Header goes paper-backed once the hero scrolls past
  useEffect(() => {
    const el = heroEndRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setPastHero(!e.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div style={{ background: PAPER, color: INK, fontFamily: SANS, overflowX: "hidden", minHeight: "100vh" }}>
      <PageStyles />
      <Header pastHero={pastHero} />
      <Hero />
      <div ref={heroEndRef} aria-hidden="true" />
      <HowItWorks />
      <Standards />
      <PricingSection />
      <ReserveBand />
      <ChefBio />
      <Sourcing />
      {SHOW_TESTIMONIALS && <Testimonials />}
      {SHOW_INSTAGRAM && <InstagramGrid />}
      <ContactSection />
      <Footer />
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────
function PageStyles() {
  return (
    <style>{`
      .sk-home { background: ${PAPER}; }
      .sk-home ::selection { background: ${ACCENT}; color: ${PAPER}; }

      .rv { opacity: 0; transform: translateY(16px); }
      .rv.rv-in { opacity: 1; transform: translateY(0); }
      @media (prefers-reduced-motion: no-preference) {
        .rv { transition: opacity 400ms ease-out, transform 400ms ease-out; }
      }
      @media (prefers-reduced-motion: reduce) {
        html { scroll-behavior: auto; }
        .rv { opacity: 1; transform: none; }
      }

      .sk-btn {
        display: inline-block;
        background: ${ACCENT};
        color: ${PAPER};
        font-family: ${SANS};
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.02em;
        padding: 14px 36px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        text-decoration: none;
        transition: background 0.2s;
      }
      .sk-btn:hover { background: #A94523; }
      .sk-btn:focus-visible, .sk-link:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 3px; }

      .sk-link {
        color: ${ACCENT};
        text-decoration: none;
        font-family: ${SANS};
        font-size: 14px;
        font-weight: 500;
      }
      .sk-link:hover { text-decoration: underline; }

      .sk-navlink {
        color: ${INK};
        font-family: ${SANS};
        font-size: 14px;
        font-weight: 400;
        text-decoration: none;
        padding: 8px 14px;
      }
      .sk-navlink:hover { color: ${ACCENT}; }

      .sk-field {
        width: 100%;
        background: #FFFFFF;
        border: 1px solid ${HAIR};
        border-radius: 2px;
        color: ${INK};
        font-family: ${SANS};
        font-size: 16px;
        padding: 14px 16px;
        outline: none;
      }
      .sk-field::placeholder { color: ${MUTED}; opacity: 0.7; }
      .sk-field:focus { border-color: ${ACCENT}; }

      .sk-hero-media { aspect-ratio: 16 / 9; }
      .sk-split { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
      .sk-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
      .sk-section { padding: 128px 24px; }
      .sk-h1 { font-size: 64px; }
      .sk-h2 { font-size: 40px; }

      @media (max-width: 768px) {
        .sk-hero-media { aspect-ratio: 4 / 5; }
        .sk-split { grid-template-columns: 1fr !important; gap: 40px; }
        .sk-cards { grid-template-columns: 1fr; }
        .sk-section { padding: 72px 24px; }
        .sk-h1 { font-size: 38px; }
        .sk-h2 { font-size: 28px; }
        .sk-nav-center { display: none !important; }
        .sk-split-img-first { order: -1; }
      }
    `}</style>
  );
}

// ── Shared bits ───────────────────────────────────────────────
function Reveal({ children }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} className={`rv${inView ? " rv-in" : ""}`}>{children}</div>;
}

function Eyebrow({ children }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.12em", color: ACCENT, marginBottom: 20 }}>
      {children}
    </div>
  );
}

function Heading({ children, style }) {
  return (
    <h2 className="sk-h2" style={{ fontFamily: SERIF, fontWeight: 400, textTransform: "lowercase", color: INK, lineHeight: 1.15, margin: "0 0 28px", ...style }}>
      {children}
    </h2>
  );
}

/* Flat placeholder block until photography exists — the label names the shot. */
function ImageSlot({ label, aspect = "4 / 3", className = "" }) {
  return (
    <div className={className} style={{ background: IMGBG, aspectRatio: aspect, display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
      <span style={{ fontFamily: SANS, fontSize: 12, color: MUTED, letterSpacing: "0.08em" }}>{label}</span>
    </div>
  );
}

function Logo({ height = 44 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" height={height} role="img" aria-label="Sonakase">
      <g transform="translate(18, 10) scale(0.9)">
        <line x1="35" y1="12" x2="42" y2="108" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <line x1="55" y1="12" x2="48" y2="108" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="45" cy="19" r="3" fill={MUTED} />
        <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke={MUTED} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke={MUTED} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5" />
        <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke={MUTED} strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.25" />
      </g>
      <line x1="118" y1="28" x2="118" y2="112" stroke={MUTED} strokeWidth="0.7" opacity="0.6" />
      <text x="138" y="88" fontFamily="'Fraunces', Georgia, serif" fontWeight="400" fontSize="52" letterSpacing="11" fill={INK}>sonakase</text>
    </svg>
  );
}

// ── Header ────────────────────────────────────────────────────
function Header({ pastHero }) {
  const [loggedIn, setLoggedIn] = useState(false);

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
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: pastHero ? PAPER : "transparent",
      borderBottom: `1px solid ${pastHero ? HAIR : "transparent"}`,
      transition: "background 0.25s, border-color 0.25s",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <a href="/" style={{ display: "flex", alignItems: "center" }} aria-label="Sonakase home">
          <Logo height={36} />
        </a>
        <nav className="sk-nav-center" style={{ display: "flex", alignItems: "center" }}>
          <a href="#how"     className="sk-navlink">how it works</a>
          <a href="#pricing" className="sk-navlink">pricing</a>
          <a href="#about"   className="sk-navlink">about</a>
          <a href="#contact" className="sk-navlink">contact</a>
          <a href="/profile" className="sk-navlink">{loggedIn ? "my bookings" : "login"}</a>
        </nav>
        <a href="/book" className="sk-btn" style={{ padding: "11px 26px" }}>reserve</a>
      </div>
    </header>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ position: "relative" }}>
      <ImageSlot label="overhead counter build" className="sk-hero-media" />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px", width: "100%" }}>
          <Eyebrow>gainesville, florida</Eyebrow>
          <h1 className="sk-h1" style={{ fontFamily: SERIF, fontWeight: 400, textTransform: "lowercase", color: INK, lineHeight: 1.08, margin: "0 0 20px" }}>
            a sushi chef<br />in your kitchen
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 17, color: MUTED, lineHeight: 1.7, margin: "0 0 32px", maxWidth: 480 }}>
            private sushi catering for 8 to 50 guests, cut in front of your guests.
          </p>
          <a href="/book" className="sk-btn">reserve</a>
        </div>
      </div>
    </section>
  );
}

// ── Split section scaffold ────────────────────────────────────
function Split({ id, eyebrow, heading, imageLabel, imageAspect, flip, children }) {
  return (
    <section id={id} style={{ borderTop: `1px solid ${HAIR}` }}>
      <div className="sk-section" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div className="sk-split">
            {flip && <ImageSlot label={imageLabel} aspect={imageAspect} className="sk-split-img-first" />}
            <div>
              <Eyebrow>{eyebrow}</Eyebrow>
              <Heading>{heading}</Heading>
              {children}
            </div>
            {!flip && <ImageSlot label={imageLabel} aspect={imageAspect} />}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────
function HowItWorks() {
  return (
    <Split
      id="how"
      eyebrow="no restaurant, no reservation, no drive home"
      heading="how it works"
      imageLabel="chef slicing"
      imageAspect="4 / 3"
    >
      <p style={{ fontFamily: SANS, fontSize: 17, color: MUTED, lineHeight: 1.7, margin: 0 }}>
        I arrive about an hour before service and set up on your kitchen counter.
        For the next two hours I cut sushi in front of your guests and lay it out
        as they eat, so nothing sits. Around {PIECES_PER_GUEST === 16 ? "sixteen" : PIECES_PER_GUEST} pieces
        per person, a mix of nigiri and rolls, plus sides and sauces. You provide
        counter space. I bring everything else and clean up before I leave.
      </p>
    </Split>
  );
}

// ── Standards ─────────────────────────────────────────────────
const STANDARDS = [
  "Fish gets cut the day you eat it, never the day before.",
  "Rice gets seasoned the morning of your event, and it is the thing I am pickiest about.",
  "I leave your kitchen cleaner than I found it.",
];

function Standards() {
  return (
    <Split
      eyebrow="what i care about"
      heading="three things I do not compromise on"
      imageLabel="finished spread"
      imageAspect="3 / 4"
      flip
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {STANDARDS.map((s) => (
          <div key={s} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span aria-hidden="true" style={{ color: ACCENT, fontSize: 15, lineHeight: "27px", flexShrink: 0 }}>✓</span>
            <span style={{ fontFamily: SANS, fontSize: 17, color: INK, lineHeight: 1.7 }}>{s}</span>
          </div>
        ))}
      </div>
    </Split>
  );
}

// ── Pricing ───────────────────────────────────────────────────
function PricingSection() {
  return (
    <section id="pricing" style={{ borderTop: `1px solid ${HAIR}` }}>
      <div className="sk-section" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <Eyebrow>three sizes</Eyebrow>
            <Heading style={{ marginBottom: 0 }}>what it costs</Heading>
          </div>
        </Reveal>
        <Reveal>
          <div className="sk-cards">
            {TIERS.map((t) => {
              const range = tierTotalRange(t);
              return (
                <div key={t.id} style={{ border: `1px solid ${HAIR}`, borderRadius: 2, padding: "40px 32px", background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
                  <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 400, textTransform: "lowercase", color: INK, marginBottom: 6 }}>
                    {t.name.toLowerCase()}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginBottom: 28 }}>
                    {t.minGuests} to {t.maxGuests} guests
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, color: INK, lineHeight: 1.1, whiteSpace: "nowrap" }}>
                    {formatUSD(range.low)}<span style={{ color: MUTED }}>–</span>{formatUSD(range.high)}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, margin: "10px 0 24px" }}>
                    ${t.perGuest} per guest
                  </div>
                  <p style={{ fontFamily: SANS, fontSize: 15, color: MUTED, lineHeight: 1.7, margin: "0 0 28px" }}>
                    {t.tagline}
                  </p>
                  <div style={{ flex: 1 }} />
                  <a href="/book" className="sk-link">reserve →</a>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ReserveBand() {
  return (
    <section style={{ padding: "0 24px 128px", textAlign: "center" }}>
      <Reveal>
        <a href="/book" className="sk-btn">reserve your date</a>
      </Reveal>
    </section>
  );
}

// ── Chef bio ──────────────────────────────────────────────────
function ChefBio() {
  return (
    <section id="about" style={{ borderTop: `1px solid ${HAIR}` }}>
      <div className="sk-section" style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal>
          <div className="sk-split">
            <img
              src="/chef-portrait.jpg"
              alt="Mason Steinberg, Founder & Executive Chef"
              className="sk-split-img-first"
              style={{ width: "100%", display: "block" }}
            />
            <div>
              <Eyebrow>fifteen years old, washing dishes</Eyebrow>
              <Heading style={{ marginBottom: 8 }}>mason steinberg</Heading>
              <div style={{ fontFamily: SANS, fontSize: 13, color: MUTED, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 28 }}>
                Founder &amp; Executive Chef
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <p style={{ fontFamily: SANS, fontSize: 16, color: MUTED, lineHeight: 1.7, margin: 0 }}>
                  Mason grew up sitting at the sushi bar as a kid, watching the chef work. He started practicing at home, rolling on his own with grocery store fish and YouTube. By 15 he had his first kitchen job as a dishwasher.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 16, color: MUTED, lineHeight: 1.7, margin: 0 }}>
                  The week he turned 16 and got his license, he drove back to the place he grew up sitting in front of the bar — now working behind it. Over the next few years he worked his way through some of Gainesville&rsquo;s most notable sushi spots, moving from prep to rolling, learning the craft the right way across multiple kitchens.
                </p>
                <p style={{ fontFamily: SANS, fontSize: 16, color: MUTED, lineHeight: 1.7, margin: 0 }}>
                  Along the way he started doing sushi nights for his family. Rolling for the people he grew up with, at home, around the table. It was always his favorite part. At 20 he decided other people deserved that too. That is Sonakase&trade;.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Sourcing ──────────────────────────────────────────────────
function Sourcing() {
  return (
    <Split
      eyebrow="cut the day you eat it"
      heading="the sourcing"
      imageLabel="fresh fish, day of"
      imageAspect="1 / 1"
    >
      <p style={{ fontFamily: SANS, fontSize: 17, color: MUTED, lineHeight: 1.7, margin: "0 0 20px" }}>
        Every protein is sourced fresh from trusted local and regional seafood markets. Rice is seasoned the day of your event. Nothing is prepared days in advance.
      </p>
      <div style={{ fontFamily: SANS, fontSize: 14, color: INK, fontWeight: 500 }}>
        ServSafe Food Manager Certified
      </div>
    </Split>
  );
}

// ── Flagged-off sections ──────────────────────────────────────
function Testimonials() {
  return null; // populate when testimonials exist, then flip SHOW_TESTIMONIALS
}

function InstagramGrid() {
  return null; // populate with feed embed, then flip SHOW_INSTAGRAM
}

// ── Contact ───────────────────────────────────────────────────
function ContactSection() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus]   = useState("idle"); // idle | sending | success | error

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("subject");
    if (s) {
      setSubject(s);
      setTimeout(() => {
        const el = document.getElementById("contact");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();
      setStatus(data.success ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" style={{ borderTop: `1px solid ${HAIR}` }}>
      <div className="sk-section" style={{ maxWidth: 560, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow>get in touch</Eyebrow>
            <Heading style={{ marginBottom: 0 }}>have a question?</Heading>
          </div>
        </Reveal>
        <Reveal>
          {status === "success" ? (
            <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 17, color: INK, lineHeight: 1.7 }}>
              Thank you. We&rsquo;ll be in touch.
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <input type="text"  className="sk-field" placeholder="Name"    value={name}    onChange={(e) => setName(e.target.value)} required />
              <input type="email" className="sk-field" placeholder="Email"   value={email}   onChange={(e) => setEmail(e.target.value)} required />
              <input type="text"  className="sk-field" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              <textarea className="sk-field" placeholder="Message" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required style={{ resize: "vertical" }} />
              {status === "error" && (
                <div style={{ fontFamily: SANS, fontSize: 14, color: ACCENT }}>
                  Something went wrong. Please try again.
                </div>
              )}
              <button type="submit" disabled={status === "sending"} className="sk-btn" style={{ opacity: status === "sending" ? 0.6 : 1 }}>
                {status === "sending" ? "sending…" : "send message"}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: `1px solid ${HAIR}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 24px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32, flexWrap: "wrap", marginBottom: 48 }}>
          <div>
            <a href="/" aria-label="Sonakase home"><Logo height={32} /></a>
            <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginTop: 16 }}>
              <a href="mailto:bookings@sonakase.com" style={{ color: MUTED }}>bookings@sonakase.com</a>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: MUTED, marginTop: 6 }}>
              serving gainesville and surrounding areas
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <a href="#how"     className="sk-navlink" style={{ padding: 0 }}>how it works</a>
            <a href="#pricing" className="sk-navlink" style={{ padding: 0 }}>pricing</a>
            <a href="#about"   className="sk-navlink" style={{ padding: 0 }}>about</a>
            <a href="#contact" className="sk-navlink" style={{ padding: 0 }}>contact</a>
            <a href="/book"    className="sk-btn" style={{ padding: "11px 26px", marginTop: 8, alignSelf: "flex-start" }}>reserve</a>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${HAIR}`, paddingTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            Consuming raw or undercooked seafood may increase your risk of foodborne illness. All fish is sourced and handled to commercial food safety standards.
          </p>
          <p style={{ fontFamily: SANS, fontSize: 12, color: MUTED, margin: 0 }}>
            © 2026 Sonakase™ · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
