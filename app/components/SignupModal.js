"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// Email signup modal. Mounted on public marketing pages only — never on
// the booking flow, confirmation, or lookup pages (enforced by where it
// is rendered). Shows once per visitor: after 25s on page or at 50%
// scroll depth, whichever comes first. Dismissal or signup persists in
// localStorage so it never shows again.
const SEEN_KEY = "sk_signup_done";
const GOLD  = "#E8C97E";
const CREAM = "#F5F0E8";
const FONT_DISPLAY = `'Shippori Mincho', Georgia, serif`;
const FONT_UI      = `'Inter', -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif`;

export default function SignupModal() {
  const [open, setOpen]       = useState(false);
  const [email, setEmail]     = useState("");
  const [status, setStatus]   = useState("idle"); // idle | sending | success | error
  const [reduced, setReduced] = useState(false);
  const dialogRef  = useRef(null);
  const inputRef   = useRef(null);
  const restoreRef = useRef(null);
  const firedRef   = useRef(false);

  // Arm the two triggers; either one opens it, once.
  useEffect(() => {
    try { if (localStorage.getItem(SEEN_KEY)) return; } catch { return; }
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      restoreRef.current = document.activeElement;
      setOpen(true);
    };
    const timer = setTimeout(fire, 25000);
    const onScroll = () => {
      const depth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (depth >= 0.5) fire();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
  }, []);

  const close = useCallback(() => {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    setOpen(false);
    if (restoreRef.current?.focus) restoreRef.current.focus();
  }, []);

  // Escape to close + focus trap while open
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll("button, input, [href]");
      if (!focusables?.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes("@") || status === "sending") return;
    setStatus("sending");
    try {
      const res  = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "modal" }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!open) return null;

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: reduced ? "none" : "skSignupFade 0.25s ease-out",
      }}
    >
      <style>{`
        @keyframes skSignupFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes skSignupRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Email signup"
        style={{
          background: "#141414",
          border: "1px solid rgba(232,201,126,0.25)",
          borderRadius: 24,
          padding: "40px 32px 32px",
          maxWidth: 420, width: "100%",
          position: "relative",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          animation: reduced ? "none" : "skSignupRise 0.3s ease-out",
        }}
      >
        <button
          onClick={close}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(245,240,232,0.5)", fontSize: 18, lineHeight: 1,
            padding: 8, fontFamily: FONT_UI,
          }}
        >
          ✕
        </button>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: GOLD, marginBottom: 10 }}>You&rsquo;re on the list.</div>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 14, color: "rgba(245,240,232,0.6)", fontStyle: "italic", marginBottom: 20 }}>
              You&rsquo;ll be the first to hear about new dates and seasonal menus.
            </div>
            <button onClick={close} style={{ background: "none", border: "1px solid rgba(232,201,126,0.3)", borderRadius: 999, color: GOLD, padding: "10px 24px", fontFamily: FONT_UI, fontSize: 12, cursor: "pointer" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, color: CREAM, lineHeight: 1.35, marginBottom: 20, paddingRight: 20 }}>
              Get first access to new dates and seasonal menus.
            </div>
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "13px 16px", boxSizing: "border-box",
                  border: "1px solid rgba(232,201,126,0.25)", background: "rgba(245,240,232,0.045)",
                  borderRadius: 14, fontFamily: FONT_UI, fontSize: 15, color: CREAM, outline: "none",
                }}
              />
              {status === "error" && (
                <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, color: GOLD, fontStyle: "italic" }}>
                  That didn&rsquo;t go through — check the email and try again.
                </div>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  width: "100%", padding: "14px",
                  background: `linear-gradient(180deg, #F0D796 0%, ${GOLD} 100%)`, color: "#0d0d0d",
                  border: "none", borderRadius: 999,
                  fontFamily: FONT_UI, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
                  textTransform: "uppercase", cursor: "pointer",
                  opacity: status === "sending" ? 0.6 : 1,
                }}
              >
                {status === "sending" ? "Joining…" : "Join the List"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
