"use client";
import { useEffect, useRef } from "react";

const NORI   = "#141f10";
const RICE   = "#f0ece0";
const SALMON = "#e87830";
const AVO    = "#4a9a3a";
const GOLD   = "rgba(232,201,126,";

// ── Draw one frame ────────────────────────────────────────────────────────────
// p   = scroll progress 0→1
// W,H = logical canvas dimensions
function draw(ctx: CanvasRenderingContext2D, W: number, H: number, p: number) {
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const R  = 11;              // roll cross-section radius (px)
  const pad = R + 8;          // vertical padding from canvas edges
  const trackH = H - pad * 2; // usable track height
  const rollY  = pad + p * trackH; // roll's Y position

  // ── Nori strip track above roll (already unrolled) ───────────────────────
  if (rollY > pad + 1) {
    // Nori sheet
    ctx.beginPath();
    ctx.moveTo(cx, pad);
    ctx.lineTo(cx, rollY - R + 1);
    ctx.strokeStyle = NORI;
    ctx.lineWidth   = 5;
    ctx.lineCap     = "butt";
    ctx.stroke();

    // Rice surface edge (the inner face of the nori that's now exposed)
    ctx.beginPath();
    ctx.moveTo(cx + 3, pad);
    ctx.lineTo(cx + 3, rollY - R + 1);
    ctx.strokeStyle = "rgba(240,236,224,0.35)";
    ctx.lineWidth   = 2;
    ctx.stroke();
  }

  // ── Faint guide below roll (not yet visited) ──────────────────────────────
  if (rollY + R < H - pad) {
    ctx.beginPath();
    ctx.moveTo(cx, rollY + R - 1);
    ctx.lineTo(cx, H - pad);
    ctx.strokeStyle = GOLD + "0.14)";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    ctx.stroke();
  }

  // ── End-cap dots ──────────────────────────────────────────────────────────
  ctx.beginPath();
  ctx.arc(cx, pad, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = GOLD + "0.55)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, H - pad, 2.5, 0, Math.PI * 2);
  ctx.fillStyle = GOLD + "0.22)";
  ctx.fill();

  // ── Sushi roll cross-section at current position ──────────────────────────

  // Soft glow around the roll
  const glow = ctx.createRadialGradient(cx, rollY, 0, cx, rollY, R * 2.2);
  glow.addColorStop(0, "rgba(232,201,126,0.12)");
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, rollY, R * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Rice
  ctx.beginPath();
  ctx.arc(cx, rollY, R * 0.80, 0, Math.PI * 2);
  ctx.fillStyle = RICE;
  ctx.fill();

  // Salmon (clipped to rice circle)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, rollY, R * 0.80, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cx - R * 0.26, rollY + R * 0.10, R * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = SALMON;
  ctx.fill();
  ctx.restore();

  // Avocado (clipped)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, rollY, R * 0.80, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cx + R * 0.27, rollY - R * 0.22, R * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = AVO;
  ctx.fill();
  ctx.restore();

  // Nori ring — gap opens at the TOP as p increases
  // (the nori is peeling upward into the track above)
  const noriW    = R * 0.32;
  const maxGap   = Math.PI * 1.90;
  const gapAngle = maxGap * p;
  const halfGap  = gapAngle / 2;
  const arcLen   = Math.PI * 2 - gapAngle;

  if (arcLen > 0.04) {
    // 3π/2 = upward direction in canvas. Arc leaves a gap there.
    // Going clockwise from (3π/2 + halfGap) to (3π/2 − halfGap) covers (2π − gapAngle).
    const startA = 3 * Math.PI / 2 + halfGap;
    const endA   = 3 * Math.PI / 2 - halfGap;

    ctx.beginPath();
    ctx.arc(cx, rollY, R, startA, endA);
    ctx.strokeStyle = NORI;
    ctx.lineWidth   = noriW;
    ctx.lineCap     = "butt";
    ctx.stroke();

    // Subtle sheen on nori ring
    ctx.beginPath();
    ctx.arc(cx, rollY, R - noriW * 0.1, startA + 0.08, endA - 0.08);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth   = noriW * 0.22;
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ScrollRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef({ ctx: null as CanvasRenderingContext2D | null, W: 44, H: 0 });

  useEffect(() => {
    const canvas  = canvasRef.current!;
    const dpr     = Math.min(window.devicePixelRatio || 1, 2);
    const W       = 44;
    stateRef.current.W = W;

    function resize() {
      const H = Math.round(window.innerHeight * 0.70);
      stateRef.current.H = H;
      canvas.width        = W * dpr;
      canvas.height       = H * dpr;
      canvas.style.width  = `${W}px`;
      canvas.style.height = `${H}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      stateRef.current.ctx = ctx;
    }

    function getProgress() {
      const el  = document.documentElement;
      const top = el.scrollTop || document.body.scrollTop;
      const max = el.scrollHeight - el.clientHeight;
      return max > 0 ? Math.min(top / max, 1) : 0;
    }

    function repaint() {
      const { ctx, W, H } = stateRef.current;
      if (ctx) draw(ctx, W, H, getProgress());
    }

    function onResize() { resize(); repaint(); }

    resize();
    repaint();
    window.addEventListener("scroll", repaint, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", repaint);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className="sk-scroll-roll"
      style={{
        position: "fixed",
        left: 18,
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
