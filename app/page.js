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
import u1 from "@/public/images/hero/u1.jpg";
import u2 from "@/public/images/hero/u2.jpg";
import u3 from "@/public/images/hero/u3.jpg";
import u4 from "@/public/images/hero/u4.jpg";
import u5 from "@/public/images/hero/u5.jpg";
import u6 from "@/public/images/hero/u6.jpg";
import u7 from "@/public/images/hero/u7.jpg";
import u8 from "@/public/images/hero/u8.jpg";
import u9 from "@/public/images/hero/u9.jpg";
import gNew1 from "@/public/images/hero/g1.jpg";
import gNew3 from "@/public/images/hero/g3.jpg";
import gNew4 from "@/public/images/hero/g4.jpg";
import gNew5 from "@/public/images/hero/g5.jpg";
import gNew6 from "@/public/images/hero/g6.jpg";
import imgHowCutout       from "@/public/images/how-it-works.jpg";
import imgTileEvent       from "@/public/images/tile-event.jpg";
import imgTileTray        from "@/public/images/tile-tray.jpg";
import imgSourcing        from "@/public/images/sourcing.jpg";
import imgTileNigiri      from "@/public/images/tile-nigiri.jpg";
import imgTileLineup      from "@/public/images/tile-lineup.jpg";
import imgTilePlate       from "@/public/images/tile-plate.jpg";
import imgTileSpread      from "@/public/images/tile-spread.jpg";
import imgTileBoardDetail from "@/public/images/tile-board-detail.jpg";
import imgStandards       from "@/public/images/standards.jpg";
import imgCardFullBoard   from "@/public/images/card-full-board.jpg";   // tile-event, rotated to landscape
import imgCardShortBoard  from "@/public/images/card-short-board.jpg";  // tile-lineup, rotated to landscape
import imgChefPortrait    from "@/public/chef-portrait.jpg";

// ── Design Tokens — theme-driven (see globals.css :root / [data-theme]) ──
const BG    = "var(--bg)";
const BG2   = "var(--bg2)";
const GOLD  = "var(--gold)";
const CREAM = "var(--text)";
const FONT_UI = "'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif";
// iOS-style spring for transforms; standard ease-out for everything else
const SPRING = "cubic-bezier(0.34, 1.3, 0.64, 1)";

// ── Hero slideshow — 10 curated frames, desktop (wide) + mobile (tall) crops ──
// Pre-framed portrait heroes; torch shot (u3) leads. Shown uncropped (contain).
const HERO = [u3, u1, u2, u4, u5, u6, u7, u8, u9];
const HERO_N = HERO.length;
const HERO_PER = 3.5;           // seconds each frame holds

// ── Boards — all pricing comes from lib/pricing, no literals here ──
import { BOARDS, boardTotalRange, quotesForGuests, effectiveRates, formatUSD, FROM_PRICE, MIN_GUESTS, MAX_GUESTS, LAUNCH_ACTIVE, DEPOSIT, SECOND_CHEF_THRESHOLD, SECOND_CHEF_FEE } from "@/lib/pricing";

// Fixed blurred-photo background per board card. Assigned as a constant
// (never Math.random during render) so server and client first paint agree.
const CARD_IMG = {
  full:  imgCardFullBoard,   // abundant wooden board — rolls, nigiri, garnish
  short: imgCardShortBoard,  // clean rows of rolls on a wooden board
};

// Banner crop anchor per card
const CARD_POS = {
  full:  "center",
  short: "center",
};

// ── Sushi icons — roll variety shown as maki cross-sections ────
// Distinct fillings so a row of them reads as "different rolls," not a
// repeated stamp. Salmon, tuna, cucumber/avocado, tamago, eel, shrimp.
const ROLL_FILLS   = ["#E8794A", "#D64B3F", "#6FA84B", "#D2A23F", "#7E6BA8", "#E4A6B0"];
const NIGIRI_FILLS = ["#E8794A", "#D64B3F", "#D2A23F", "#E4A6B0"];

// Nigiri icons are colored by their fish so the row reads as real cuts.
const FISH_COLOR = {
  Salmon:        "#E8794A",
  Tuna:          "#C0392B",
  Yellowtail:    "#E8CE96",
  Eel:           "#6E4A2E",
  "Spicy tuna":  "#D6452F",
  Shrimp:        "#E4A6B0",
};
const fishColor = (name, i) => FISH_COLOR[name] ?? NIGIRI_FILLS[i % NIGIRI_FILLS.length];

// Small number words read more premium than digits at this scale.
const NUM_WORD = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
const wordFor  = (n) => NUM_WORD[n] ?? String(n);
const cap      = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Maki cross-section — nori rim, rice ring, filling, and a soft top-left
// sheen so a row of them reads as glossy cut rolls rather than flat dots.
function MakiIcon({ fill }) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11.2" fill="#0f1a0a" />
      <circle cx="12" cy="12" r="11.2" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="8.3"  fill="#EFE6D2" />
      <circle cx="12" cy="12" r="8.3"  fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.6" />
      <circle cx="12" cy="12" r="4.4"  fill={fill} />
      <ellipse cx="9.7" cy="9.4" rx="2.5" ry="1.5" fill="rgba(255,255,255,0.20)" transform="rotate(-35 9.7 9.4)" />
    </svg>
  );
}

// Nigiri — rice bed with a draped slice and a highlight sweep on the fish.
function NigiriIcon({ fill }) {
  return (
    <svg width="26" height="17" viewBox="0 0 34 22" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      <rect x="1.5" y="10" width="31" height="11" rx="5.5" fill="#EFE6D2" />
      <rect x="1.5" y="10" width="31" height="11" rx="5.5" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="0.6" />
      <path d="M4 11.6 C11 4.6, 23 4.6, 30 11.6 C30 13.9, 4 13.9, 4 11.6 Z" fill={fill} />
      <path d="M5.5 10.5 C12 6.2, 22 6.2, 28.5 10.5" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}

// One line of the board's menu spec: a gold small-cap label + serif value on
// the left, the icon cluster on the right, and optional fine print beneath.
function MenuSpecRow({ label, value, icons, fine }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: FONT_UI, fontSize: 9.5, fontWeight: 600, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(var(--gold-rgb),0.8)" }}>
            {label}
          </div>
          <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 15, color: CREAM, marginTop: 4, lineHeight: 1.25 }}>
            {value}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }}>
          {icons}
        </div>
      </div>
      {fine && (
        <div style={{ fontFamily: FONT_UI, fontSize: 10.5, fontWeight: 500, letterSpacing: "0.02em", color: "rgba(var(--text-rgb),0.5)", marginTop: 7, lineHeight: 1.5 }}>
          {fine}
        </div>
      )}
    </div>
  );
}

// The board's menu, as a refined two-row spec. Rolls are always the chef's
// selection; nigiri is either fixed (Short) or the guest's choice (Full).
// The icons preview the variety — the actual cuts are set to booking
// preferences and disclosed afterward, which the closing line makes clear.
function BoardMenuIcons({ board }) {
  const { nigiri } = board;
  const isChoice   = !!nigiri.options;
  const nigiriFish = nigiri.fixed ?? nigiri.options.slice(0, nigiri.count);
  const hair = { height: 1, background: "linear-gradient(90deg, rgba(232,201,126,0.28), rgba(232,201,126,0.04) 85%)", margin: "15px 0" };

  return (
    <div style={{ margin: "2px 0 22px" }} aria-label={board.menu}>
      <MenuSpecRow
        label="Rolls"
        value={`${cap(wordFor(board.rolls))} styles`}
        icons={Array.from({ length: board.rolls }).map((_, i) => (
          <MakiIcon key={i} fill={ROLL_FILLS[i % ROLL_FILLS.length]} />
        ))}
      />
      <div style={hair} />
      <MenuSpecRow
        label="Nigiri"
        value={isChoice ? `Your choice of ${wordFor(nigiri.count)}` : nigiri.fixed.join(" & ")}
        icons={nigiriFish.map((f, i) => <NigiriIcon key={i} fill={fishColor(f, i)} />)}
        fine={isChoice ? nigiri.options.join(" · ").toLowerCase() : "Set pairing"}
      />
      <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontStyle: "italic", fontSize: 12, color: "rgba(var(--text-rgb),0.5)", marginTop: 15, lineHeight: 1.55 }}>
        {isChoice ? "Rolls and nigiri are" : "Rolls are"} set to your booking preferences and shared with you after you book.
      </div>
    </div>
  );
}

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

// ── Philosophy band — flat dark ground under the header, above the hero ──
function PhilosophyBand() {
  const CJK = "'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', 'Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', serif";
  const SERIF = "'Shippori Mincho', Georgia, serif";
  const Term = ({ kanji, romaji, gloss }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontFamily: CJK, fontSize: "clamp(28px, 4.2vw, 38px)", lineHeight: 1.12, letterSpacing: "0.05em", color: "rgba(var(--text-rgb),0.9)" }}>{kanji}</div>
      <div style={{ fontFamily: SERIF, fontSize: "clamp(12px, 1.5vw, 13px)", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(var(--text-rgb),0.7)", marginTop: "0.75em" }}>{romaji}</div>
      <div style={{ fontFamily: FONT_UI, fontSize: "clamp(11px, 1.4vw, 12px)", letterSpacing: "0.02em", color: "rgba(var(--text-rgb),0.5)", marginTop: "0.5em" }}>{gloss}</div>
    </div>
  );
  // Connective operators — smallest, faintest, body font (not a display weight)
  const Op = ({ children }) => (
    <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: "clamp(10px, 1.2vw, 11px)", lineHeight: 1, color: "rgba(var(--text-rgb),0.4)" }}>{children}</div>
  );
  return (
    <section aria-label="Sonakase" style={{ background: BG, position: "relative", zIndex: 1 }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "calc(var(--header-h, 118px) + var(--banner-h, 0px) + 56px) 24px 56px", boxSizing: "border-box" }}>
        <div className="sk-philo-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "clamp(17px, 3.2vw, 26px)" }}>
          <Term kanji="供える" romaji="sonaeru" gloss="to prepare and offer" />
          <Op>+</Op>
          <Term kanji="まかせる" romaji="makaseru" gloss="to entrust" />
          <Op>=</Op>
          {/* Resolution — the only full-opacity element, given extra space above */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: "clamp(8px, 1.6vw, 15px)" }}>
            <svg viewBox="0 0 500 140" role="img" aria-label="Sonakase" style={{ width: "clamp(196px, 48vw, 250px)", height: "auto", display: "block" }}>
              <g transform="translate(18, 10) scale(0.9)">
                <line x1="35" y1="12" x2="42" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                <line x1="55" y1="12" x2="48" y2="108" stroke="#e6dac8" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="45" cy="19" r="3" fill="#b8892a"/>
                <path d="M8 48 C18 34, 30 30, 45 38 C60 46, 72 42, 82 30" stroke="#b8892a" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <path d="M8 58 C18 44, 30 40, 45 48 C60 56, 72 52, 82 40" stroke="#b8892a" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.5"/>
                <path d="M8 68 C18 54, 30 50, 45 58 C60 66, 72 62, 82 50" stroke="#b8892a" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.22"/>
              </g>
              <line x1="118" y1="28" x2="118" y2="112" stroke="#b8892a" strokeWidth="0.7" opacity="0.6"/>
              <text x="138" y="88" fontFamily="'Shippori Mincho', Georgia, serif" fontWeight="400" fontSize="52" letterSpacing="11" fill="#e6dac8">sonakase</text>
            </svg>
            <div style={{ fontFamily: FONT_UI, fontSize: "clamp(11px, 1.4vw, 12px)", letterSpacing: "0.02em", color: "rgba(var(--text-rgb),0.5)", marginTop: "0.95em", lineHeight: 1.5 }}>prepared and offered, entrusted to the chef</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.includes("access_token")) {
      window.location.href = "/profile" + window.location.hash;
    }
  }, []);

  // Land on the hero photos; the philosophy band sits hidden above (scroll up to see it).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash) return;                    // respect deep-links / anchors
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    const toHero = () => {
      const hero = document.querySelector(".sk-hero");
      if (hero) window.scrollTo({ top: hero.getBoundingClientRect().top + window.scrollY, left: 0, behavior: "auto" });
    };
    toHero();
    requestAnimationFrame(toHero);                        // re-apply after first layout
  }, []);

  // Photo-first flow: content and photography alternate all the way down.
  return (
    <div style={{ background: BG, color: CREAM, fontFamily: "'Shippori Mincho', Georgia, serif", overflowX: "hidden" }}>
      <PageStyles />
      <ScrollRoll />
      <Nav />
      <PhilosophyBand />
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
        background: rgba(var(--text-rgb),0.05);
        border: 1px solid rgba(var(--gold-rgb),0.45);
        border-radius: 14px;
        color: ${CREAM};
        font-family: ${FONT_UI};
        font-size: 16px;
        width: 100%;
        padding: 15px 18px;
        outline: none;
        transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
      }
      .sk-contact-field::placeholder { color: var(--placeholder); }
      .sk-contact-field:focus {
        border-color: rgba(var(--gold-rgb),0.6);
        background: rgba(var(--text-rgb),0.06);
        box-shadow: 0 0 0 3px rgba(var(--gold-rgb),0.12);
      }

      /* Two board cards: side-by-side on desktop, stacked on mobile */
      .sk-pkg-grid {
        display: grid;
        gap: 20px;
        grid-template-columns: repeat(2, 1fr);
        max-width: 760px;
        margin-left: auto;
        margin-right: auto;
      }
      @media (max-width: 600px)  { .sk-pkg-grid { grid-template-columns: 1fr; } }

      /* Quote finder — drop the specular sweep (reads as a smudge over the
         flat section, unlike over a photo) and keep just the lit rim */
      .sk-quote::after { display: none; }
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

      /* ── Hero slideshow — crossfading Ken Burns through real event frames ── */
      .sk-hero-slides { position: absolute; inset: 0; }
      /* Mobile fills the screen (crops sides slightly); desktop shows the full portrait */
      .sk-hero-fit { object-fit: contain; object-position: center; }
      @media (max-width: 700px) { .sk-hero-fit { object-fit: cover; } }

      /* Subtle "scroll up" hint at the top of the hero */
      .sk-scroll-up { transform: translateX(-50%); opacity: 0.5; transition: opacity 0.3s ease; }
      .sk-scroll-up:hover { opacity: 0.9; }
      .sk-scroll-up-icon { animation: skUpBob 2.4s ease-in-out infinite; }
      @keyframes skUpBob { 0%, 100% { transform: translateY(2px); } 50% { transform: translateY(-4px); } }
      @media (prefers-reduced-motion: reduce) { .sk-scroll-up-icon { animation: none; } }

      /* Hero headline breaks to two lines on phones */
      @media (max-width: 640px) { .sk-hero-l1, .sk-hero-l2 { display: block; } }

      /* Philosophy band */
      .sk-philo-terms { display: flex; justify-content: center; align-items: flex-start; gap: clamp(48px, 9vw, 96px); }
      @media (max-width: 600px) { .sk-philo-terms { flex-direction: column; gap: 30px; align-items: center; } }
      .sk-philo-in { opacity: 0; transform: translateY(10px); animation: skPhiloIn 0.9s cubic-bezier(0.16,1,0.3,1) 0.15s forwards; }
      @keyframes skPhiloIn { to { opacity: 1; transform: none; } }
      @media (prefers-reduced-motion: reduce) { .sk-philo-in { opacity: 1; transform: none; animation: none; } }
      .sk-hero-slide {
        position: absolute; inset: 0;
        opacity: 0;
        animation: skHeroKen ${(HERO_N * HERO_PER).toFixed(2)}s linear infinite;
        will-change: opacity;
      }
      @keyframes skHeroKen {
        0%                                                            { opacity: 0; }
        ${(0.8 / (HERO_N * HERO_PER) * 100).toFixed(3)}%              { opacity: 1; }
        ${(HERO_PER / (HERO_N * HERO_PER) * 100).toFixed(3)}%         { opacity: 1; }
        ${((HERO_PER + 0.8) / (HERO_N * HERO_PER) * 100).toFixed(3)}% { opacity: 0; }
        100%                                                          { opacity: 0; }
      }

      /* ── Meet-your-chef cutout — kitchen removed, blend baked into the image ── */
      .sk-chef-photo { position: relative; }
      .sk-chef-photo img { display: block; }

      @media (prefers-reduced-motion: reduce) {
        .sk-hero-slide { animation: none; opacity: 0; transform: none; }
        .sk-hero-slide:first-child { opacity: 1; }
      }

      @media (max-width: 768px) {
        .sk-nav-links { display: none !important; }
        .sk-how-grid  { grid-template-columns: 1fr !important; }
        .sk-hero-logo { width: 220px !important; }
        .sk-section   { padding: 60px 20px !important; }
        .sk-hero      { min-height: 100svh !important; padding: calc(100px + var(--banner-h, 0px)) 20px 46px !important; }
        .sk-footer-inner { flex-direction: column !important; gap: 32px !important; align-items: flex-start !important; }
        .sk-nav-inner { height: 78px !important; padding: 0 18px !important; }
        .sk-nav-name  { font-size: 20px !important; letter-spacing: 0.18em !important; }
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
  const [pastHero, setPastHero] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fn = () => {
      const y = window.scrollY;
      setScrolled(y > 30);                       // logo shrinks as soon as you scroll
      const hero = document.querySelector(".sk-hero");
      let heroBottom = window.innerHeight;
      if (hero) { const r = hero.getBoundingClientRect(); heroBottom = r.bottom + window.scrollY; }
      setPastHero(y > heroBottom - 130);         // nav goes glass past the hero
      // Fixed-light: header specular drifts as the page scrolls (low intensity)
      if (!reduce && navRef.current) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, y / max) : 0;
        navRef.current.style.setProperty("--hspec", (10 + p * 80).toFixed(1) + "%");
      }
    };
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    window.addEventListener("resize", fn, { passive: true });
    return () => { window.removeEventListener("scroll", fn); window.removeEventListener("resize", fn); };
  }, []);

  return (
    <nav ref={navRef} className={`sk-glass-nav${pastHero ? " is-scrolled" : ""}`} style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: pastHero ? "var(--header-bg)" : "var(--bg)",
      backdropFilter: pastHero ? "blur(22px) saturate(200%) brightness(1.15)" : "none",
      WebkitBackdropFilter: pastHero ? "blur(22px) saturate(200%) brightness(1.15)" : "none",
      borderBottom: `1px solid ${pastHero ? "var(--header-border)" : "transparent"}`,
      transition: "border-color 0.4s, background 0.4s, backdrop-filter 0.4s",
    }}>
      <div className="sk-nav-inner" style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "0 44px", height: scrolled ? 84 : 134,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxSizing: "border-box",
        transition: "height 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <span
            className="sk-nav-name"
            style={{
              fontFamily: "'Shippori Mincho', Georgia, serif",
              fontWeight: 400, fontSize: 30, letterSpacing: "0.24em",
              color: "#e6dac8", whiteSpace: "nowrap", display: "inline-block",
              transform: scrolled ? "scale(1)" : "scale(1.26)",
              transformOrigin: "left center",
              transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            sonakase
          </span>
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
        {/* Slideshow — pre-framed portrait shots shown uncropped (contain),
            with a blurred fill of the same shot behind so wide screens have no bars */}
        <div className="sk-hero-slides">
          {HERO.map((src, i) => (
            <div key={i} className="sk-hero-slide" style={{ animationDelay: `${i * HERO_PER}s` }}>
              <Image
                src={src}
                alt=""
                aria-hidden="true"
                fill
                priority={i === 0}
                placeholder="blur"
                sizes="100vw"
                style={{ objectFit: "cover", transform: "scale(1.12)", filter: "blur(30px) brightness(0.5)" }}
              />
              <Image
                src={src}
                alt="Specialty sushi from a private Sonakase event in Gainesville."
                fill
                priority={i === 0}
                placeholder="blur"
                sizes="100vw"
                className="sk-hero-fit"
              />
            </div>
          ))}
        </div>
        {/* Readability gradient — the sushi carries the middle; text zones darken */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(13,13,13,0.68) 0%, rgba(13,13,13,0.14) 34%, rgba(13,13,13,0.22) 60%, rgba(13,13,13,0.9) 100%)",
        }} />
      </div>


      {/* Subtle up-hint — there's a philosophy band above the fold */}
      <button
        onClick={() => window.scrollTo({ top: 0, left: 0, behavior: "smooth" })}
        aria-label="Scroll up"
        className="sk-scroll-up"
        style={{
          position: "absolute",
          top: "calc(var(--header-h, 118px) + var(--banner-h, 0px) + 26px)",
          left: "50%",
          background: "none", border: "none", padding: 10, cursor: "pointer",
          color: CREAM, lineHeight: 0, zIndex: 3,
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="sk-scroll-up-icon">
          <path d="M6 14l6-6 6 6" />
          <path d="M6 19l6-6 6 6" opacity="0.4" />
        </svg>
      </button>

      {/* Content sits low so the sushi owns the frame */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", width: "100%", marginTop: "auto" }}>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Shippori Mincho', Georgia, serif", fontWeight: 400,
          fontSize: "clamp(28px, 5vw, 52px)",
          color: CREAM, letterSpacing: "0.04em",
          margin: "0 0 20px", lineHeight: 1.15,
        }}>
          <span className="sk-hero-l1">the sonakase</span>{" "}
          <span className="sk-hero-l2">experience</span>
        </h1>

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

// ── One board's live quote row inside the finder ──────────────
function BoardQuoteRow({ quote, guests }) {
  const animatedTotal = useCountUp(quote.total);
  const { board } = quote;
  return (
    <div className="sk-quote-board" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "16px 18px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 16, background: "rgba(255,255,255,0.03)" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: FONT_UI, fontSize: 11, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(var(--gold-rgb),0.9)", marginBottom: 4 }}>
          {board.name}
        </div>
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 12.5, color: "rgba(var(--text-rgb),0.62)", fontStyle: "italic", lineHeight: 1.4 }}>
          {quote.minimumApplied
            ? "event minimum"
            : `${formatUSD(quote.perGuest)} per guest`}
          {quote.secondChefApplied && ` · +${formatUSD(SECOND_CHEF_FEE)} second chef`}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 30, color: CREAM, fontWeight: 400, lineHeight: 1, whiteSpace: "nowrap" }}>
          {formatUSD(animatedTotal)}
        </div>
        <a href={`/book?guests=${guests}&board=${board.id}`} className="glass-btn" style={{ minHeight: 42, padding: "0 20px", whiteSpace: "nowrap" }}>
          Reserve <span className="sk-arrow">→</span>
        </a>
      </div>
    </div>
  );
}

// ── Quote finder — enter a guest count, compare both boards live ──
function QuoteFinder() {
  const [guests, setGuests] = useState(4);
  const quotes = quotesForGuests(guests);        // always valid: input is clamped to [MIN,MAX]
  const overThreshold = guests > SECOND_CHEF_THRESHOLD;

  const setClamped = (n) => {
    if (Number.isNaN(n)) return;
    setGuests(Math.max(MIN_GUESTS, Math.min(MAX_GUESTS, Math.floor(n))));
  };

  return (
    <div className="glass-panel on-dark sk-quote" style={{ maxWidth: 620, margin: "0 auto 40px", padding: "28px 32px" }}>
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

      <div style={{ height: 1, background: "rgba(255,255,255,0.14)", margin: "22px 0 18px" }} />

      {/* Both boards, live, for this guest count */}
      <div style={{ display: "grid", gap: 12 }}>
        {quotes.map((q) => (
          <BoardQuoteRow key={q.board.id} quote={q} guests={guests} />
        ))}
      </div>

      <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13.5, color: "rgba(var(--text-rgb),0.7)", lineHeight: 1.5, marginTop: 18 }}>
        Reserve with a {formatUSD(quotes[0].deposit)} deposit on either board — the balance is due the day of service.
        {overThreshold && ` Parties over ${SECOND_CHEF_THRESHOLD} bring a second chef.`}
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
                style={{ width: "100%", height: "auto", display: "block", borderRadius: 14, boxShadow: "0 18px 40px rgba(0,0,0,0.45)" }}
              />
            </div>
          </div>
        </Reveal>

        {/* Quote finder — the friendly front door to pricing */}
        <Reveal>
          <QuoteFinder />
        </Reveal>

        {/* Board cards */}
        <div className="sk-pkg-grid" style={{ marginBottom: 20 }}>
          {BOARDS.map((b, idx) => (
              <div className="sk-pkg-card" key={b.id} style={{ "--i": idx }}>
              {/* Sushi photo banner */}
              <div className="sk-pkg-card__photo" aria-hidden="true">
                <Image src={CARD_IMG[b.id]} alt="" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 400px" style={{ objectPosition: CARD_POS[b.id] }} />
              </div>

              {/* Readable dark text panel */}
              <div className="sk-pkg-card__body on-dark">
              {/* Name */}
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 21, color: CREAM, letterSpacing: "0.08em", marginBottom: 8 }}>
                {b.name.toLowerCase()}
              </div>

              {/* Roll & nigiri variety, shown as icons */}
              <BoardMenuIcons board={b} />

              {/* Starting-at price + per-guest rate (standard struck through while launch is active) */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "rgba(var(--text-rgb),0.8)", fontStyle: "italic", marginBottom: 6 }}>
                  starting at
                </div>
                <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 32, color: CREAM, fontWeight: 400, lineHeight: 1 }}>
                  {formatUSD(boardTotalRange(b).low)}
                </div>
                <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, color: "rgba(var(--gold-rgb),0.9)", letterSpacing: "0.06em", marginTop: 8 }}>
                  {LAUNCH_ACTIVE && (
                    <span style={{ color: "rgba(var(--text-rgb),0.45)", textDecoration: "line-through", marginRight: 8, fontWeight: 400 }}>
                      {formatUSD(b.standard.perGuest)}
                    </span>
                  )}
                  {formatUSD(effectiveRates(b).perGuest)} per guest
                </div>
                {LAUNCH_ACTIVE && (
                  <div style={{ fontFamily: FONT_UI, fontSize: 10.5, fontWeight: 600, color: "rgba(var(--gold-rgb),0.95)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 8 }}>
                    launch discount
                  </div>
                )}
              </div>

              {/* Deposit line */}
              <div style={{ fontFamily: FONT_UI, fontSize: 12, fontWeight: 500, color: "rgba(var(--text-rgb),0.6)", marginBottom: 22 }}>
                {formatUSD(DEPOSIT)} deposit to reserve
              </div>

              <div style={{ flex: 1 }} />

              {/* CTA */}
              <a href={`/book?guests=${MIN_GUESTS}&board=${b.id}`} className="glass-btn" style={{ alignSelf: "flex-start", padding: "0 26px", minHeight: 46 }}>
                Reserve <span className="sk-arrow">→</span>
              </a>
              </div>
              </div>
          ))}
        </div>

        {/* Clarifying lines about minimums + serviceware */}
        <Reveal delay={0.1}>
          <p style={{ fontFamily: FONT_UI, fontSize: 12.5, fontWeight: 500, color: "rgba(var(--text-rgb),0.72)", letterSpacing: "0.02em", textAlign: "center", margin: 0, lineHeight: 1.6 }}>
            Each board has an event minimum, so smaller parties pay a set price rather than a per-guest rate. Both include platters, chopsticks, and small plates, and serve at any hour.
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

            {/* Left — Chef portrait, blended into the dark section */}
            <div className="sk-chef-photo">
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
              <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "var(--accent-text)", fontStyle: "italic" }}>
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
  { src: gNew1, alt: "Chef torching a specialty roll at a private sushi event in Gainesville." },
  { src: gNew3, alt: "Chef torching sushi to order during an in-home omakase event." },
  { src: gNew4, alt: "Overhead view of an abundant sushi spread with garnishes." },
  { src: gNew5, alt: "Chef preparing a full sushi spread at a private event." },
  { src: gNew6, alt: "Hand-cutting fresh sushi rolls on the board during service." },
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
            <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 11, color: `rgba(var(--text-rgb),0.55)`, letterSpacing: "0.05em", margin: 0 }}>
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
