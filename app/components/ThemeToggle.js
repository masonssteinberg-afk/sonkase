"use client";
import { useState, useEffect } from "react";

// Floating light/dark toggle. Initial theme is set before paint by the
// inline script in the layout (system preference unless a choice is saved);
// this only reads/updates it. If the visitor hasn't chosen, it also tracks
// live system changes.
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
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("sk_theme", next); } catch {}
    setTheme(next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="glass-btn-sec"
      style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 900,
        width: 48, height: 48, minHeight: 48, padding: 0, borderRadius: 999,
        fontSize: 18, lineHeight: 1,
      }}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
