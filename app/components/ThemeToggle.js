"use client";
import { useState, useEffect } from "react";

// Light/dark toggle. The icon is CSS-driven off html[data-theme] (set before
// paint by the layout script), so it reflects the real theme in the server
// HTML with no flash — sun in dark mode, moon in light mode. aria-label /
// aria-pressed are corrected after mount (suppressHydrationWarning covers the
// pre-hydration default).
export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(document.documentElement.getAttribute("data-theme") || "dark");
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystem = () => {
      if (localStorage.getItem("sk_theme")) return; // respect an explicit choice
      const next = mq.matches ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      setTheme(next);
    };
    mq.addEventListener?.("change", onSystem);
    return () => mq.removeEventListener?.("change", onSystem);
  }, []);

  const toggle = () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("sk_theme", next); } catch {}
    setTheme(next);
  };

  const isLight = theme === "light";
  return (
    <button
      onClick={toggle}
      suppressHydrationWarning
      className="glass-btn-sec sk-toggle"
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={isLight}
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 900,
        width: 48, height: 48, minHeight: 48, padding: 0, borderRadius: 999,
        fontSize: 18, lineHeight: 1,
      }}
    >
      <span className="sk-sun" aria-hidden="true">☀</span>
      <span className="sk-moon" aria-hidden="true">☾</span>
    </button>
  );
}
