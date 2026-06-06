"use client";
import { useState, useEffect, useRef } from "react";

// ── Design Tokens ──────────────────────────────────────────────
const BG    = "#0d0d0d";
const BG2   = "#141414";
const GOLD  = "#E8C97E";
const CREAM = "#F5F0E8";

// ── Packages (no ™ on individual names per brand guidelines) ──
const PACKAGES = [
  {
    id: "datenight", name: "date night", guests: 2, price: 275,
    includes: ["9 piece nigiri course", "1 appetizer of your choice", "5 rolls, chef's selection"],
  },
  {
    id: "doubledatenight", name: "double date", guests: 4, price: 420,
    includes: ["18 piece nigiri course", "2 appetizers of your choice", "10 rolls, chef's selection"],
  },
  {
    id: "smallgathering", name: "small gathering", guests: 6, price: 580,
    includes: ["27 piece nigiri course", "3 appetizers of your choice", "14 rolls, chef's selection"],
  },
  {
    id: "gettogether", name: "get together", guests: 8, price: 720,
    includes: ["36 piece nigiri course", "4 appetizers of your choice", "18 rolls, chef's selection"],
  },
];

// ── Promo helpers ─────────────────────────────────────────────
const HINT_FNS = [
  (code, promo) => [`use `,           code, ` at checkout — ${promo.discount_type === "percent" ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}`],
  (code, promo) => [`enter `,         code, ` at checkout to save ${promo.discount_type === "percent" ? `${promo.discount_value}%` : `$${promo.discount_value}`}`],
  (code, promo) => [``,               code, ` at checkout takes ${promo.discount_type === "percent" ? `${promo.discount_value}%` : `$${promo.discount_value}`} off`],
  (code, promo) => [`apply `,         code, ` at checkout for ${promo.discount_type === "percent" ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}`],
  (code, promo) => [`use code `,      code, ` at checkout — ${promo.discount_type === "percent" ? `${promo.discount_value}% off` : `$${promo.discount_value} off`} your booking`],
  (code, promo) => [``,               code, ` saves ${promo.discount_type === "percent" ? `${promo.discount_value}%` : `$${promo.discount_value}`} — add it at checkout`],
  (code, promo) => [`don't forget: `, code, ` at checkout for ${promo.discount_type === "percent" ? `${promo.discount_value}% off` : `$${promo.discount_value} off`}`],
];

function HintDisplay({ parts }) {
  return (
    <>
      <span>{parts[0]}</span>
      <span style={{ color: "#ffffff", fontStyle: "normal", letterSpacing: "0.06em" }}>{parts[1]}</span>
      <span>{parts[2]}</span>
    </>
  );
}

const N = (f, o) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;

function calcDiscountedPrice(price, promo) {
  if (!promo) return null;
  const raw = promo.discount_type === "percent"
    ? price * (1 - promo.discount_value / 100)
    : Math.max(0, price - promo.discount_value);
  return Math.round(raw / 5) * 5;
}

const HOW_STEPS = [
  { num: "一", title: "reserve",     desc: "book online, select your experience, pay a 25% deposit to lock your date." },
  { num: "二", title: "we prepare",  desc: "your chef sources fresh fish and preps everything the day before." },
  { num: "三", title: "we arrive",   desc: "chef arrives 30 minutes early and sets up in your kitchen." },
  { num: "四", title: "you enjoy",   desc: "sit back while your chef rolls course by course." },
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
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/profile" + window.location.hash;
      return;
    }
    // Definition section lives above the hero — snap there on load so it's only revealed by scrolling up
    if (!window.location.hash) {
      const hero = document.getElementById("top");
      if (hero) window.scrollTo({ top: hero.offsetTop, behavior: "instant" });
    }
  }, []);

  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "Georgia, 'Times New Roman', serif", overflowX: "hidden" }}>
      <PageStyles />
      <Nav />
      <AboutSection />
      <Hero />
      <ExperiencesSection />
      <HowItWorksSection />
      <AboutChefSection />
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
      :root { --header-h: 100px; }
      @media (max-width: 768px) { :root { --header-h: 72px; } }

      .sk-hero { padding: calc(140px + var(--banner-h, 0px)) 40px 100px; }

      @keyframes hint-pulse {
        0%, 100% { opacity: 0.35; transform: scale(0.92); }
        50%       { opacity: 1;   transform: scale(1.06); }
      }
      .sk-promo-hint {
        font-family: Georgia, serif;
        font-style: italic;
        font-size: 12px;
        color: #E8C97E;
        margin-top: 12px;
        display: block;
        transform-origin: left center;
        animation: hint-pulse 2.4s ease-in-out infinite;
      }

      @keyframes bob {
        0%   { transform: translateY(0px); }
        50%  { transform: translateY(16px); }
        100% { transform: translateY(0px); }
      }
      .hero-icon { animation: bob 2.5s ease-in-out infinite; }

      .sk-nav-link {
        font-family: Georgia, serif;
        font-size: 12px;
        letter-spacing: 0.12em;
        color: #e6dac8;
        text-decoration: none;
        transition: color 0.2s;
        padding: 0 20px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
      }
      .sk-nav-link:hover { color: #fff; }

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

      .sk-party-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 52px;
        padding: 0 40px;
        border: 1px solid rgba(232,201,126,0.4);
        background: transparent;
        font-family: Georgia, serif;
        font-size: 13px;
        color: ${GOLD};
        letter-spacing: 0.2em;
        text-decoration: none;
        transition: border-color 0.2s, color 0.2s;
      }
      .sk-party-btn:hover { border-color: ${GOLD}; color: #fff8ec; }

      .sk-about-grid {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 80px;
        align-items: start;
      }

      @media (max-width: 768px) {
        .sk-nav-links { display: none !important; }
        .sk-pkg-grid  { grid-template-columns: 1fr !important; }
        .sk-how-grid  { grid-template-columns: 1fr !important; }
        .sk-hero-logo { width: 220px !important; }
        .sk-section   { padding: 60px 20px !important; }
        .sk-hero      { padding: calc(110px + var(--banner-h, 0px)) 20px 60px !important; }
        .sk-footer-inner { flex-direction: column !important; gap: 32px !important; align-items: flex-start !important; }
        .sk-nav-inner { height: 72px !important; padding: 0 16px !important; }
        .sk-nav-logo  { width: 200px !important; height: 56px !important; }
        .sk-party-btn { width: 100% !important; box-sizing: border-box !important; }
        .sk-pkg-card  { padding: 28px 20px 24px !important; }
        .sk-promo-hint { font-size: 13px !important; }
        .sk-about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
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
      <div className="sk-nav-inner" style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 40px", height: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxSizing: "border-box",
      }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <svg className="sk-nav-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="320" height="90" role="img" aria-label="Sonakase Private Dining">
            <defs>
              <style>{"@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400&family=Cormorant+Garamond:wght@300&display=swap');"}</style>
            </defs>
            <g transform="translate(18, 10) scale(0.9)">
              <line x1="35" y1="12" x2="42" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
              <line x1="55" y1="12" x2="48" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
              <circle cx="45" cy="19" r="3" fill="#b8892a"/>
              <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke="#b8892a" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke="#b8892a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"/>
              <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke="#b8892a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.22"/>
            </g>
            <line x1="118" y1="28" x2="118" y2="112" stroke="#b8892a" strokeWidth="0.7" opacity="0.6"/>
            <text x="138" y="88" fontFamily="'Shippori Mincho', 'Hiragino Mincho Pro', 'Times New Roman', serif" fontWeight="400" fontSize="52" letterSpacing="11" fill="#e6dac8">sonakase</text>
          </svg>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="sk-nav-links" style={{ display: "flex", alignItems: "center" }}>
            <a href="#experiences" className="sk-nav-link">experiences</a>
            <a href="#about"       className="sk-nav-link">about</a>
            <a href="#contact"     className="sk-nav-link">contact</a>
          </div>
          <a href="/profile" className="sk-nav-link">{loggedIn ? "my bookings" : "login"}</a>
        </div>
      </div>
    </nav>
  );
}

// ── Star field (3-layer parallax) ────────────────────────────
function StarField() {
  const [stars, setStars] = useState([]);
  const ref0 = useRef(null);
  const ref1 = useRef(null);
  const ref2 = useRef(null);

  useEffect(() => {
    const out = [];
    for (let i = 0; i < 95; i++) {
      // 0 = far/small, 1 = mid, 2 = near/large
      const layer   = i < 58 ? 0 : i < 82 ? 1 : 2;
      const twinkle = Math.random() > 0.72;
      const r       = layer === 0 ? 0.2 + Math.random() * 0.65
                    : layer === 1 ? 0.45 + Math.random() * 0.85
                    :               0.85 + Math.random() * 1.1;
      out.push({
        layer,
        x:       Math.random() * 100,
        y:       Math.random() * 100,
        r,
        fill:    r > 1.2 ? "#ffffff" : "#F0EBE0",
        opacity: twinkle ? undefined : 0.05 + Math.random() * 0.5,
        cls:     twinkle ? `sk-st${Math.floor(Math.random() * 3)}` : undefined,
      });
    }
    setStars(out);
  }, []);

  // Parallax: far stars move slow, near stars move fast — direct DOM update for perf
  useEffect(() => {
    const layerRefs = [ref0, ref1, ref2];
    const factors   = [0.10, 0.26, 0.46];
    let raf;
    const onScroll = () => {
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        layerRefs.forEach((r, i) => {
          if (r.current) r.current.style.transform = `translateY(${y * -factors[i]}px)`;
        });
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);

  const layerRefs = [ref0, ref1, ref2];

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <style>{`
        @keyframes sk-tw0 { 0%,100%{opacity:.52} 50%{opacity:.03} }
        @keyframes sk-tw1 { 0%,100%{opacity:.28} 50%{opacity:.05} }
        @keyframes sk-tw2 { 0%,100%{opacity:.40} 50%{opacity:.02} }
        .sk-st0 { animation: sk-tw0 2.9s ease-in-out infinite backwards; }
        .sk-st1 { animation: sk-tw1 4.1s 1.3s ease-in-out infinite backwards; }
        .sk-st2 { animation: sk-tw2 3.4s 2.6s ease-in-out infinite backwards; }
      `}</style>
      {[0, 1, 2].map((layer) => (
        <svg
          key={layer}
          ref={layerRefs[layer]}
          width="100%" height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "absolute", inset: 0, willChange: "transform" }}
        >
          {stars.filter((s) => s.layer === layer).map((s, i) => (
            <circle
              key={i}
              cx={`${s.x}%`}
              cy={`${s.y}%`}
              r={s.r}
              fill={s.fill}
              opacity={s.opacity}
              className={s.cls}
            />
          ))}
        </svg>
      ))}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 78% 62% at 50% 44%, transparent 0%, rgba(13,13,13,0.78) 100%)",
      }} />
    </div>
  );
}

// ── Scroll reveal ─────────────────────────────────────────────
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(34px)",
        transition: `opacity 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

// ── Chiyogami / Shippo pattern ───────────────────────────────
function ChiyogamiPattern({ id, opacity = 0.04 }) {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id={id} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Shippo (七宝) — five overlapping circles per tile create interlocking petal grid */}
          <circle cx="0"  cy="0"  r="20" fill="none" stroke="#E8C97E" strokeWidth="0.4" />
          <circle cx="40" cy="0"  r="20" fill="none" stroke="#E8C97E" strokeWidth="0.4" />
          <circle cx="0"  cy="40" r="20" fill="none" stroke="#E8C97E" strokeWidth="0.4" />
          <circle cx="40" cy="40" r="20" fill="none" stroke="#E8C97E" strokeWidth="0.4" />
          <circle cx="20" cy="20" r="20" fill="none" stroke="#E8C97E" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

// ── Hero ──────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{
      background: BG, backgroundImage: N(0.65, 0.022), minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", position: "relative",
    }}
      className="sk-hero"
      id="top"
    >
      <ChiyogamiPattern id="sk-shippo-hero" opacity={0.08} />
      <StarField />

      {/* Gold horizontal accent lines */}
      <div style={{
        position: "absolute",
        top: "calc(var(--header-h, 100px) + var(--banner-h, 0px) + 18px)",
        left: 0, right: 0, height: 1,
        background: "rgba(232,201,126,0.30)",
        zIndex: 2, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 24,
        left: 0, right: 0, height: 1,
        background: "rgba(232,201,126,0.30)",
        zIndex: 2, pointerEvents: "none",
      }} />

      {/* Content sits above the star layer */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>

        {/* Logo with radial glow behind the mark */}
        <div style={{ position: "relative", marginBottom: 36 }}>
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400, height: 400,
            background: "radial-gradient(circle, rgba(232,201,126,0.06) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 0,
          }} />
          <a href="/" style={{ textDecoration: "none", display: "block", position: "relative", zIndex: 1 }} className="hero-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="18 14 78 100"
              width={160}
              role="img"
              aria-label="Sonakase"
              style={{ display: "block" }}
            >
              <g transform="translate(18, 10) scale(0.9)">
                <line x1="35" y1="12" x2="42" y2="108" stroke="#e6dac8" strokeWidth="2.2" strokeLinecap="round"/>
                <line x1="55" y1="12" x2="48" y2="108" stroke="#e6dac8" strokeWidth="2.2" strokeLinecap="round"/>
                <circle cx="45" cy="19" r="4" fill="#b8892a"/>
                <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke="#b8892a" strokeWidth="2.8" strokeLinecap="round" fill="none"/>
                <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke="#b8892a" strokeWidth="1.9" strokeLinecap="round" fill="none" opacity="0.5"/>
                <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke="#b8892a" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.25"/>
              </g>
            </svg>
          </a>
        </div>

        {/* Gold line */}
        <div style={{ width: 120, height: 1, background: GOLD, opacity: 0.6, margin: "0 auto 32px" }} />

        {/* Headline */}
        <h1 style={{
          fontFamily: "Georgia, serif", fontWeight: 400,
          fontSize: "clamp(28px, 5vw, 52px)",
          color: CREAM, letterSpacing: "0.04em",
          margin: "0 0 20px", lineHeight: 1.1,
        }}>
          the sonakase experience
        </h1>

        {/* Tagline */}
        <div style={{
          fontFamily: "Georgia, serif", fontSize: "clamp(14px, 2vw, 18px)",
          color: GOLD, letterSpacing: "0.15em", fontStyle: "italic",
          marginBottom: 56,
        }}>
          Omakase Where You Are
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
      </div>
    </section>
  );
}

// ── Experiences Section ───────────────────────────────────────
function ExperiencesSection() {
  const [activePromo, setActivePromo] = useState(null);
  const [hintIndices, setHintIndices] = useState([]);

  useEffect(() => {
    const pool = Array.from({ length: HINT_FNS.length }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setHintIndices(pool.slice(0, PACKAGES.length));
    fetch("/api/public-promos")
      .then((r) => r.json())
      .then(({ promos }) => {
        if (!promos || promos.length === 0) return;
        const sorted = [...promos].sort((a, b) => {
          if (a.discount_type !== b.discount_type) return a.discount_type === "percent" ? -1 : 1;
          return b.discount_value - a.discount_value;
        });
        setActivePromo(sorted[0]);
      })
      .catch(() => {});
  }, []);

  const storePromo = () => {
    if (!activePromo) return;
    try { localStorage.setItem("sonkase_promo", JSON.stringify(activePromo)); } catch {}
  };

  return (
    <section id="experiences" style={{ background: BG2, backgroundImage: N(0.55, 0.04) }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
        <Reveal>
          {/* Eyebrow */}
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "#b8892a", letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
            the experience
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(32px, 5vw, 68px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 24, lineHeight: 1.1 }}>
            true omakase. your home.
          </h2>

          {/* Body */}
          <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: `rgba(245,240,232,0.6)`, textAlign: "center", maxWidth: 560, margin: "0 auto 80px", lineHeight: 1.8 }}>
            A private chef arrives at your home, rolls course by course while you watch. For sushi lovers of all kinds.
          </p>
        </Reveal>

        {/* Package cards */}
        <div className="sk-pkg-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, marginBottom: 48 }}>
          {PACKAGES.map((p, idx) => {
            const discounted = calcDiscountedPrice(p.price, activePromo);
            const hintParts = activePromo && hintIndices.length > 0
              ? HINT_FNS[hintIndices[idx] % HINT_FNS.length](activePromo.code, activePromo)
              : null;

            return (
              <Reveal key={p.id} delay={idx * 0.09}>
                <div className="sk-pkg-card">
                {/* Name */}
                <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: CREAM, letterSpacing: "0.1em", marginBottom: 10 }}>
                  {p.name}
                </div>

                {/* Guest count */}
                <div style={{ fontFamily: "Georgia, serif", fontSize: 11, color: "#b8892a", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 24 }}>
                  {p.guests} guests
                </div>

                {/* Price */}
                {discounted !== null ? (
                  <div style={{ marginBottom: 28 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 38, color: "rgba(232,201,126,0.35)", fontWeight: 400, lineHeight: 1, textDecoration: "line-through" }}>
                      ${p.price}
                    </div>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 38, color: GOLD, fontWeight: 400, lineHeight: 1, marginTop: 6 }}>
                      ${discounted}
                    </div>
                    <div className="sk-promo-hint">{hintParts && <HintDisplay parts={hintParts} />}</div>
                  </div>
                ) : (
                  <div style={{ fontFamily: "Georgia, serif", fontSize: 38, color: CREAM, fontWeight: 400, marginBottom: 28, lineHeight: 1 }}>
                    ${p.price}
                  </div>
                )}

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
                <a
                  href="/book"
                  onClick={storePromo}
                  style={{ fontFamily: "Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.2em", textDecoration: "none", textTransform: "uppercase", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  Reserve →
                </a>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Hosting more people */}
        <Reveal delay={0.1}>
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <a href="/parties" className="sk-party-btn">
              Hosting more people? →
            </a>
          </div>
        </Reveal>

      </div>
    </section>
  );
}

// ── How It Works ──────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section style={{ background: BG, backgroundImage: N(0.80, 0.035), position: "relative", overflow: "hidden" }}>
      <ChiyogamiPattern id="sk-shippo-how" opacity={0.04} />
      <div style={{ position: "relative", zIndex: 1 }}>
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
        <Reveal>
          {/* Eyebrow */}
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "#b8892a", letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
            the process
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 60px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 80, lineHeight: 1.15 }}>
            simple from start to finish.
          </h2>
        </Reveal>

        {/* Steps */}
        <div className="sk-how-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 0 }}>
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.num} delay={i * 0.1}>
            <div style={{
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
            </Reveal>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}

// ── About Chef Section ────────────────────────────────────────
function AboutChefSection() {
  return (
    <section id="about" style={{ background: BG2, backgroundImage: N(0.65, 0.035) }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1100, margin: "0 auto", boxSizing: "border-box" }}>
        <Reveal>
          <div className="sk-about-grid">

            {/* Left — Chef portrait */}
            <div>
              <img
                src="/chef-portrait.jpg"
                alt="Mason Steinberg, Founder & Executive Chef"
                style={{ width: "100%", display: "block" }}
              />
            </div>

            {/* Right — Text content */}
            <div>
              {/* Eyebrow */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 20 }}>
                Meet Your Chef
              </div>

              {/* Name */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 36, color: CREAM, fontWeight: 400, marginBottom: 10 }}>
                Mason Steinberg
              </div>

              {/* Title */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 32 }}>
                Founder &amp; Executive Chef
              </div>

              {/* Top divider */}
              <div style={{ width: 60, height: 1, background: GOLD, opacity: 0.4, marginBottom: 32 }} />

              {/* Bio */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 0 }}>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "rgba(245,240,232,0.75)", lineHeight: 1.8, margin: 0 }}>
                  Mason grew up sitting at the sushi bar as a kid, watching the chef work. He started practicing at home, rolling on his own with grocery store fish and YouTube. By 15 he had his first kitchen job as a dishwasher.
                </p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "rgba(245,240,232,0.75)", lineHeight: 1.8, margin: 0 }}>
                  The week he turned 16 and got his license, he drove back to that same restaurant and asked for a job. They gave him one. Over the next few years he worked his way through some of Gainesville&rsquo;s most notable sushi spots, including Ichiban, Chopstix, and Arashi Yama, moving from prep to rolling, learning the craft the right way across multiple kitchens.
                </p>
                <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: "rgba(245,240,232,0.75)", lineHeight: 1.8, margin: 0 }}>
                  Along the way he started doing sushi nights for his family. Rolling for the people he grew up with, at home, around the table. It was always his favorite part. At 20 he decided other people deserved that too. That is Sonakase&trade;.
                </p>
              </div>

              {/* Lower divider */}
              <div style={{ width: 60, height: 1, background: GOLD, opacity: 0.2, margin: "32px 0" }} />

              {/* Sourcing */}
              <div style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, marginBottom: 16 }}>
                The Sourcing
              </div>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 15, color: "rgba(245,240,232,0.75)", lineHeight: 1.8, margin: "0 0 16px" }}>
                Every protein is sourced fresh from trusted local and regional seafood markets. Rice is seasoned the day of your event. Nothing is prepared days in advance.
              </p>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: "rgba(232,201,126,0.70)", fontStyle: "italic" }}>
                ServSafe Food Manager Certified
              </div>
            </div>

          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact Section ───────────────────────────────────────────
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
    <section id="contact" style={{ background: BG2, backgroundImage: N(0.45, 0.03) }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 480, margin: "0 auto", boxSizing: "border-box" }}>
        <Reveal>
          {/* Eyebrow */}
          <div style={{ fontFamily: "Georgia, serif", fontSize: 10, color: "#b8892a", letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
            get in touch
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(28px, 4vw, 56px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 56, lineHeight: 1.2 }}>
            have a question?
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
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
              <input
                type="text"
                className="sk-contact-field"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
        </Reveal>
      </div>
    </section>
  );
}

// ── Photo Placeholder ─────────────────────────────────────────
function PhotoSection() {
  return (
    <section style={{ background: BG, backgroundImage: N(0.70, 0.03), position: "relative", overflow: "hidden", minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
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

// ── About Section (Dictionary Card) ──────────────────────────
function AboutSection() {
  const G = "#b8892a";
  const T = "#5a4a3a";
  const F = "Georgia, 'Times New Roman', serif";
  return (
    <section style={{ background: "#f5f0e8", backgroundImage: N(0.90, 0.06), padding: "calc(100px + var(--header-h, 100px)) 40px 100px", boxSizing: "border-box" }}>
      <Reveal>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Top divider: line · dot · line */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 40 }}>
          <div style={{ flex: 1, height: 1, background: G, opacity: 0.5 }} />
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: G, margin: "0 14px", opacity: 0.7 }} />
          <div style={{ flex: 1, height: 1, background: G, opacity: 0.5 }} />
        </div>

        {/* Word + pronunciation */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: F, fontSize: "clamp(44px, 7vw, 64px)", fontWeight: 400, color: G, letterSpacing: "12px", textTransform: "uppercase", lineHeight: 1 }}>
            SONAKASE
          </div>
          <div style={{ fontFamily: F, fontSize: 18, fontStyle: "italic", color: G, letterSpacing: "0.02em" }}>
            /ˈsoʊ &middot; nə &middot; keɪs/
          </div>
        </div>

        {/* Noun line + rule */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <span style={{ fontFamily: F, fontSize: 13, fontStyle: "italic", color: G, whiteSpace: "nowrap" }}>noun &middot; proper</span>
          <div style={{ flex: 1, height: 1, background: G, opacity: 0.35 }} />
        </div>

        {/* Etymology */}
        <div style={{ fontFamily: F, fontSize: 14, fontStyle: "italic", color: G, lineHeight: 1.8, marginBottom: 32 }}>
          [ son &middot; from Japanese 尊 (son), meaning reverence, esteem + kase &middot; derived from omakase おまかせ, &ldquo;I leave it to you&rdquo; ]
        </div>

        {/* Definition 1 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <span style={{ fontFamily: F, fontSize: 14, color: G, fontWeight: 400, flexShrink: 0, marginTop: 1 }}>1.</span>
          <p style={{ fontFamily: F, fontSize: 16, color: T, lineHeight: 1.85, margin: 0 }}>
            A private, chef-led dining experience in which the guest surrenders all culinary decisions to the chef, receiving each course as an act of{" "}
            <em style={{ color: G }}>studied trust</em>{" "}
            and mutual respect.
          </p>
        </div>

        {/* Definition 2 */}
        <div style={{ display: "flex", gap: 16, marginBottom: 36 }}>
          <span style={{ fontFamily: F, fontSize: 14, color: G, fontWeight: 400, flexShrink: 0, marginTop: 1 }}>2.</span>
          <p style={{ fontFamily: F, fontSize: 16, color: T, lineHeight: 1.85, margin: 0 }}>
            An intimate omakase offered within the sanctity of a private home; the transformation of one&rsquo;s own table into a{" "}
            <em style={{ color: G }}>singular, unrepeatable</em>{" "}
            occasion.
          </p>
        </div>


      </div>
      </Reveal>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
function SiteFooter() {
  return (
    <footer style={{ background: BG, backgroundImage: N(0.60, 0.025), position: "relative", overflow: "hidden" }}>
      <ChiyogamiPattern id="sk-shippo-footer" opacity={0.04} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 40px 36px", boxSizing: "border-box" }}>
          <div className="sk-footer-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, marginBottom: 48, flexWrap: "wrap" }}>
            <a href="/" style={{ textDecoration: "none" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="160" height="45" role="img" aria-label="Sonakase Private Dining">
                <defs><style>{"@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400&family=Cormorant+Garamond:wght@300&display=swap');"}</style></defs>
                <g transform="translate(18, 10) scale(0.9)">
                  <line x1="35" y1="12" x2="42" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                  <line x1="55" y1="12" x2="48" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                  <circle cx="45" cy="19" r="3" fill="#b8892a"/>
                  <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke="#b8892a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke="#b8892a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"/>
                  <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke="#b8892a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.22"/>
                </g>
                <line x1="118" y1="28" x2="118" y2="112" stroke="#b8892a" strokeWidth="0.7" opacity="0.6"/>
                <text x="138" y="88" fontFamily="'Shippori Mincho', 'Times New Roman', serif" fontWeight="400" fontSize="52" letterSpacing="11" fill="#e6dac8">sonakase</text>
              </svg>
            </a>
            <a href="/book" className="sk-btn-fill" style={{ fontSize: 11 }}>
              Reserve Your Experience →
            </a>
          </div>
          <div style={{ borderTop: `1px solid rgba(232,201,126,0.12)`, paddingTop: 24 }}>
            <p style={{ fontFamily: "Georgia, serif", fontSize: 11, color: `rgba(245,240,232,0.3)`, letterSpacing: "0.05em" }}>
              © 2026 Sonakase™ · All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
