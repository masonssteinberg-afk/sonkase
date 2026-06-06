"use client";
import { useState, useEffect } from "react";

const BG    = "#0d0d0d";
const GOLD  = "#E8C97E";
const CREAM = "#F5F0E8";

const N = (f, o) =>
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${f}' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;

const PARTY_CARDS = [
  {
    name: "Package A",
    pricePerGuest: 95,
    includes: [
      "2 rolls per guest, chef's selection",
      "1 appetizer of your choice",
      "Tricolor nigiri platter",
    ],
    href: "/book?package=partyA",
  },
  {
    name: "Package B",
    pricePerGuest: 125,
    includes: [
      "3 rolls per guest, chef's selection",
      "All 3 appetizers included",
      "Tricolor nigiri platter",
      "Tricolor sashimi platter",
    ],
    href: "/book?package=partyB",
  },
];

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

function calcDiscountedPrice(price, promo) {
  if (!promo) return null;
  const raw = promo.discount_type === "percent"
    ? price * (1 - promo.discount_value / 100)
    : Math.max(0, price - promo.discount_value);
  return Math.round(raw / 5) * 5;
}

export default function PartiesPage() {
  const [activePromo, setActivePromo] = useState(null);
  const [hintIndices, setHintIndices] = useState([]);

  useEffect(() => {
    const pool = Array.from({ length: HINT_FNS.length }, (_, i) => i);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setHintIndices(pool.slice(0, PARTY_CARDS.length));
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
    <div style={{ background: BG, backgroundImage: N(0.65, 0.03), color: CREAM, fontFamily: "'Shippori Mincho', Georgia, serif", minHeight: "100vh", paddingTop: "var(--banner-h, 0px)" }}>
      <PartiesStyles />

      {/* Back link */}
      <div style={{ padding: "28px 40px" }}>
        <a href="/" style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.15em", textDecoration: "none", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
          onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}>
          ← Sonkase™
        </a>
      </div>

      {/* Header */}
      <header style={{ textAlign: "center", padding: "48px 40px 72px", maxWidth: 760, margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 10, color: GOLD, letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: 16 }}>
          LARGER GATHERINGS
        </div>
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 12, color: "rgba(232,201,126,0.55)", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 28 }}>
          10 to 20 guests
        </div>
        <h1 style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 400, color: CREAM, margin: "0 0 24px", lineHeight: 1.1 }}>
          For groups that call for more.
        </h1>
        <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(245,240,232,0.6)", maxWidth: 520, margin: "0 auto", lineHeight: 1.8 }}>
          Two chef-attended* experiences designed for larger groups. Full service, chef&apos;s selection.
        </p>
      </header>

      {/* Package Cards */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 40px 80px", boxSizing: "border-box" }}>
        <div className="parties-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          {PARTY_CARDS.map((card, idx) => {
            const discounted = calcDiscountedPrice(card.pricePerGuest, activePromo);
            const hintParts = activePromo && hintIndices.length > 0
              ? HINT_FNS[hintIndices[idx] % HINT_FNS.length](activePromo.code, activePromo)
              : null;
            return (
              <PackageCard
                key={card.name}
                {...card}
                discounted={discounted}
                hintParts={hintParts}
                onReserve={storePromo}
              />
            );
          })}
        </div>

        {/* Fine print */}
        <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 13, color: "rgba(245,240,232,0.4)", textAlign: "center", fontStyle: "italic", marginTop: 40, lineHeight: 1.7 }}>
          10 guest minimum. True omakase — your chef selects every roll based on what is freshest. You tell us what to avoid.
        </p>

        {/* Footnote */}
        <p style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 11, color: "rgba(245,240,232,0.25)", textAlign: "center", marginTop: 24, lineHeight: 1.7 }}>
          * Chef attendance is subject to availability and circumstances. We will be in touch to confirm.
        </p>
      </div>
    </div>
  );
}

function PackageCard({ name, pricePerGuest, includes, href, discounted, hintParts, onReserve }) {
  return (
    <div className="party-card" style={{
      background: BG,
      border: "1px solid rgba(232,201,126,0.2)",
      padding: "40px 36px 36px",
      display: "flex",
      flexDirection: "column",
      transition: "border-color 0.2s",
    }}>
      <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 22, color: GOLD, letterSpacing: "0.1em", marginBottom: 10 }}>
        {name}
      </div>

      {/* Price */}
      {discounted !== null ? (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(232,201,126,0.35)", fontWeight: 400, lineHeight: 1, textDecoration: "line-through" }}>
            ${pricePerGuest} per guest
          </div>
          <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: GOLD, fontWeight: 400, lineHeight: 1, marginTop: 6 }}>
            ${discounted} per guest
          </div>
          <div className="sk-promo-hint">{hintParts && <HintDisplay parts={hintParts} />}</div>
        </div>
      ) : (
        <div style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 16, color: "rgba(245,240,232,0.6)", fontWeight: 400, marginBottom: 28, lineHeight: 1 }}>
          ${pricePerGuest} per guest
        </div>
      )}

      <div style={{ height: 1, background: GOLD, opacity: 0.2, marginBottom: 28 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 36 }}>
        {includes.map((item) => (
          <div key={item} style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 14, color: "rgba(245,240,232,0.7)", lineHeight: 1.5 }}>
            {item}
          </div>
        ))}
      </div>

      <a
        href={href}
        onClick={onReserve}
        style={{ fontFamily: "'Shippori Mincho', Georgia, serif", fontSize: 12, color: GOLD, letterSpacing: "0.2em", textDecoration: "none", textTransform: "uppercase", transition: "opacity 0.2s" }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = "0.6"}
        onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
      >
        Reserve →
      </a>
    </div>
  );
}

function PartiesStyles() {
  return (
    <style>{`
      @keyframes hint-pulse {
        0%, 100% { opacity: 0.35; transform: scale(0.92); }
        50%       { opacity: 1;   transform: scale(1.06); }
      }
      .sk-promo-hint {
        font-family: 'Shippori Mincho', Georgia, serif;
        font-style: italic;
        font-size: 12px;
        color: #E8C97E;
        margin-top: 12px;
        display: block;
        transform-origin: left center;
        animation: hint-pulse 2.4s ease-in-out infinite;
      }
      .party-card:hover { border-color: rgba(232,201,126,0.45) !important; }
      @media (max-width: 768px) {
        .parties-grid { grid-template-columns: 1fr !important; }
        .party-card   { padding: 28px 20px 24px !important; }
        .sk-promo-hint { font-size: 13px !important; }
      }
      @media (max-width: 480px) {
        .parties-grid { padding: 0 16px !important; }
      }
    `}</style>
  );
}
