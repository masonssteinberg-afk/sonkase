"use client";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
const ScrollRoll  = dynamic(() => import("./components/ScrollRoll"),  { ssr: false });
const SignupModal = dynamic(() => import("./components/SignupModal"), { ssr: false });
const GlassMotion = dynamic(() => import("./components/GlassMotion"), { ssr: false });

// Static imports so next/image knows dimensions (no layout shift) and
// can generate blur placeholders at build time.
import imgHeroWide        from "@/public/images/hero-wide.jpg";
import imgHeroMobile      from "@/public/images/hero-mobile.jpg";
import imgHowCutout       from "@/public/images/how-it-works-cutout.png";
import imgTileEvent       from "@/public/images/tile-event.jpg";
import imgTileTray        from "@/public/images/tile-tray.jpg";
import imgSourcing        from "@/public/images/sourcing.jpg";
import imgTileNigiri      from "@/public/images/tile-nigiri.jpg";
import imgTileLineup      from "@/public/images/tile-lineup.jpg";
import imgTilePlate       from "@/public/images/tile-plate.jpg";
import imgTileSpread      from "@/public/images/tile-spread.jpg";
import imgTileBoardDetail from "@/public/images/tile-board-detail.jpg";
import imgBandLong        from "@/public/images/band-long.jpg";
import imgStandards       from "@/public/images/standards.jpg";
import imgCardFullspread  from "@/public/images/card-fullspread.jpg";
import imgCardCountertop  from "@/public/images/card-countertop.jpg";
import imgChefPortrait    from "@/public/chef-portrait.jpg";

// ── Design Tokens — theme-driven (see globals.css :root / [data-theme]) ──
const BG    = "var(--bg)";
const BG2   = "var(--bg2)";
const GOLD  = "var(--gold)";
const CREAM = "var(--text)";
const FONT_UI = "'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";
// iOS-style spring for transforms; standard ease-out for everything else
const SPRING = "cubic-bezier(0.34, 1.3, 0.64, 1)";

// ── Tiers — all pricing comes from lib/pricing, no literals here ──
import { TIERS, tierTotalRange, quoteForGuests, formatUSD, FROM_PRICE, MIN_GUESTS, MAX_GUESTS } from "@/lib/pricing";

// Fixed blurred-photo background per tier card. Assigned as a constant
// (never Math.random during render) so server and client first paint agree.
const CARD_IMG = {
  kitchentable: imgTileNigiri,      // intimate nigiri close-up
  countertop:   imgCardCountertop,  // tuna rolls, cucumber ribbons
  longtable:    imgBandLong,        // rows of cut rolls
  fullspread:   imgCardFullspread,  // full event catering spread
};

// Banner crop anchor per card (the countertop shot has the sushi low in frame)
const CARD_POS = {
  kitchentable: "center",
  countertop:   "center 74%",
  longtable:    "center",
  fullspread:   "center",
};

const N = (f, o) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;

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

   Previous package/roll/platter data (OMAKASE_PACKAGES, ROLLS, per-guest
   packages A/B/C, drop-off platters) was removed in the 2026 pricing
   overhaul — see git history if needed. All current pricing lives in
   lib/pricing.ts.
   ====================================================================== */

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/profile" + window.location.hash;
    }
  }, []);

  // Photo-first flow: content and photography alternate all the way down.
  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "'Shippori Mincho', Georgia, serif", overflowX: "hidden" }}>
      <PageStyles />
      <ScrollRoll />
      <Nav />
      <Hero onLetsRoll={() => router.push("/book")} />
      <ExperiencesSection />
      <PhotoSection />
      <AboutChefSection />
      <ContactSection />
      <SiteFooter />
      <SignupModal />
      <GlassMotion />
    </div>
  );
}


// ── Page Styles ───────────────────────────────────────────────
function PageStyles() {
  return (
    <style>{`
      :root { --header-h: 118px; }
      @media (max-width: 768px)  { :root { --header-h: 78px; } .sk-scroll-roll { display: none !important; } }
      @media (max-width: 1100px) { .sk-scroll-roll { transform: translateY(-50%) scale(0.65) !important; left: 2px !important; transform-origin: left center; } }

      .sk-hero { padding: calc(140px + var(--banner-h, 0px)) 40px 100px; }

      .sk-nav-link {
        font-family: ${FONT_UI};
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 0.01em;
        color: #e6dac8;
        text-decoration: none;
        transition: color 0.2s, background 0.2s, transform 0.2s ${SPRING};
        padding: 0 18px;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        position: relative;
        border-radius: 999px;
      }
      .sk-nav-link:hover {
        color: #fff;
        background: rgba(255,255,255,0.10);
      }
      .sk-nav-link:active { transform: scale(0.96); }

      .sk-arrow {
        display: inline-block;
        transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
      }

      .sk-btn-fill {
        background: linear-gradient(180deg, #F0D796 0%, ${GOLD} 100%);
        color: ${BG};
        border: none;
        border-radius: 999px;
        font-family: ${FONT_UI};
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: none;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 52px;
        padding: 0 32px;
        position: relative;
        overflow: hidden;
        box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 6px 20px rgba(var(--gold-rgb),0.12);
        transition: transform 0.3s ${SPRING}, box-shadow 0.3s ${SPRING};
      }
      .sk-btn-fill::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 50%, transparent 65%);
        transform: translateX(-120%);
        transition: transform 0.6s ease;
        pointer-events: none;
      }
      .sk-btn-fill:hover {
        transform: translateY(-2px) scale(1.015);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3), 0 10px 32px rgba(var(--gold-rgb),0.3);
      }
      .sk-btn-fill:hover::after { transform: translateX(120%); }
      .sk-btn-fill:hover .sk-arrow { transform: translateX(4px); }
      .sk-btn-fill:active {
        transform: scale(0.97);
        box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 3px 12px rgba(var(--gold-rgb),0.15);
      }

      .sk-btn-ghost {
        background: rgba(var(--gold-rgb),0.06);
        color: ${GOLD};
        border: 1px solid rgba(var(--gold-rgb),0.35);
        border-radius: 999px;
        font-family: ${FONT_UI};
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: none;
        cursor: pointer;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        min-height: 52px;
        padding: 0 32px;
        position: relative;
        overflow: hidden;
        z-index: 0;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: color 0.3s, transform 0.3s ${SPRING}, box-shadow 0.3s ${SPRING};
      }
      .sk-btn-ghost::before {
        content: "";
        position: absolute;
        inset: 0;
        background: ${GOLD};
        transform: scaleY(0);
        transform-origin: bottom center;
        transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
        z-index: -1;
      }
      .sk-btn-ghost:hover {
        color: ${BG};
        transform: translateY(-2px) scale(1.015);
        box-shadow: 0 8px 28px rgba(var(--gold-rgb),0.18);
      }
      .sk-btn-ghost:hover::before { transform: scaleY(1); }
      .sk-btn-ghost:hover .sk-arrow { transform: translateX(4px); }
      .sk-btn-ghost:active { transform: scale(0.97); }

      .sk-btn-fill:focus-visible,
      .sk-btn-ghost:focus-visible,
      .sk-reserve-link:focus-visible,
      .sk-nav-link:focus-visible {
        outline: 2px solid ${GOLD};
        outline-offset: 3px;
      }

      .sk-contact-field {
        background: rgba(var(--text-rgb),0.045);
        border: 1px solid rgba(var(--gold-rgb),0.16);
        border-radius: 14px;
        color: ${CREAM};
        font-family: ${FONT_UI};
        font-size: 16px;
        width: 100%;
        padding: 15px 18px;
        outline: none;
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      }
      .sk-contact-field::placeholder { color: rgba(var(--text-rgb),0.35); }
      .sk-contact-field:focus {
        border-color: rgba(var(--gold-rgb),0.6);
        background: rgba(var(--text-rgb),0.06);
        box-shadow: 0 0 0 3px rgba(var(--gold-rgb),0.12);
      }

      /* Four tier cards: 4-across on wide desktop, 2×2 on tablet, 1 on mobile */
      .sk-pkg-grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(4, 1fr);
      }
      @media (max-width: 1120px) { .sk-pkg-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 600px)  { .sk-pkg-grid { grid-template-columns: 1fr; } }

      /* Quote finder */
      .sk-quote-input {
        width: 84px;
        text-align: center;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 12px;
        color: #F5F0E8;
        font-family: 'Shippori Mincho', Georgia, serif;
        font-size: 26px;
        padding: 8px 6px;
        outline: none;
        -moz-appearance: textfield;
      }
      .sk-quote-input::-webkit-outer-spin-button,
      .sk-quote-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      .sk-quote-input:focus { border-color: rgba(232,201,126,0.6); box-shadow: 0 0 0 3px rgba(232,201,126,0.12); }
      .sk-stepper {
        width: 44px; height: 44px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.08);
        color: #F5F0E8;
        font-size: 22px; line-height: 1;
        cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s, transform 0.15s ${SPRING};
      }
      .sk-stepper:hover:not(:disabled) { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.35); }
      .sk-stepper:active:not(:disabled) { transform: scale(0.94); }
      .sk-stepper:disabled { opacity: 0.35; cursor: not-allowed; }
      @media (max-width: 560px) {
        .sk-quote-inner { flex-direction: column; align-items: flex-start !important; gap: 20px !important; }
        .sk-quote-inner > div:last-child { text-align: left !important; }
        .sk-quote-foot { flex-direction: column; align-items: flex-start !important; }
        .sk-quote-foot .glass-btn { width: 100%; }
      }

      /* Tier card = clean sushi photo banner on top, readable dark text panel
         below. Motion (parallax/tilt/entry) via CSS vars from one rAF loop. */
      .sk-pkg-card {
        position: relative;
        overflow: hidden;
        border-radius: 22px;
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
        background: linear-gradient(180deg, #1a1712 0%, #131009 100%);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: 0 16px 40px rgba(0,0,0,0.45);
        transform: perspective(1200px)
                   translate3d(0, var(--lift, 0px), 0)
                   rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
        transform-style: preserve-3d;
        transition: box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .sk-pkg-card:hover { box-shadow: 0 24px 56px rgba(0,0,0,0.55); border-color: rgba(255,255,255,0.20); }
      .sk-pkg-card__photo {
        position: relative;
        height: 190px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .sk-pkg-card__photo img {
        object-fit: cover;
        transform: translate3d(0, var(--imgY, 0%), 0) scale(1.2);
        filter: saturate(1.15) contrast(1.04);   /* sharp, natural — the sushi is the visual */
      }
      .sk-pkg-card__photo::after {   /* blend the photo into the panel below */
        content: "";
        position: absolute; inset: 0;
        background: linear-gradient(180deg, transparent 58%, rgba(19,16,9,0.9) 100%);
        pointer-events: none;
      }
      .sk-pkg-card__body {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 26px 28px 28px;
        box-sizing: border-box;
        position: relative;
        z-index: 1;
      }

      @media (prefers-reduced-motion: no-preference) {
        .sk-pkg-card.pre-enter { opacity: 0; }
        .sk-pkg-card.is-in {
          animation: skCardIn 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: calc(var(--i, 0) * 80ms);
        }
        .sk-pkg-card.entered { opacity: 1; }
      }
      @keyframes skCardIn {
        from { opacity: 0; transform: perspective(1200px) translate3d(0, 24px, 0) scale(0.985); }
        to   { opacity: 1; transform: perspective(1200px) translate3d(0, 0, 0) scale(1); }
      }
      @media (max-width: 768px) {
        .sk-pkg-card__photo { height: 200px; }
      }

      .sk-reserve-link {
        font-family: ${FONT_UI};
        font-size: 13px;
        font-weight: 600;
        color: ${GOLD};
        letter-spacing: 0.03em;
        text-decoration: none;
        text-transform: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 24px;
        border-radius: 999px;
        border: 1px solid rgba(var(--gold-rgb),0.25);
        background: rgba(var(--gold-rgb),0.05);
        align-self: flex-start;
        transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.25s ${SPRING};
      }
      .sk-reserve-link:hover {
        color: #fff8ec;
        background: rgba(var(--gold-rgb),0.12);
        border-color: rgba(var(--gold-rgb),0.5);
      }
      .sk-reserve-link:hover .sk-arrow { transform: translateX(5px); }
      .sk-reserve-link:active { transform: scale(0.96); }

      .sk-reserve-link {
        font-family: ${FONT_UI};
        font-size: 13px;
        font-weight: 600;
        color: ${GOLD};
        letter-spacing: 0.03em;
        text-decoration: none;
        text-transform: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 44px;
        padding: 0 24px;
        border-radius: 999px;
        border: 1px solid rgba(var(--gold-rgb),0.25);
        background: rgba(var(--gold-rgb),0.05);
        align-self: flex-start;
        transition: color 0.2s, background 0.2s, border-color 0.2s, transform 0.25s ${SPRING};
      }
      .sk-reserve-link:hover {
        color: #fff8ec;
        background: rgba(var(--gold-rgb),0.12);
        border-color: rgba(var(--gold-rgb),0.5);
      }
      .sk-reserve-link:hover .sk-arrow { transform: translateX(5px); }
      .sk-reserve-link:active { transform: scale(0.96); }

      @media (prefers-reduced-motion: reduce) {
        .sk-btn-fill, .sk-btn-ghost, .sk-pkg-card,
        .sk-arrow, .sk-nav-link::after, .sk-btn-ghost::before, .sk-btn-fill::after {
          transition: none !important;
        }
        .sk-btn-fill::after { display: none; }
        .sk-btn-fill:hover, .sk-btn-ghost:hover, .sk-pkg-card:hover {
          transform: none;
        }
      }

      .sk-about-grid {
        display: grid;
        grid-template-columns: 380px 1fr;
        gap: 80px;
        align-items: start;
      }

      .sk-how-grid {
        display: grid;
        grid-template-columns: 1fr 420px;
        gap: 64px;
        align-items: center;
      }
      .sk-how-photo { width: 100%; }
      .sk-sourcing-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 64px;
        align-items: center;
      }
      .sk-sourcing-photo {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
      }
      .sk-gallery {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 2px;
      }
      .sk-gallery-tile {
        position: relative;
        aspect-ratio: 1 / 1;
      }
      .sk-hero-photo-m { display: none; }
      @media (max-width: 700px) {
        .sk-hero-photo-d { display: none; }
        .sk-hero-photo-m { display: block; }
      }

      @media (max-width: 768px) {
        .sk-nav-links { display: none !important; }
        .sk-how-grid  { grid-template-columns: 1fr !important; }
        .sk-hero-logo { width: 220px !important; }
        .sk-section   { padding: 60px 20px !important; }
        .sk-hero      { padding: calc(110px + var(--banner-h, 0px)) 20px 60px !important; }
        .sk-footer-inner { flex-direction: column !important; gap: 32px !important; align-items: flex-start !important; }
        .sk-nav-inner { height: 78px !important; padding: 0 18px !important; }
        .sk-nav-logo  { width: 150px !important; height: 44px !important; }
        .sk-nav-cta   { min-height: 42px !important; padding: 0 22px !important; }
        .sk-pkg-card__body { padding: 28px 20px 24px !important; }
        .sk-about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        .sk-sourcing-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        .sk-gallery { grid-template-columns: repeat(2, 1fr) !important; }
      }
    `}</style>
  );
}

// ── Nav ───────────────────────────────────────────────────────
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      // Fixed-light: header specular drifts as the page scrolls (low intensity)
      if (!reduce && navRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, y / max) : 0;
        navRef.current.style.setProperty("--hspec", (10 + p * 80).toFixed(1) + "%");
      }
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav ref={navRef} className={`sk-glass-nav${scrolled ? " is-scrolled" : ""}`} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? "var(--header-bg)" : "transparent",
      backdropFilter: scrolled ? "blur(22px) saturate(200%) brightness(1.15)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(22px) saturate(200%) brightness(1.15)" : "none",
      borderBottom: `1px solid ${scrolled ? "var(--header-border)" : "transparent"}`,
      transition: "border-color 0.3s, background 0.3s, backdrop-filter 0.3s",
    }}>
      <div className="sk-nav-inner" style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "0 44px", height: scrolled ? 90 : 118,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxSizing: "border-box",
        transition: "height 0.35s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <svg className="sk-nav-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="360" height="100" role="img" aria-label="Sonakase Private Dining">
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

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div className="sk-nav-links" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <a href="#about"   className="sk-nav-link">about</a>
            <a href="#contact" className="sk-nav-link">contact</a>
            <a href="/lookup"  className="sk-nav-link">find a booking</a>
          </div>
          <a href="/book" className="glass-btn sk-nav-cta" style={{ minHeight: 46, padding: "0 30px", fontSize: 13 }}>
            Reserve
          </a>
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
function Hero({ onLetsRoll }) {
  return (
    <section style={{
      background: BG, minHeight: "100vh",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "flex-end",
      textAlign: "center", position: "relative",
    }}
      className="sk-hero on-dark"
      id="top"
    >
      {/* Hero photo — wide crop above 700px, tall crop below */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }} aria-hidden="false">
        <div className="sk-hero-photo-d" style={{ position: "absolute", inset: 0 }}>
          <Image
            src={imgHeroWide}
            alt="Sushi spread laid out along a kitchen counter at a private event in Gainesville."
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        <div className="sk-hero-photo-m" style={{ position: "absolute", inset: 0 }}>
          <Image
            src={imgHeroMobile}
            alt="Sushi spread laid out along a kitchen counter at a private event in Gainesville."
            fill
            priority
            placeholder="blur"
            sizes="100vw"
            style={{ objectFit: "cover" }}
          />
        </div>
        {/* Readability gradient — the sushi carries the middle; text zones darken */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(13,13,13,0.68) 0%, rgba(13,13,13,0.14) 34%, rgba(13,13,13,0.22) 60%, rgba(13,13,13,0.9) 100%)",
        }} />
      </div>

      {/* Gold horizontal accent lines */}
      <div style={{
        position: "absolute",
        top: "calc(var(--header-h, 100px) + var(--banner-h, 0px) + 18px)",
        left: 0, right: 0, height: 1,
        background: "rgba(var(--gold-rgb),0.30)",
        zIndex: 2, pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 24,
        left: 0, right: 0, height: 1,
        background: "rgba(var(--gold-rgb),0.30)",
        zIndex: 2, pointerEvents: "none",
      }} />

      {/* Content sits low so the sushi owns the frame */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "auto" }}>

        {/* Gold line */}
        <div style={{ width: 120, height: 1, background: GOLD, opacity: 0.6, margin: "0 auto 32px" }} />

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Shippori Mincho', Georgia, serif", fontWeight: 400,
          fontSize: "clamp(28px, 5vw, 52px)",
          color: CREAM, letterSpacing: "0.04em",
          margin: "0 0 20px", lineHeight: 1.1,
        }}>
          the sonakase experience
        </h1>

        {/* Tagline */}
        <div style={{
          fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: "clamp(14px, 2vw, 18px)",
          color: GOLD, letterSpacing: "0.15em", fontStyle: "italic",
          marginBottom: 12,
        }}>
          American Omakase Where You Are
        </div>

        {/* From-price — derived from the lowest tier minimum */}
        <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, color: "rgba(245,240,232,0.7)", letterSpacing: "0.06em", marginBottom: 36 }}>
          Private sushi catering from {formatUSD(FROM_PRICE)}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, width: "100%", maxWidth: 340 }}>
          <button
            onClick={onLetsRoll}
            className="glass-btn on-photo"
            style={{ width: "100%" }}
          >
            Let's Roll <span className="sk-arrow">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// ── Count-up hook — eases a number to its target over ~300ms ──
function useCountUp(target) {
  const [val, setVal] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVal(target); fromRef.current = target; return;
    }
    const from = fromRef.current, to = target, dur = 300, t0 = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

// ── Quote finder — enter a guest count, see tier/total/deposit live ──
function QuoteFinder() {
  const [guests, setGuests] = useState(8);
  const quote = quoteForGuests(guests);          // always valid: input is clamped to [MIN,MAX]
  const animatedTotal = useCountUp(quote ? quote.total : 0);

  const setClamped = (n) => {
    if (Number.isNaN(n)) return;
    setGuests(Math.max(MIN_GUESTS, Math.min(MAX_GUESTS, Math.floor(n))));
  };

  return (
    <div className="glass-panel on-dark sk-quote" style={{ maxWidth: 620, margin: "0 auto 40px", padding: "28px 32px" }}>
      <div className="sk-quote-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 28, flexWrap: "wrap" }}>

        {/* Guest count with steppers */}
        <div>
          <label htmlFor="sk-guest-input" style={{ display: "block", fontFamily: FONT_UI, fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(var(--gold-rgb),0.9)", marginBottom: 12 }}>
            How many guests?
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" aria-label="Fewer guests" onClick={() => setClamped(guests - 1)} disabled={guests <= MIN_GUESTS} className="sk-stepper">−</button>
            <input
              id="sk-guest-input"
              type="number" inputMode="numeric" min={MIN_GUESTS} max={MAX_GUESTS}
              value={guests}
              onChange={(e) => setClamped(parseInt(e.target.value, 10))}
              className="sk-quote-input"
            />
            <button type="button" aria-label="More guests" onClick={() => setClamped(guests + 1)} disabled={guests >= MAX_GUESTS} className="sk-stepper">+</button>
          </div>
        </div>

        {/* Live tier / total / deposit */}
        <div style={{ textAlign: "right", minWidth: 200 }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(var(--gold-rgb),0.9)", marginBottom: 6 }}>
            {quote.tier.name}
          </div>
          <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 40, color: CREAM, fontWeight: 400, lineHeight: 1 }}>
            {formatUSD(animatedTotal)}
          </div>
          <div style={{ fontFamily: FONT_UI, fontSize: 12, color: "rgba(var(--text-rgb),0.6)", marginTop: 6 }}>
            {formatUSD(quote.deposit)} deposit
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "22px 0 18px" }} />

      <div className="sk-quote-foot" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 14, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.5 }}>
          Reserve with a {formatUSD(quote.deposit)} deposit. The balance is charged 48 hours before your event.
        </div>
        <a href={`/book?guests=${guests}`} className="glass-btn" style={{ minHeight: 46, padding: "0 28px", whiteSpace: "nowrap" }}>
          Reserve <span className="sk-arrow">→</span>
        </a>
      </div>
    </div>
  );
}

// ── Experiences Section ───────────────────────────────────────
function ExperiencesSection() {
  return (
    <section id="experiences" style={{ background: BG2, backgroundImage: N(0.55, 0.04) }}>
      <div style={{ height: 1, background: GOLD, opacity: 0.2 }} />
      <div className="sk-section" style={{ padding: "100px 40px", maxWidth: 1200, margin: "0 auto", boxSizing: "border-box" }}>
        <Reveal>
          {/* Headline */}
          <h2 style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: "clamp(32px, 5vw, 68px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 48, lineHeight: 1.1 }}>
            authentic american omakase.
          </h2>

          {/* Body + how-it-works photo */}
          <div className="sk-how-grid" style={{ maxWidth: 960, margin: "0 auto 80px" }}>
            <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: `rgba(var(--text-rgb),0.6)`, margin: 0, lineHeight: 1.8 }}>
              A live countertop build in your home. Sushi made in front of your guests and laid out over banana leaves in waves — two hours of dinner service, start to finish.
            </p>
            <div className="sk-how-photo">
              <Image
                src={imgHowCutout}
                alt="A full platter of specialty sushi rolls prepared for a private event."
                placeholder="blur"
                decoding="async"
                sizes="(max-width: 768px) 90vw, 420px"
                style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.55))" }}
              />
            </div>
          </div>
        </Reveal>

        {/* Quote finder — the friendly front door to pricing */}
        <Reveal>
          <QuoteFinder />
        </Reveal>

        {/* Tier cards */}
        <div className="sk-pkg-grid" style={{ marginBottom: 20 }}>
          {TIERS.map((t, idx) => (
              <div className="sk-pkg-card" key={t.id} style={{ "--i": idx }}>
              {/* Sushi photo banner */}
              <div className="sk-pkg-card__photo" aria-hidden="true">
                <Image src={CARD_IMG[t.id]} alt="" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 400px" style={{ objectPosition: CARD_POS[t.id] }} />
              </div>

              {/* Readable dark text panel */}
              <div className="sk-pkg-card__body on-dark">
              {/* Name */}
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 21, color: CREAM, letterSpacing: "0.08em", marginBottom: 8 }}>
                {t.name.toLowerCase()}
              </div>

              {/* Guest range */}
              <div style={{ fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, color: GOLD, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>
                {t.minGuests}–{t.maxGuests} guests
              </div>

              {/* Starting-at price + per-guest rate */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "rgba(var(--text-rgb),0.8)", fontStyle: "italic", marginBottom: 6 }}>
                  starting at
                </div>
                <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 32, color: CREAM, fontWeight: 400, lineHeight: 1 }}>
                  {formatUSD(tierTotalRange(t).low)}
                </div>
                <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, color: "rgba(var(--gold-rgb),0.9)", letterSpacing: "0.06em", marginTop: 8 }}>
                  {formatUSD(t.perGuest)} per guest
                </div>
              </div>

              {/* Deposit line */}
              <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, color: "rgba(var(--text-rgb),0.6)", marginBottom: 18 }}>
                {formatUSD(t.deposit)} deposit to reserve
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "rgba(255,255,255,0.16)", marginBottom: 18 }} />

              {/* Description */}
              <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 14, color: "rgba(var(--text-rgb),0.85)", lineHeight: 1.7, margin: "0 0 24px" }}>
                {t.tagline}
              </p>
              <div style={{ flex: 1 }} />

              {/* CTA */}
              <a href={`/book?guests=${t.minGuests}`} className="glass-btn" style={{ alignSelf: "flex-start", padding: "0 26px", minHeight: 46 }}>
                Reserve <span className="sk-arrow">→</span>
              </a>
              </div>
              </div>
          ))}
        </div>

        {/* One clarifying line about minimums */}
        <Reveal delay={0.1}>
          <p style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 500, color: "rgba(var(--text-rgb),0.55)", letterSpacing: "0.02em", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            Every event has a minimum, so smaller groups pay a set price rather than a per-guest rate.
          </p>
        </Reveal>

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
              <Image
                src={imgChefPortrait}
                alt="Mason Steinberg, Founder & Executive Chef"
                placeholder="blur"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 380px"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>

            {/* Right — Text content */}
            <div>
              {/* Eyebrow */}
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 20 }}>
                Meet Your Chef
              </div>

              {/* Name */}
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 36, color: CREAM, fontWeight: 400, marginBottom: 10 }}>
                Mason Steinberg
              </div>

              {/* Title */}
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 32 }}>
                Founder &amp; Executive Chef
              </div>

              {/* Top divider */}
              <div style={{ width: 60, height: 1, background: GOLD, opacity: 0.4, marginBottom: 32 }} />

              {/* Bio */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 0 }}>
                <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.8, margin: 0 }}>
                  Mason grew up sitting at the sushi bar as a kid, watching the chef work. He started practicing at home, rolling on his own with grocery store fish and YouTube. By 15 he had his first kitchen job as a dishwasher.
                </p>
                <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.8, margin: 0 }}>
                  The week he turned 16 and got his license, he drove back to the place he grew up sitting in front of the bar — now working behind it. Over the next few years he worked his way through some of Gainesville&rsquo;s most notable sushi spots, moving from prep to rolling, learning the craft the right way across multiple kitchens.
                </p>
                <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.8, margin: 0 }}>
                  Along the way he started doing sushi nights for his family. Rolling for the people he grew up with, at home, around the table. It was always his favorite part. At 20 he decided other people deserved that too. That is Sonakase&trade;.
                </p>
              </div>

            </div>

          </div>
        </Reveal>

        {/* Sourcing — text left, photo right (opposite side from the portrait) */}
        <Reveal delay={0.08}>
          <div className="sk-sourcing-grid" style={{ marginTop: 80 }}>
            <div>
              <div style={{ width: 60, height: 1, background: GOLD, opacity: 0.2, marginBottom: 32 }} />
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 20, color: CREAM, marginBottom: 16 }}>
                The Sourcing
              </div>
              <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 15, color: "rgba(var(--text-rgb),0.75)", lineHeight: 1.8, margin: "0 0 16px" }}>
                Every protein is sourced fresh from trusted local and regional seafood markets. Rice is seasoned the day of your event. Nothing is prepared days in advance.
              </p>
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "rgba(var(--gold-rgb),0.70)", fontStyle: "italic" }}>
                ServSafe Food Manager Certified
              </div>
            </div>
            <div className="sk-sourcing-photo">
              <Image
                src={imgStandards}
                alt="Fresh salmon sashimi cut and plated on a wooden board."
                fill
                placeholder="blur"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 380px"
                style={{ objectFit: "cover", borderRadius: 20 }}
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ── Contact Section ───────────────────────────────────────────
function ContactSection() {
  const [name, setName]             = useState("");
  const [email, setEmail]           = useState("");
  const [subject, setSubject]       = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [message, setMessage]       = useState("");
  const [status, setStatus]         = useState("idle"); // idle | sending | success | error

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
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), guestCount: guestCount.trim(), message: message.trim() }),
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
          <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 10, color: "var(--eyebrow)", letterSpacing: "0.5em", textTransform: "uppercase", textAlign: "center", marginBottom: 32 }}>
            get in touch
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: "clamp(28px, 4vw, 56px)", color: CREAM, textAlign: "center", fontWeight: 400, marginBottom: 56, lineHeight: 1.2 }}>
            have a question?
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "40px 0", fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 18, color: GOLD, fontStyle: "italic", lineHeight: 1.6 }}>
            Thank you. You&rsquo;ll hear back shortly.
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
              <input
                type="number"
                min="1"
                inputMode="numeric"
                className="sk-contact-field"
                placeholder="Guest count (if inquiring about an event)"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
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
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "#c5552d", fontStyle: "italic" }}>
                Something went wrong. Please try again.
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="glass-btn"
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

// ── Gallery ───────────────────────────────────────────────────
const GALLERY = [
  { src: imgTileNigiri,      alt: "Hand-cut salmon and tuna nigiri from a private sushi catering event in Gainesville." },
  { src: imgTileLineup,      alt: "A lineup of freshly cut sushi rolls plated for a dinner party." },
  { src: imgTileEvent,       alt: "Large sushi catering display for an event in Gainesville, Florida." },
  { src: imgTileTray,        alt: "A tray of freshly rolled sushi ready for service." },
  { src: imgTilePlate,       alt: "A plated selection of nigiri and sushi rolls." },
  { src: imgSourcing,        alt: "Fresh ingredients prepped for a private sushi event." },
  { src: imgTileSpread,      alt: "A full sushi spread across the kitchen counter at an in-home event." },
  { src: imgTileBoardDetail, alt: "Close-up detail of sushi rolls on a wooden serving board." },
];

function PhotoSection() {
  return (
    <section style={{ background: BG }}>
      <div className="sk-gallery">
        {GALLERY.map((g) => (
          <div key={g.alt} className="sk-gallery-tile">
            <Image
              src={g.src}
              alt={g.alt}
              fill
              placeholder="blur"
              decoding="async"
              sizes="(max-width: 768px) 50vw, 25vw"
              style={{ objectFit: "cover" }}
            />
          </div>
        ))}
      </div>
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
              <svg className="sk-footer-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 140" width="160" height="45" role="img" aria-label="Sonakase Private Dining">
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
            <a href="/book" className="glass-btn" style={{ fontSize: 12 }}>
              Reserve Your Experience <span className="sk-arrow">→</span>
            </a>
          </div>
          <div style={{ borderTop: `1px solid rgba(var(--gold-rgb),0.12)`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 11, color: `rgba(var(--text-rgb),0.3)`, letterSpacing: "0.05em", margin: 0 }}>
              © 2026 Sonakase™ · All rights reserved.
            </p>
            <a href="/lookup" style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 11, color: "rgba(var(--gold-rgb),0.55)", letterSpacing: "0.05em", textDecoration: "none" }}>
              find your booking →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
