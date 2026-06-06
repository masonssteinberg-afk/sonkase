"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const BANNER_EXCLUDED = ["/profile", "/admin"];

export default function Banner() {
  const pathname = usePathname();
  const [banner, setBanner] = useState({ enabled: false, text: "" });

  useEffect(() => {
    fetch("/api/banner")
      .then((r) => r.json())
      .then((data) => setBanner(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const active = banner.enabled && !!banner.text;
    document.documentElement.style.setProperty("--banner-h", active ? "38px" : "0px");
    return () => {
      document.documentElement.style.setProperty("--banner-h", "0px");
    };
  }, [banner.enabled, banner.text]);

  if (!banner.enabled || !banner.text) return null;
  if (BANNER_EXCLUDED.some((p) => pathname?.startsWith(p))) return null;

  const t = banner.text;

  return (
    <>
      <style>{`
        .banner-bar {
          position: fixed;
          top: var(--header-h, 0px);
          left: 0;
          right: 0;
          z-index: 99;
          height: 38px;
          background: #1A1A1A;
          border-bottom: 1px solid rgba(232,201,126,0.2);
          overflow: hidden;
        }
        @keyframes banner-ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .banner-track {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          height: 38px;
          animation: banner-ticker 40s linear infinite;
        }
        .banner-seg {
          font-family: 'Shippori Mincho', Georgia, serif;
          font-size: 12px;
          color: #E8C97E;
          letter-spacing: 0.15em;
          padding: 0 40px;
        }
        @media (max-width: 768px) {
          .banner-track { animation-duration: 25s; }
          .banner-seg   { font-size: 11px; padding: 0 20px; }
        }
      `}</style>
      <div className="banner-bar">
        <div style={{ overflow: "hidden", height: "100%" }}>
          <div className="banner-track">
            <span className="banner-seg">{t}</span>
            <span className="banner-seg">{t}</span>
            <span className="banner-seg">{t}</span>
            <span className="banner-seg">{t}</span>
          </div>
        </div>
      </div>
    </>
  );
}
