"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

// ── Easing library ────────────────────────────────────────────────────────────
const E = {
  out3:    (t) => 1 - Math.pow(1 - t, 3),
  out5:    (t) => 1 - Math.pow(1 - t, 5),
  inOut3:  (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  inOut5:  (t) => t < 0.5 ? 16*t*t*t*t*t : 1 - Math.pow(-2*t+2,5)/2,
  spring:  (t) => t===0?0:t===1?1: Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI/3))+1,
  sharp:   (t) => t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2,
};

// normalize t into [0,1] within a phase window
const ph = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));

// ── Colour tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:      "#0d0d0d",
  gold:    "#E8C97E",
  gold2:   "#b8892a",
  cream:   "#F5F0E8",
  nori:    "#1a2518",
  nori2:   "#0d1610",
  rice:    "#F0EBE0",
  salmon:  "#D4734A",
  salmon2: "#E8956A",
  avocado: "#4a6741",
  avo2:    "#6b9465",
  silver:  "#d0cfc8",
  mat:     "#c4a55a",
  mat2:    "#8a6f30",
  mat3:    "#2a1f08",
};

// ── Phase map (start, end in 0–1 of total 5s) ─────────────────────────────────
const P = {
  FADE_IN:  [0.00, 0.08],
  MAT:      [0.06, 0.22],
  NORI:     [0.20, 0.34],
  RICE:     [0.32, 0.55],
  FISH:     [0.52, 0.66],
  ROLL:     [0.64, 0.80],
  CUT:      [0.78, 0.90],
  SPREAD:   [0.88, 0.94],
  LOGO:     [0.92, 0.97],
  EXIT:     [0.95, 1.00],
};

const TOTAL_MS = 5200;

// ── Rice particle system ──────────────────────────────────────────────────────
function makeRice(W, H, count = 220) {
  const cx = W / 2, cy = H / 2;
  const rw = Math.min(W * 0.36, 260), rh = rw * 0.32;
  return Array.from({ length: count }, (_, i) => {
    const tx = cx - rw/2 + Math.random() * rw;
    const ty = cy - rh/2 + Math.random() * rh;
    return {
      tx, ty,
      x:    cx - rw/2 + (Math.random()-0.5)*rw*2.5,
      y:    cy - rh*2 - Math.random()*rh*4,
      r:    1.1 + Math.random() * 1.2,
      delay: i / count * 0.5 + Math.random() * 0.15,
      twist: (Math.random()-0.5) * 0.8,
    };
  });
}

// ── Main canvas drawing ───────────────────────────────────────────────────────
function draw(ctx, W, H, t, rice, cuts, prevT) {
  ctx.clearRect(0, 0, W, H);

  const cx = W/2, cy = H/2;
  const rw  = Math.min(W * 0.38, 280);  // roll width
  const rh  = rw * 0.30;                // roll height (flat)
  const mat_pad = rw * 0.18;

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle radial glow
  const gl = ph(t, P.MAT[0], P.ROLL[1]);
  if (gl > 0) {
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw * 1.4);
    gr.addColorStop(0, `rgba(184,137,42,${0.08 * gl})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
  }

  // ── MAT ───────────────────────────────────────────────────────────────────
  const tMat = E.out3(ph(t, P.MAT[0], P.MAT[1]));
  if (tMat > 0) {
    const mw  = (rw + mat_pad*2) * tMat;
    const mh  = rh + rw*0.08;
    const mx  = cx - mw/2;
    const my  = cy - mh/2;
    const slats = 14;
    const sh = mh / slats;
    const gap = sh * 0.14;

    for (let i = 0; i < slats; i++) {
      const sy = my + i * sh;
      const prog = Math.max(0, Math.min(1, tMat * slats - i * 0.7));
      if (prog <= 0) continue;
      const sw = mw * E.out5(prog);
      const sx = cx - sw/2;

      // Bamboo slat fill
      const grad = ctx.createLinearGradient(sx, sy, sx, sy+sh-gap);
      grad.addColorStop(0,   C.mat);
      grad.addColorStop(0.4, "#d4b26a");
      grad.addColorStop(1,   C.mat2);
      ctx.fillStyle = grad;
      ctx.fillRect(sx, sy, sw, sh - gap);

      // Grain lines on each slat
      ctx.strokeStyle = C.mat3;
      ctx.lineWidth = 0.4;
      ctx.globalAlpha = 0.35;
      for (let g = 0; g < 3; g++) {
        const gy = sy + (sh - gap) * (0.2 + g * 0.28);
        ctx.beginPath();
        ctx.moveTo(sx + sw*0.05, gy);
        ctx.lineTo(sx + sw*0.95, gy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Slat border
      ctx.strokeStyle = C.mat3;
      ctx.lineWidth = 0.7;
      ctx.strokeRect(sx, sy, sw, sh - gap);
    }

    // Vertical ties
    if (tMat > 0.5) {
      ctx.strokeStyle = C.mat2;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = (tMat - 0.5) * 2;
      [-0.35, 0, 0.35].forEach(pos => {
        const tx2 = cx + mw * pos * 0.5;
        ctx.beginPath();
        ctx.moveTo(tx2, my);
        ctx.lineTo(tx2, my + mh);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }
  }

  // ── NORI ─────────────────────────────────────────────────────────────────
  const tNori = E.inOut3(ph(t, P.NORI[0], P.NORI[1]));
  if (tNori > 0) {
    const nx  = cx - rw/2;
    const ny  = cy - rh/2;
    const nw  = rw * tNori;

    // Main nori body
    const ng = ctx.createLinearGradient(nx, ny, nx, ny + rh);
    ng.addColorStop(0, C.nori);
    ng.addColorStop(1, C.nori2);
    ctx.fillStyle = ng;
    ctx.fillRect(nx, ny, nw, rh);

    // Texture lines
    if (tNori > 0.3) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (let l = 0; l < 8; l++) {
        const lx = nx + nw * (l / 7);
        if (lx > nx + nw) break;
        ctx.beginPath(); ctx.moveTo(lx, ny); ctx.lineTo(lx, ny+rh); ctx.stroke();
      }
      for (let l = 0; l < 5; l++) {
        const ly = ny + rh * (l / 4);
        ctx.beginPath(); ctx.moveTo(nx, ly); ctx.lineTo(nx+nw, ly); ctx.stroke();
      }
    }

    // Nori border
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(nx, ny, nw, rh);
  }

  // ── RICE ─────────────────────────────────────────────────────────────────
  const tRice = ph(t, P.RICE[0], P.RICE[1]);
  if (tRice > 0 && rice) {
    rice.forEach((g) => {
      const gp = E.out3(Math.max(0, Math.min(1, (tRice - g.delay) / (1 - g.delay + 0.01))));
      if (gp <= 0) return;
      const gx = g.x + (g.tx - g.x) * gp;
      const gy = g.y + (g.ty - g.y) * gp;
      const alpha = Math.min(1, gp * 3);

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(g.twist * (1 - gp));
      ctx.globalAlpha = alpha;

      // Oval rice grain
      ctx.beginPath();
      ctx.ellipse(0, 0, g.r * 1.6, g.r, 0, 0, Math.PI*2);
      const rg = ctx.createRadialGradient(-g.r*0.3, -g.r*0.3, 0, 0, 0, g.r*1.6);
      rg.addColorStop(0, "#fff");
      rg.addColorStop(1, C.rice);
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.restore();
    });
    ctx.globalAlpha = 1;
  }

  // ── FISH / INGREDIENTS ────────────────────────────────────────────────────
  const tFish = E.out3(ph(t, P.FISH[0], P.FISH[1]));
  if (tFish > 0) {
    const nx = cx - rw/2, ny = cy - rh/2;

    // Salmon strip (main, 60% width from left)
    const fw = rw * 0.62 * tFish;
    ctx.save();
    ctx.beginPath();
    ctx.rect(nx, ny, rw, rh);
    ctx.clip();

    const sg = ctx.createLinearGradient(nx, ny, nx, ny+rh*0.55);
    sg.addColorStop(0, C.salmon2);
    sg.addColorStop(0.5, C.salmon);
    sg.addColorStop(1, "#b8512a");
    ctx.fillStyle = sg;
    // Wavy salmon strip
    ctx.beginPath();
    ctx.moveTo(nx, ny + rh*0.08);
    ctx.bezierCurveTo(nx+fw*0.3, ny+rh*0.05, nx+fw*0.6, ny+rh*0.12, nx+fw, ny+rh*0.07);
    ctx.lineTo(nx+fw, ny+rh*0.55);
    ctx.bezierCurveTo(nx+fw*0.6, ny+rh*0.60, nx+fw*0.3, ny+rh*0.52, nx, ny+rh*0.55);
    ctx.closePath();
    ctx.fill();

    // Salmon fat lines
    if (tFish > 0.4) {
      ctx.strokeStyle = "rgba(255,200,160,0.4)";
      ctx.lineWidth = 0.8;
      for (let fl = 0; fl < 5; fl++) {
        const flx = nx + fw * (fl / 4) * 0.9;
        ctx.beginPath();
        ctx.moveTo(flx, ny+rh*0.1);
        ctx.bezierCurveTo(flx+4, ny+rh*0.25, flx-3, ny+rh*0.4, flx, ny+rh*0.52);
        ctx.stroke();
      }
    }

    // Avocado strip (right side)
    if (tFish > 0.45) {
      const aw = rw * 0.30 * ((tFish - 0.45)/0.55);
      const axs = nx + rw*0.65;
      const ag2 = ctx.createLinearGradient(axs, ny, axs, ny+rh*0.5);
      ag2.addColorStop(0, C.avo2);
      ag2.addColorStop(1, C.avocado);
      ctx.fillStyle = ag2;
      ctx.beginPath();
      ctx.moveTo(axs, ny+rh*0.10);
      ctx.lineTo(axs+aw, ny+rh*0.12);
      ctx.lineTo(axs+aw, ny+rh*0.50);
      ctx.lineTo(axs, ny+rh*0.48);
      ctx.closePath();
      ctx.fill();
    }

    // Cucumber strip (thin, right)
    if (tFish > 0.65) {
      const cxs = nx + rw*0.68;
      const cp = (tFish - 0.65)/0.35;
      ctx.fillStyle = "#3a5e38";
      ctx.fillRect(cxs - 3, ny + rh*0.12, 5 * cp, rh*0.36);
      ctx.fillStyle = "rgba(120,200,100,0.5)";
      ctx.fillRect(cxs - 3, ny+rh*0.14, 5*cp, rh*0.32);
    }

    ctx.restore();

    // Sesame seeds on rice
    if (tFish > 0.7) {
      const sp = (tFish - 0.7)/0.3;
      ctx.fillStyle = `rgba(220,200,150,${0.7*sp})`;
      const seedCount = 18;
      for (let s = 0; s < seedCount; s++) {
        // deterministic positions
        const sx2 = nx + rw*(0.05 + (s*0.618%1)*0.90);
        const sy2 = ny + rh*0.58 + rh*0.06*(s*0.382%1);
        ctx.beginPath();
        ctx.ellipse(sx2, sy2, 1.2, 0.7, s*0.5, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // ── ROLL FORMATION ───────────────────────────────────────────────────────
  const tRoll = ph(t, P.ROLL[0], P.ROLL[1]);
  if (tRoll > 0) {
    const rollR   = rh * 0.52 + rh * 0.18 * E.out3(tRoll);
    const rollCy  = cy + (rh*0.5) * (1 - E.out5(tRoll));

    // Hide the flat mat/ingredients with a growing overlay
    ctx.save();
    ctx.globalAlpha = E.inOut3(Math.min(tRoll * 2, 1)) * 0.92;
    ctx.fillStyle = C.bg;
    ctx.fillRect(cx - rw*0.6, rollCy - rollR*1.8, rw*1.2, rollR*3.6);
    ctx.restore();

    // Mat wrapping up (left arm)
    const armProgress = E.inOut5(tRoll);
    ctx.save();
    ctx.globalAlpha = 1 - tRoll * 0.5;
    const matArmW = rw * 0.45 * armProgress;
    // Left mat arm curling over
    if (armProgress > 0) {
      ctx.beginPath();
      ctx.arc(cx, rollCy, rollR * 0.95, Math.PI - armProgress*Math.PI, Math.PI, false);
      ctx.strokeStyle = C.mat;
      ctx.lineWidth = rh * 0.07;
      ctx.stroke();
    }
    ctx.restore();

    // Cross-section circle appears
    const circProg = E.out3(Math.max(0, (tRoll - 0.3) / 0.7));
    if (circProg > 0) {
      // Nori outer ring
      ctx.beginPath();
      ctx.arc(cx, rollCy, rollR, 0, Math.PI*2);
      const ng2 = ctx.createRadialGradient(cx, rollCy, rollR*0.7, cx, rollCy, rollR);
      ng2.addColorStop(0, C.nori);
      ng2.addColorStop(1, C.nori2);
      ctx.fillStyle = ng2;
      ctx.globalAlpha = circProg;
      ctx.fill();

      // Rice ring
      const riceR = rollR * 0.82;
      ctx.beginPath();
      ctx.arc(cx, rollCy, riceR, 0, Math.PI*2);
      const rg2 = ctx.createRadialGradient(cx, rollCy, 0, cx, rollCy, riceR);
      rg2.addColorStop(0, "#f8f4ec");
      rg2.addColorStop(1, C.rice);
      ctx.fillStyle = rg2;
      ctx.fill();

      // Salmon arc inside
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, rollCy, riceR*0.72, 0, Math.PI*2);
      ctx.clip();
      const sg2 = ctx.createLinearGradient(cx-rollR, rollCy-rollR, cx+rollR, rollCy+rollR);
      sg2.addColorStop(0, C.salmon2);
      sg2.addColorStop(0.5, C.salmon);
      sg2.addColorStop(1, "#b8512a");
      ctx.fillStyle = sg2;
      ctx.beginPath();
      ctx.arc(cx - riceR*0.28, rollCy + riceR*0.1, riceR*0.38, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Avocado chunk
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, rollCy, riceR*0.72, 0, Math.PI*2);
      ctx.clip();
      const ag3 = ctx.createRadialGradient(cx+riceR*0.25, rollCy-riceR*0.15, 0, cx+riceR*0.25, rollCy-riceR*0.15, riceR*0.28);
      ag3.addColorStop(0, C.avo2);
      ag3.addColorStop(1, C.avocado);
      ctx.fillStyle = ag3;
      ctx.beginPath();
      ctx.arc(cx + riceR*0.25, rollCy - riceR*0.15, riceR*0.28, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Cucumber dot
      ctx.beginPath();
      ctx.arc(cx + riceR*0.05, rollCy + riceR*0.32, riceR*0.12, 0, Math.PI*2);
      ctx.fillStyle = "#3a6835";
      ctx.fill();

      // Nori border
      ctx.beginPath();
      ctx.arc(cx, rollCy, rollR, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.globalAlpha = 1;
    }
  }

  // ── KNIFE & CUTS ─────────────────────────────────────────────────────────
  const tCut  = ph(t, P.CUT[0], P.CUT[1]);
  const rollR = rh * 0.70;
  const rollCy2 = cy;

  if (tCut > 0 && ph(t, P.SPREAD[0], 1) < 0.3) {
    const numCuts = 7;
    const spacing = rw * 0.22;
    const firstX  = cx - spacing * (numCuts-1)/2;

    cuts.forEach((cut, i) => {
      if (!cut.triggered) return;
      const cp = Math.min(1, (t - cut.t) * 8);
      const kx = firstX + i * spacing;

      // Flash line at cut
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * (1 - cp)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(kx, cy - rollR*1.1);
      ctx.lineTo(kx, cy + rollR*1.1);
      ctx.stroke();
    });

    // Knife — appears above the last triggered cut
    const lastCut = cuts.filter(c => c.triggered).length;
    if (lastCut < numCuts) {
      const kx = firstX + lastCut * spacing;
      const downT = E.out5(Math.min(1, tCut * (numCuts+1) - lastCut));
      const kTopY  = cy - rollR*3.5;
      const kBotY  = cy - rollR*1.2 + rollR*2.4*downT;

      ctx.save();
      // Blade
      ctx.beginPath();
      ctx.moveTo(kx - 2.5, kTopY);
      ctx.lineTo(kx + 14, kTopY + 14);
      ctx.lineTo(kx + 14, kBotY);
      ctx.lineTo(kx - 2.5, kBotY + 4);
      ctx.closePath();
      const kg = ctx.createLinearGradient(kx-3, kTopY, kx+14, kBotY);
      kg.addColorStop(0, "#f0ece4");
      kg.addColorStop(0.5, "#d8d0c0");
      kg.addColorStop(1, "#8a8070");
      ctx.fillStyle = kg;
      ctx.fill();

      // Blade edge highlight
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(kx-2.5, kTopY);
      ctx.lineTo(kx-2.5, kBotY+4);
      ctx.stroke();

      // Handle
      ctx.beginPath();
      ctx.roundRect(kx - 5, kTopY - 36, 20, 38, 3);
      const hg = ctx.createLinearGradient(kx-5, 0, kx+15, 0);
      hg.addColorStop(0, "#2a1f0a");
      hg.addColorStop(0.5, "#4a3818");
      hg.addColorStop(1, "#2a1f0a");
      ctx.fillStyle = hg;
      ctx.fill();

      // Handle pins
      [kTopY-28, kTopY-16].forEach(py => {
        ctx.beginPath();
        ctx.arc(kx+5, py, 2, 0, Math.PI*2);
        ctx.fillStyle = C.silver;
        ctx.fill();
      });
      ctx.restore();
    }
  }

  // ── SPREAD PIECES ─────────────────────────────────────────────────────────
  const tSpread = E.spring(ph(t, P.SPREAD[0], P.SPREAD[1]));
  if (tSpread > 0) {
    const numPieces = 8;
    const rollRf    = rh * 0.70;
    const totalW    = rw * 1.05;
    const pieceW    = totalW / numPieces;
    const exitT     = E.inOut3(ph(t, P.EXIT[0], P.EXIT[1]));

    for (let i = 0; i < numPieces; i++) {
      const px = cx - totalW/2 + pieceW * (i + 0.5);
      const spread = (i - (numPieces-1)/2) * pieceW * 0.15 * tSpread;
      const finalX = px + spread;
      const finalY = cy + (exitT * -H * 0.8);
      const alpha  = 1 - exitT * exitT;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(finalX, finalY);

      // Slight tilt per piece
      const tilt = (i - (numPieces-1)/2) * 0.03 * tSpread;
      ctx.rotate(tilt);

      const pr = rollRf * 0.88;

      // Nori outer
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI*2);
      const ng3 = ctx.createRadialGradient(0, 0, pr*0.6, 0, 0, pr);
      ng3.addColorStop(0, C.nori);
      ng3.addColorStop(1, C.nori2);
      ctx.fillStyle = ng3;
      ctx.fill();

      // Rice
      ctx.beginPath();
      ctx.arc(0, 0, pr*0.82, 0, Math.PI*2);
      ctx.fillStyle = C.rice;
      ctx.fill();

      // Salmon
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, pr*0.82, 0, Math.PI*2); ctx.clip();
      const sg3 = ctx.createLinearGradient(-pr, -pr, pr, pr);
      sg3.addColorStop(0, C.salmon2); sg3.addColorStop(1, C.salmon);
      ctx.fillStyle = sg3;
      ctx.beginPath();
      ctx.arc(-pr*0.26, pr*0.10, pr*0.36, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Avocado
      ctx.save();
      ctx.beginPath(); ctx.arc(0, 0, pr*0.82, 0, Math.PI*2); ctx.clip();
      ctx.fillStyle = C.avo2;
      ctx.beginPath();
      ctx.arc(pr*0.24, -pr*0.14, pr*0.26, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();

      // Cucumber
      ctx.beginPath();
      ctx.arc(pr*0.05, pr*0.30, pr*0.11, 0, Math.PI*2);
      ctx.fillStyle = "#3a6835";
      ctx.fill();

      // Nori border
      ctx.beginPath();
      ctx.arc(0, 0, pr, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Sesame seeds
      ctx.fillStyle = "rgba(220,200,150,0.65)";
      for (let s = 0; s < 6; s++) {
        const sa  = (s/6)*Math.PI*2 + i*0.7;
        const sr  = pr * (0.55 + (s%2)*0.15);
        ctx.beginPath();
        ctx.ellipse(Math.cos(sa)*sr, Math.sin(sa)*sr, 1.4, 0.8, sa, 0, Math.PI*2);
        ctx.fill();
      }

      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ── LOGO ─────────────────────────────────────────────────────────────────
  const tLogo = E.out3(ph(t, P.LOGO[0], P.LOGO[1]));
  const exitAlpha = 1 - E.inOut5(ph(t, P.EXIT[0], P.EXIT[1]));

  if (tLogo > 0) {
    ctx.save();
    ctx.globalAlpha = tLogo * exitAlpha;

    const logoY = cy + rh * 0.70 + 48 + (1-tLogo)*20;

    // Gold line
    const lineW = 80 * tLogo;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = tLogo * 0.5 * exitAlpha;
    ctx.beginPath();
    ctx.moveTo(cx - lineW, logoY - 16);
    ctx.lineTo(cx + lineW, logoY - 16);
    ctx.stroke();

    // "sonakase" text
    ctx.globalAlpha = tLogo * exitAlpha;
    ctx.fillStyle = C.cream;
    ctx.font = `${Math.min(W * 0.045, 32)}px 'Shippori Mincho', Georgia, serif`;
    ctx.letterSpacing = "0.18em";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("sonakase", cx, logoY);

    // Subtitle
    ctx.globalAlpha = Math.max(0, tLogo - 0.4) / 0.6 * exitAlpha;
    ctx.fillStyle = C.gold2;
    ctx.font = `${Math.min(W * 0.018, 11)}px 'Shippori Mincho', Georgia, serif`;
    ctx.letterSpacing = "0.35em";
    ctx.fillText("A M E R I C A N   O M A K A S E", cx, logoY + 26);

    ctx.restore();
  }

  // ── FADE IN OVERLAY ───────────────────────────────────────────────────────
  const fadeIn = ph(t, P.FADE_IN[0], P.FADE_IN[1]);
  if (fadeIn < 1) {
    ctx.fillStyle = C.bg;
    ctx.globalAlpha = 1 - E.out3(fadeIn);
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SushiAnimation({ onDone }) {
  const canvasRef  = useRef(null);
  const stateRef   = useRef({
    startTime: null, raf: null,
    rice: null, cuts: null,
  });
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  const skip = useCallback(() => {
    cancelAnimationFrame(stateRef.current.raf);
    setVisible(false);
    setTimeout(() => { router.push("/book"); onDone?.(); }, 350);
  }, [router, onDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-init rice when resized
      stateRef.current.rice = makeRice(canvas.width, canvas.height, 220);
    };
    resize();
    window.addEventListener("resize", resize);

    // Init state
    const W = canvas.width, H = canvas.height;
    stateRef.current.rice = makeRice(W, H, 220);

    // Pre-build cut timing — 7 cuts spread across the CUT phase
    const numCuts = 7;
    stateRef.current.cuts = Array.from({ length: numCuts }, (_, i) => ({
      i,
      triggered: false,
      t: 0,
    }));

    // Prefetch booking page
    router.prefetch("/book");

    let prevT = 0;
    const animate = (now) => {
      if (!stateRef.current.startTime) stateRef.current.startTime = now;
      const elapsed = now - stateRef.current.startTime;
      const t       = Math.min(elapsed / TOTAL_MS, 1);

      const { rice, cuts } = stateRef.current;
      const W2 = canvas.width, H2 = canvas.height;

      // Trigger cuts
      if (cuts) {
        const cutStart = P.CUT[0], cutEnd = P.CUT[1];
        const numCuts2 = cuts.length;
        cuts.forEach((cut, i) => {
          const triggerT = cutStart + (cutEnd - cutStart) * (i / (numCuts2));
          if (!cut.triggered && t >= triggerT) {
            cut.triggered = true;
            cut.t = t;
          }
        });
      }

      draw(ctx, W2, H2, t, rice, cuts, prevT);
      prevT = t;

      if (t < 1) {
        stateRef.current.raf = requestAnimationFrame(animate);
      } else {
        // Done — navigate
        setVisible(false);
        setTimeout(() => { router.push("/book"); onDone?.(); }, 300);
      }
    };

    stateRef.current.raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener("resize", resize);
    };
  }, [router, onDone]);

  if (!visible) return null;

  return (
    <div
      onClick={skip}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "#0d0d0d", cursor: "pointer",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
      {/* Skip hint */}
      <div style={{
        position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
        fontFamily: "'Shippori Mincho', Georgia, serif",
        fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase",
        color: "rgba(245,240,232,0.25)",
        pointerEvents: "none",
        animation: "fadeInSkip 1s ease 1.5s both",
      }}>
        tap to skip
      </div>
      <style>{`
        @keyframes fadeInSkip {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
