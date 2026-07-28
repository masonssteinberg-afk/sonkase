"use client";
import { useEffect } from "react";

// Drives the liquid-glass motion on the tier cards through CSS custom
// properties. One rAF loop (not a per-event scroll listener) runs only while
// a card is intersecting. Everything is gated on prefers-reduced-motion.
//
//   --imgY   parallax offset for the blurred photo (image layer only)
//   --spec-x/--spec-y  specular position (fixed light + pointer)
//   --rx/--ry/--lift   pointer tilt + hover lift on the card
export default function GlassMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cards = Array.from(document.querySelectorAll(".sk-pkg-card"));
    if (!cards.length) return;

    const small = window.matchMedia("(max-width: 768px)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches && !small;
    const strength = small ? 0.5 : 1;

    const st = new Map();
    cards.forEach((c) => {
      st.set(c, {
        vis: false,
        rx: 0, ry: 0, trx: 0, try_: 0,   // tilt current/target
        lift: 0, tlift: 0,               // hover lift current/target
        sx: 30, tsx: 30,                 // specular X current/target
        pointer: false,
      });
      c.classList.add("pre-enter");
    });

    // Entry: hand off from the keyframe to a resting state so tilt vars apply
    const onEnd = (e) => {
      const c = e.currentTarget;
      c.classList.remove("is-in");
      c.classList.add("entered");
    };
    cards.forEach((c) => c.addEventListener("animationend", onEnd));

    // Pointer tilt (fine pointers only)
    if (finePointer) {
      cards.forEach((c) => {
        const s = st.get(c);
        c.addEventListener("pointermove", (ev) => {
          const r = c.getBoundingClientRect();
          const px = (ev.clientX - r.left) / r.width;
          const py = (ev.clientY - r.top) / r.height;
          s.trx = (0.5 - py) * 8;   // rotateX, max ±4deg
          s.try_ = (px - 0.5) * 8;  // rotateY, max ±4deg
          s.tsx = px * 100;         // specular follows the cursor on X
          s.pointer = true;
        });
        c.addEventListener("pointerleave", () => {
          s.trx = 0; s.try_ = 0; s.pointer = false;
        });
      });
    }

    let running = false;
    let raf = 0;
    const loop = () => {
      let any = false;
      const vh = window.innerHeight;
      const mid = vh / 2;
      for (const c of cards) {
        const s = st.get(c);
        if (!s.vis) continue;
        any = true;
        const r = c.getBoundingClientRect();
        const center = r.top + r.height / 2;
        // -1 at top of viewport, +1 at bottom
        const rel = Math.max(-1, Math.min(1, (center - mid) / (mid + r.height / 2)));

        // Parallax: image drifts opposite the card, ±8% of its height
        c.style.setProperty("--imgY", (-rel * 8 * strength).toFixed(2) + "%");

        // Fixed light: highlight low when the card is high on screen, and vice versa
        c.style.setProperty("--spec-y", (50 - rel * 42).toFixed(1) + "%");

        // Tilt easing (~600ms settle) + specular X
        s.rx += (s.trx - s.rx) * 0.12;
        s.ry += (s.try_ - s.ry) * 0.12;
        s.tlift = s.pointer ? -4 : 0;
        s.lift += (s.tlift - s.lift) * 0.15;
        s.sx += (s.tsx - s.sx) * (s.pointer ? 0.2 : 0.06);
        if (finePointer) {
          c.style.setProperty("--rx", s.rx.toFixed(2) + "deg");
          c.style.setProperty("--ry", s.ry.toFixed(2) + "deg");
          c.style.setProperty("--lift", s.lift.toFixed(2) + "px");
        }
        c.style.setProperty("--spec-x", s.sx.toFixed(1) + "%");
      }
      if (any) { raf = requestAnimationFrame(loop); }
      else { running = false; }
    };

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const s = st.get(e.target);
        if (!s) continue;
        s.vis = e.isIntersecting;
        const media = e.target.querySelector(".sk-pkg-card__photo img") || e.target.querySelector(".sk-pkg-card__photo");
        if (e.isIntersecting) {
          if (e.target.classList.contains("pre-enter")) {
            e.target.classList.remove("pre-enter");
            e.target.classList.add("is-in");
          }
          if (media) media.style.willChange = "transform";
        } else if (media) {
          media.style.willChange = "auto";   // release once out of view
        }
      }
      if ([...st.values()].some((s) => s.vis) && !running) { running = true; loop(); }
    }, { threshold: [0, 0.01, 0.5, 1] });
    cards.forEach((c) => io.observe(c));

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      cards.forEach((c) => c.removeEventListener("animationend", onEnd));
    };
  }, []);

  return null;
}
