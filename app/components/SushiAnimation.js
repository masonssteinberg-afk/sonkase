"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";

const TOTAL_MS = 7000;

// ── Easing ────────────────────────────────────────────────────────────────────
const E = {
  out3:   (t) => 1 - Math.pow(1 - t, 3),
  out5:   (t) => 1 - Math.pow(1 - t, 5),
  inOut3: (t) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2,
  spring: (t) => t===0?0:t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-0.75)*(2*Math.PI/3))+1,
  bounce: (t) => {
    const n1=7.5625,d1=2.75;
    if(t<1/d1) return n1*t*t;
    if(t<2/d1) return n1*(t-=1.5/d1)*t+0.75;
    if(t<2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
    return n1*(t-=2.625/d1)*t+0.984375;
  },
};
const ph = (t,a,b) => Math.max(0,Math.min(1,(t-a)/(b-a)));

// ── Colours ───────────────────────────────────────────────────────────────────
const BG      = "#0d0d0d";
const GOLD    = "#E8C97E";
const GOLD2   = "#b8892a";
const CREAM   = "#F5F0E8";
const NORI    = "#141f10";
const NORI2   = "#0a1208";
const RICE    = "#F5F0E8";
const SALMON1 = "#E8906A";
const SALMON2 = "#C85830";
const AVO1    = "#6aab60";
const AVO2    = "#3d7535";
const CUKE1   = "#a8d878";
const CUKE2   = "#5a9040";
const MAT1    = "#c4a55a";
const MAT2    = "#8a6f30";
const MAT3    = "#1e1508";
const SILVER  = "#d8d0c0";

// ── Phase timeline ─────────────────────────────────────────────────────────────
const P = {
  MAT:      [0.00, 0.13],
  NORI:     [0.11, 0.21],
  RICE:     [0.19, 0.45],
  FLIP:     [0.43, 0.56],
  SALMON:   [0.54, 0.63],
  AVO:      [0.61, 0.69],
  CUKE:     [0.67, 0.74],
  ROLL:     [0.72, 0.84],
  CUT1:     [0.83, 0.87],  // → 2 pieces
  SPLIT2:   [0.86, 0.90],  // halves line up
  CUT2:     [0.89, 0.92],  // → 4 pieces
  CUT3:     [0.91, 0.93],  // → 8 pieces
  LEAN:     [0.92, 0.97],  // pieces lean into presentation
  LOGO:     [0.93, 0.98],
  EXIT:     [0.96, 1.00],
};

// ── Rice particle factory ─────────────────────────────────────────────────────
function makeRice(W, H, count = 480) {
  const cx=W/2, cy=H/2;
  const rw=Math.min(W*0.38,280), rh=rw*0.28;
  return Array.from({length:count},(_,i)=>{
    const col  = Math.floor(i/(count/32)); // distribute in columns
    const row  = i % Math.ceil(count/32);
    const tx   = cx - rw/2 + (col/31)*rw + (Math.random()-0.5)*6;
    const ty   = cy - rh/2 + (row/Math.ceil(count/32))*rh + (Math.random()-0.5)*4;
    return {
      tx, ty,
      x: tx + (Math.random()-0.5)*W*0.7,
      y: cy - rh*3 - Math.random()*H*0.4,
      r: 1.0 + Math.random()*1.1,
      delay: 0.04 + (i/count)*0.52 + Math.random()*0.08,
      twist: (Math.random()-0.5)*1.2,
    };
  });
}

// ── Cross-section drawer (used for pieces) ────────────────────────────────────
function drawXSection(ctx, x, y, r, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  // Nori ring
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  const ng = ctx.createRadialGradient(0,0,r*0.6,0,0,r);
  ng.addColorStop(0,NORI); ng.addColorStop(1,NORI2);
  ctx.fillStyle=ng; ctx.fill();

  // Rice
  ctx.beginPath(); ctx.arc(0,0,r*0.83,0,Math.PI*2);
  ctx.fillStyle=RICE; ctx.fill();

  // Salmon chunk (left)
  ctx.save();
  ctx.beginPath(); ctx.arc(0,0,r*0.83,0,Math.PI*2); ctx.clip();
  const sg=ctx.createRadialGradient(-r*0.22,r*0.08,0,-r*0.22,r*0.08,r*0.38);
  sg.addColorStop(0,SALMON1); sg.addColorStop(1,SALMON2);
  ctx.fillStyle=sg;
  ctx.beginPath(); ctx.arc(-r*0.22,r*0.08,r*0.38,0,Math.PI*2); ctx.fill();
  // Fat lines
  ctx.strokeStyle="rgba(255,200,160,0.35)"; ctx.lineWidth=0.7;
  for(let fl=0;fl<4;fl++){
    const fla=(fl/4)*Math.PI*0.7-Math.PI*0.1;
    ctx.beginPath();
    ctx.moveTo(-r*0.22+Math.cos(fla)*r*0.02, r*0.08+Math.sin(fla)*r*0.02);
    ctx.lineTo(-r*0.22+Math.cos(fla)*r*0.34, r*0.08+Math.sin(fla)*r*0.34);
    ctx.stroke();
  }
  ctx.restore();

  // Avocado
  ctx.save();
  ctx.beginPath(); ctx.arc(0,0,r*0.83,0,Math.PI*2); ctx.clip();
  const ag=ctx.createRadialGradient(r*0.26,-r*0.20,0,r*0.26,-r*0.20,r*0.27);
  ag.addColorStop(0,AVO1); ag.addColorStop(1,AVO2);
  ctx.fillStyle=ag;
  ctx.beginPath(); ctx.arc(r*0.26,-r*0.20,r*0.27,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Cucumber
  ctx.save();
  ctx.beginPath(); ctx.arc(0,0,r*0.83,0,Math.PI*2); ctx.clip();
  ctx.fillStyle=CUKE2;
  ctx.beginPath(); ctx.arc(r*0.05,r*0.34,r*0.13,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=CUKE1;
  ctx.beginPath(); ctx.arc(r*0.05,r*0.34,r*0.08,0,Math.PI*2); ctx.fill();
  ctx.restore();

  // Sesame seeds
  ctx.fillStyle="rgba(220,195,130,0.7)";
  for(let s=0;s<8;s++){
    const sa=(s/8)*Math.PI*2;
    const sr=r*(0.60+0.12*(s%2));
    ctx.save(); ctx.translate(Math.cos(sa)*sr,Math.sin(sa)*sr);
    ctx.rotate(sa);
    ctx.beginPath(); ctx.ellipse(0,0,1.3,0.7,0,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // Nori border
  ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2);
  ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1.2; ctx.stroke();

  ctx.restore();
}

// ── Main draw ─────────────────────────────────────────────────────────────────
function draw(ctx, W, H, t, rice) {
  ctx.clearRect(0,0,W,H);
  const cx=W/2, cy=H/2;
  const rw=Math.min(W*0.38,280);
  const rh=rw*0.28;

  // Background
  ctx.fillStyle=BG; ctx.fillRect(0,0,W,H);

  // Glow
  const gl=E.out3(ph(t,0.06,0.80));
  if(gl>0){
    const gr=ctx.createRadialGradient(cx,cy,0,cx,cy,rw*1.6);
    gr.addColorStop(0,`rgba(184,137,42,${0.09*gl})`);
    gr.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
  }

  const tExit = E.inOut3(ph(t,P.EXIT[0],P.EXIT[1]));

  // Hide everything during cut/lean phases by fading the flat view
  const flatAlpha = 1 - E.out3(ph(t,P.ROLL[0]+0.08,P.ROLL[1]));

  // ── MAT ──────────────────────────────────────────────────────────────────
  const tMat = E.out3(ph(t,P.MAT[0],P.MAT[1]));
  if(tMat>0 && flatAlpha>0.01){
    ctx.save(); ctx.globalAlpha=flatAlpha;
    const mw=(rw+rw*0.22)*tMat, mh=rh+rw*0.10;
    const mx=cx-mw/2, my=cy-mh/2;
    const slats=16, sh=mh/slats, gap=sh*0.12;
    for(let i=0;i<slats;i++){
      const sy=my+i*sh;
      const p2=Math.max(0,Math.min(1,tMat*slats-i*0.6));
      if(p2<=0) continue;
      const sw=mw*E.out5(p2), sx=cx-sw/2;
      const sg=ctx.createLinearGradient(sx,sy,sx,sy+sh-gap);
      sg.addColorStop(0,MAT1); sg.addColorStop(0.5,"#d4b86e"); sg.addColorStop(1,MAT2);
      ctx.fillStyle=sg; ctx.fillRect(sx,sy,sw,sh-gap);
      // grain
      ctx.strokeStyle=MAT3; ctx.lineWidth=0.35; ctx.globalAlpha=flatAlpha*0.3;
      for(let g=0;g<4;g++){
        const gy=sy+(sh-gap)*(0.15+g*0.22);
        ctx.beginPath(); ctx.moveTo(sx+sw*0.04,gy); ctx.lineTo(sx+sw*0.96,gy); ctx.stroke();
      }
      ctx.globalAlpha=flatAlpha;
      ctx.strokeStyle=MAT3; ctx.lineWidth=0.6; ctx.strokeRect(sx,sy,sw,sh-gap);
    }
    ctx.restore();
  }

  // ── Determine flip state ──────────────────────────────────────────────────
  const tFlipRaw = ph(t,P.FLIP[0],P.FLIP[1]);
  const isFlipped = tFlipRaw >= 0.5;
  // scaleY: goes 1→0 then 0→1
  const flipScaleY = tFlipRaw < 0.5
    ? E.inOut3(1 - tFlipRaw*2)
    : E.inOut3((tFlipRaw-0.5)*2);

  // ── Nori + rice layer (affected by flip) ─────────────────────────────────
  const tNori = E.out3(ph(t,P.NORI[0],P.NORI[1]));
  const tRice = ph(t,P.RICE[0],P.RICE[1]);

  if((tNori>0||tRice>0) && flatAlpha>0.01){
    ctx.save();
    ctx.globalAlpha=flatAlpha;
    // Apply flip scale
    ctx.translate(cx,cy);
    ctx.scale(1, flipScaleY);
    ctx.translate(-cx,-cy);

    // Nori
    if(tNori>0){
      const nw=rw*tNori;
      const ng=ctx.createLinearGradient(cx-nw/2,cy-rh/2,cx-nw/2,cy+rh/2);
      if(!isFlipped){
        ng.addColorStop(0,NORI); ng.addColorStop(1,NORI2);
      } else {
        // Flipped: rice side (cream) on bottom, nori on top
        ng.addColorStop(0,NORI2); ng.addColorStop(1,NORI);
      }
      ctx.fillStyle=ng;
      ctx.fillRect(cx-nw/2,cy-rh/2,nw,rh);
      // texture
      if(tNori>0.4){
        ctx.strokeStyle="rgba(255,255,255,0.035)"; ctx.lineWidth=0.5;
        for(let l=0;l<10;l++){
          const lx=cx-nw/2+nw*(l/9);
          ctx.beginPath(); ctx.moveTo(lx,cy-rh/2); ctx.lineTo(lx,cy+rh/2); ctx.stroke();
        }
        for(let l=0;l<6;l++){
          const ly=cy-rh/2+rh*(l/5);
          ctx.beginPath(); ctx.moveTo(cx-nw/2,ly); ctx.lineTo(cx+nw/2,ly); ctx.stroke();
        }
      }
    }

    // Rice (top of nori before flip, bottom after flip — always visible)
    if(tRice>0 && rice){
      rice.forEach(g=>{
        const gp=E.out3(Math.max(0,Math.min(1,(tRice-g.delay)/(1-g.delay+0.01))));
        if(gp<=0) return;
        const gx=g.x+(g.tx-g.x)*gp, gy=g.y+(g.ty-g.y)*gp;
        ctx.save();
        ctx.translate(gx,gy); ctx.rotate(g.twist*(1-gp));
        ctx.globalAlpha=flatAlpha*Math.min(1,gp*3);
        ctx.beginPath(); ctx.ellipse(0,0,g.r*1.7,g.r,0,0,Math.PI*2);
        const rg=ctx.createRadialGradient(-g.r*0.3,-g.r*0.4,0,0,0,g.r*1.7);
        rg.addColorStop(0,"#fff"); rg.addColorStop(1,RICE);
        ctx.fillStyle=rg; ctx.fill();
        ctx.restore();
      });
    }

    // After flip: show nori on top (thin dark overlay)
    if(isFlipped && tNori>0){
      ctx.fillStyle=NORI; ctx.globalAlpha=flatAlpha*0.92;
      ctx.fillRect(cx-rw/2,cy-rh/2,rw,rh*0.18);
      ctx.globalAlpha=flatAlpha;
    }

    ctx.restore();
  }

  // ── INGREDIENTS (after flip, strips fall top to bottom) ──────────────────
  const tSalmon = E.out5(ph(t,P.SALMON[0],P.SALMON[1]));
  const tAvo    = E.out5(ph(t,P.AVO[0],P.AVO[1]));
  const tCuke   = E.out5(ph(t,P.CUKE[0],P.CUKE[1]));

  if((tSalmon>0||tAvo>0||tCuke>0) && flatAlpha>0.01){
    ctx.save(); ctx.globalAlpha=flatAlpha;
    // Clip to nori bounds
    ctx.beginPath(); ctx.rect(cx-rw/2, cy-rh/2, rw, rh); ctx.clip();

    const iH = rh * 0.78; // ingredient band height
    const iY = cy - rh/2 + rh * 0.13;

    // Salmon strip (top strip) — falls from above
    if(tSalmon>0){
      const stripH = iH * 0.40;
      const offY = (1-tSalmon) * rh * 1.5;
      const sg=ctx.createLinearGradient(cx-rw/2,iY+offY,cx+rw/2,iY+offY+stripH);
      sg.addColorStop(0,SALMON1); sg.addColorStop(0.5,SALMON2); sg.addColorStop(1,SALMON1);
      ctx.fillStyle=sg;
      ctx.fillRect(cx-rw/2, iY+offY, rw, stripH);
      // marbling
      if(tSalmon>0.5){
        ctx.strokeStyle="rgba(255,210,180,0.30)"; ctx.lineWidth=1.0;
        for(let ml=0;ml<7;ml++){
          const mx2=cx-rw/2+rw*(ml/6);
          ctx.beginPath(); ctx.moveTo(mx2,iY+offY+2); ctx.lineTo(mx2+8,iY+offY+stripH-2); ctx.stroke();
        }
      }
    }

    // Avocado strip (middle)
    if(tAvo>0){
      const stripH = iH * 0.32;
      const stripY = iY + iH*0.40;
      const offY = (1-tAvo)*rh*1.5;
      const ag=ctx.createLinearGradient(0,stripY+offY,0,stripY+stripH+offY);
      ag.addColorStop(0,AVO1); ag.addColorStop(1,AVO2);
      ctx.fillStyle=ag;
      ctx.fillRect(cx-rw/2, stripY+offY, rw, stripH);
      // avocado texture dots
      if(tAvo>0.6){
        ctx.fillStyle="rgba(80,150,60,0.25)";
        for(let d=0;d<12;d++){
          const dx=cx-rw*0.45+rw*(d/11)*0.9;
          ctx.beginPath(); ctx.arc(dx,stripY+offY+stripH*0.5,1.5,0,Math.PI*2); ctx.fill();
        }
      }
    }

    // Cucumber strip (bottom, thin)
    if(tCuke>0){
      const stripH = iH * 0.22;
      const stripY = iY + iH*0.72;
      const offY = (1-tCuke)*rh*1.5;
      const cg=ctx.createLinearGradient(0,stripY+offY,0,stripY+stripH+offY);
      cg.addColorStop(0,CUKE1); cg.addColorStop(1,CUKE2);
      ctx.fillStyle=cg;
      ctx.fillRect(cx-rw/2, stripY+offY, rw, stripH);
      // seeds
      if(tCuke>0.5){
        ctx.fillStyle="rgba(255,255,200,0.45)";
        for(let s=0;s<10;s++){
          const sx2=cx-rw*0.42+rw*(s/9)*0.84;
          ctx.beginPath(); ctx.ellipse(sx2,stripY+offY+stripH*0.5,2.5,1.5,0,0,Math.PI*2); ctx.fill();
        }
      }
    }

    ctx.restore();
  }

  // ── ROLL FORMATION ───────────────────────────────────────────────────────
  const tRoll = ph(t,P.ROLL[0],P.ROLL[1]);
  if(tRoll>0){
    const rollProgress = E.inOut3(tRoll);
    const rollR = rh*0.52 + rh*0.14*rollProgress;
    const rollCY = cy;

    // Fade the flat view
    if(tRoll<0.6 && flatAlpha>0){
      // Mat still visible during early roll
    }

    // Show cross-section forming
    const circAlpha = E.out3(Math.max(0,(tRoll-0.35)/0.65));
    if(circAlpha>0){
      drawXSection(ctx, cx, rollCY, rollR, circAlpha*(1-tExit));
    }

    // Rolling mat arms (wrapping animation)
    if(tRoll<0.75 && flatAlpha<0.8){
      const armAngle = rollProgress * Math.PI * 1.1;
      ctx.save();
      ctx.globalAlpha = (1-rollProgress)*0.8;
      ctx.strokeStyle=MAT1; ctx.lineWidth=rh*0.09;
      ctx.beginPath();
      ctx.arc(cx,rollCY,rollR*1.05, Math.PI-armAngle, Math.PI,false);
      ctx.stroke();
      ctx.restore();
    }
  }

  // ── CUTS + PIECES ─────────────────────────────────────────────────────────
  const tCut1   = ph(t,P.CUT1[0],P.CUT1[1]);
  const tSplit2 = ph(t,P.SPLIT2[0],P.SPLIT2[1]);
  const tCut2   = ph(t,P.CUT2[0],P.CUT2[1]);
  const tCut3   = ph(t,P.CUT3[0],P.CUT3[1]);
  const tLean   = ph(t,P.LEAN[0],P.LEAN[1]);

  // Roll is visible from CUT1 onwards as a long cylinder (side view)
  // Then transitions to cross-section pieces
  if(tCut1>0){
    const baseR   = rh*0.66;
    const rollLen = rw*0.92;
    const numPieces = 8;

    // Piece width in "lined up" state
    const pieceGap = 3;
    const totalW   = numPieces*(baseR*2+pieceGap);
    const pieceStep= baseR*2+pieceGap;

    // Compute piece positions based on split progression
    // Start: all 8 stacked at center; then split 1→2→4→8
    const split2prog = E.out3(tSplit2);
    const split4prog = E.out3(tCut2);
    const split8prog = E.out3(tCut3);
    const leanProg   = E.spring(Math.min(tLean,1));

    // X positions for 8 pieces when fully spread
    const pieceXs = Array.from({length:8},(_,i)=>cx-totalW/2+pieceStep*(i+0.5));

    // Build current piece X/alpha for each split stage
    const getPieceX = (i) => {
      // After full split: pieceXs[i]
      // Before: collapsed
      const fullX = pieceXs[i];
      const halfX = cx + (i<4?-1:1)*totalW*0.25;   // 2-piece positions
      const quartX= cx + ([0,1].includes(i%4<2?0:1)?-1:1)*(totalW*0.12*(1+(Math.floor(i/2)%2)));
      // Simple interpolation: collapse to spread
      const spread8 = split8prog;
      const spread4 = split4prog;
      const spread2 = split2prog;
      // Linearly blend between center → half → quarter → eighth
      if(split8prog>0) return halfX + (fullX-halfX)*spread8;
      if(split4prog>0){
        const qx = cx + (i<2?-1:1)*totalW*0.125*(1+(i<2?i:i-2)*0.5);
        return halfX + (qx-halfX)*spread4;
      }
      if(split2prog>0) return cx + (i<4?-1:1)*totalW*0.25*spread2;
      return cx;
    };

    // Lean angle: each piece leans forward ~68 degrees, staggered
    const getLeanAngle = (i) => {
      const stagger = Math.min(1, leanProg - i*0.05);
      return E.bounce(Math.max(0,stagger)) * 1.18; // radians (~68 deg)
    };

    // Draw knife(ves)
    const drawKnife = (kx, progress, alpha=1) => {
      if(progress<=0||progress>=1) return;
      const kTopY = cy - baseR*3.8;
      const kBotY = cy - baseR*1.15 + baseR*2.5*E.out5(progress);
      ctx.save(); ctx.globalAlpha=alpha;
      // Blade
      ctx.beginPath();
      ctx.moveTo(kx-3, kTopY); ctx.lineTo(kx+16, kTopY+16);
      ctx.lineTo(kx+16, kBotY); ctx.lineTo(kx-3, kBotY+5);
      ctx.closePath();
      const kg=ctx.createLinearGradient(kx-3,kTopY,kx+16,kBotY);
      kg.addColorStop(0,"#f4f0e8"); kg.addColorStop(0.5,SILVER); kg.addColorStop(1,"#9a9080");
      ctx.fillStyle=kg; ctx.fill();
      // Edge highlight
      ctx.strokeStyle="rgba(255,255,255,0.65)"; ctx.lineWidth=0.8;
      ctx.beginPath(); ctx.moveTo(kx-3,kTopY); ctx.lineTo(kx-3,kBotY+5); ctx.stroke();
      // Handle
      ctx.beginPath(); ctx.roundRect(kx-6,kTopY-40,22,42,3);
      const hg=ctx.createLinearGradient(kx-6,0,kx+16,0);
      hg.addColorStop(0,"#1e1408"); hg.addColorStop(0.5,"#3e2e10"); hg.addColorStop(1,"#1e1408");
      ctx.fillStyle=hg; ctx.fill();
      [kTopY-30,kTopY-16].forEach(py=>{
        ctx.beginPath(); ctx.arc(kx+5,py,2.5,0,Math.PI*2);
        ctx.fillStyle=SILVER; ctx.fill();
      });
      // Cut flash
      if(progress>0.7){
        const flash=1-(progress-0.7)/0.3;
        ctx.strokeStyle=`rgba(255,255,255,${flash*0.5})`;
        ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(kx,cy-baseR*1.2); ctx.lineTo(kx,cy+baseR*1.2); ctx.stroke();
      }
      ctx.restore();
    };

    // Draw the whole roll as a long cylinder before first cut
    if(tCut1<0.9 && tSplit2<0.1){
      const rollAlpha = 1-E.out3(ph(t,P.CUT1[0]+0.06,P.SPLIT2[0]));
      if(rollAlpha>0){
        ctx.save(); ctx.globalAlpha=rollAlpha*(1-tExit);
        // Cylinder body
        const ry=cy, rx1=cx-rollLen/2, rx2=cx+rollLen/2;
        ctx.beginPath();
        ctx.ellipse(rx1,ry,baseR*0.22,baseR,0,Math.PI/2,3*Math.PI/2);
        ctx.lineTo(rx2,ry-baseR);
        ctx.ellipse(rx2,ry,baseR*0.22,baseR,0,-Math.PI/2,Math.PI/2);
        ctx.closePath();
        const cg=ctx.createLinearGradient(cx-rollLen/2,ry-baseR,cx+rollLen/2,ry+baseR);
        cg.addColorStop(0,NORI); cg.addColorStop(0.5,"#243020"); cg.addColorStop(1,NORI2);
        ctx.fillStyle=cg; ctx.fill();
        // seam line
        ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1;
        ctx.beginPath(); ctx.moveTo(rx1,ry); ctx.lineTo(rx2,ry); ctx.stroke();
        // end caps
        ctx.beginPath(); ctx.ellipse(rx2,ry,baseR*0.22,baseR,0,0,Math.PI*2);
        drawXSection(ctx,rx2,ry,baseR*0.9,rollAlpha);
        ctx.restore();
      }
      drawKnife(cx, tCut1);
    }

    // After split: show 2, 4, or 8 pieces
    const showPiecesFrom = tSplit2>0;
    if(showPiecesFrom){
      // How many distinct piece positions to show
      let visiblePieces;
      if(tCut3>0.5)      visiblePieces=8;
      else if(tCut2>0.5) visiblePieces=4;
      else                visiblePieces=2;

      // Render pieces
      for(let i=0;i<visiblePieces;i++){
        const pxBase = (()=>{
          if(visiblePieces===2) return cx+(i===0?-1:1)*(totalW*0.13+baseR)*split2prog;
          if(visiblePieces===4){
            const offsets=[-1.5,-0.5,0.5,1.5];
            return cx+offsets[i]*(baseR*2+pieceGap*1.5)*E.out3(split4prog+split2prog*0.5);
          }
          // 8 pieces
          return cx-totalW/2+pieceStep*(i+0.5)+
                 (cx-totalW/2+pieceStep*(i+0.5)-cx)*E.out3(split8prog)*0;
        })();

        const pxFull = pieceXs[i];
        const pieceX = visiblePieces===8
          ? cx + (pxFull-cx)*E.out3(split8prog)
          : pxBase;

        const leanAngle = visiblePieces===8 ? getLeanAngle(i) : 0;
        const pieceAlpha = (1-tExit*tExit);

        ctx.save();
        ctx.translate(pieceX, cy);
        if(leanAngle>0){
          // Lean: perspective squash (y scale decreases as lean increases)
          const scaleX = 1;
          const scaleYv = Math.cos(leanAngle);
          const shiftY  = Math.sin(leanAngle)*baseR*0.3;
          ctx.transform(scaleX,0,0,scaleYv,0,shiftY);
        }
        ctx.translate(-pieceX,-cy);
        drawXSection(ctx,pieceX,cy,baseR,pieceAlpha);
        ctx.restore();
      }

      // 2-piece knife cuts
      if(tSplit2>0.8 && tCut2<0.9 && visiblePieces<=4){
        const k2alpha=1-E.out3(ph(t,P.CUT2[0]+0.04,P.CUT3[0]));
        if(visiblePieces===2){
          [-1,1].forEach(side=>{
            drawKnife(cx+side*(totalW*0.13+baseR), tCut2, k2alpha);
          });
        }
      }
      // 4-piece knife cuts
      if(tCut2>0.8 && tCut3<0.9 && visiblePieces<=8){
        const k3alpha=1-E.out3(ph(t,P.CUT3[0]+0.02,P.LEAN[0]));
        if(k3alpha>0){
          const sp=E.out3(split4prog);
          [-3,-1,1,3].forEach(m=>{
            drawKnife(cx+m*(baseR+pieceGap*0.5)*sp*1.05, tCut3, k3alpha);
          });
        }
      }
    }
  }

  // ── LOGO ─────────────────────────────────────────────────────────────────
  const tLogo = E.out3(ph(t,P.LOGO[0],P.LOGO[1]));
  if(tLogo>0){
    const logoAlpha=tLogo*(1-tExit*2);
    if(logoAlpha>0){
      ctx.save(); ctx.globalAlpha=logoAlpha;
      const baseR=rh*0.66;
      const ly=cy+baseR+48+(1-tLogo)*18;
      // line
      ctx.strokeStyle=GOLD; ctx.lineWidth=0.8; ctx.globalAlpha=logoAlpha*0.45;
      ctx.beginPath(); ctx.moveTo(cx-70*tLogo,ly-14); ctx.lineTo(cx+70*tLogo,ly-14); ctx.stroke();
      ctx.globalAlpha=logoAlpha;
      // wordmark
      ctx.fillStyle=CREAM;
      ctx.font=`${Math.min(W*0.042,30)}px 'Shippori Mincho', Georgia, serif`;
      ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText("sonakase",cx,ly);
      // subtitle
      ctx.globalAlpha=Math.max(0,logoAlpha*(tLogo-0.5)/0.5);
      ctx.fillStyle=GOLD2;
      ctx.font=`${Math.min(W*0.016,10)}px 'Shippori Mincho', Georgia, serif`;
      ctx.fillText("A M E R I C A N   O M A K A S E",cx,ly+24);
      ctx.restore();
    }
  }

  // ── FADE-IN ───────────────────────────────────────────────────────────────
  const fadeIn=ph(t,0,0.07);
  if(fadeIn<1){
    ctx.fillStyle=BG; ctx.globalAlpha=E.out3(1-fadeIn);
    ctx.fillRect(0,0,W,H); ctx.globalAlpha=1;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SushiAnimation({ onDone }) {
  const canvasRef = useRef(null);
  const state     = useRef({ startTime:null, raf:null, rice:null });
  const router    = useRouter();
  const [visible, setVisible] = useState(true);

  const skip = useCallback(() => {
    cancelAnimationFrame(state.current.raf);
    setVisible(false);
    setTimeout(()=>{ router.push("/book"); onDone?.(); },320);
  },[router,onDone]);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext("2d");

    const resize=()=>{
      canvas.width=window.innerWidth; canvas.height=window.innerHeight;
      state.current.rice=makeRice(canvas.width,canvas.height,480);
    };
    resize();
    window.addEventListener("resize",resize);
    router.prefetch("/book");

    const animate=(now)=>{
      if(!state.current.startTime) state.current.startTime=now;
      const t=Math.min((now-state.current.startTime)/TOTAL_MS,1);
      draw(ctx,canvas.width,canvas.height,t,state.current.rice);
      if(t<1){ state.current.raf=requestAnimationFrame(animate); }
      else{ setVisible(false); setTimeout(()=>{ router.push("/book"); onDone?.(); },280); }
    };
    state.current.raf=requestAnimationFrame(animate);

    return ()=>{ cancelAnimationFrame(state.current.raf); window.removeEventListener("resize",resize); };
  },[router,onDone]);

  if(!visible) return null;

  return (
    <div onClick={skip} style={{ position:"fixed",inset:0,zIndex:9999,background:BG,cursor:"pointer" }}>
      <canvas ref={canvasRef} style={{ display:"block",width:"100%",height:"100%" }} />
      <div style={{
        position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",
        fontFamily:"'Shippori Mincho',Georgia,serif",fontSize:10,
        letterSpacing:"0.28em",textTransform:"uppercase",
        color:"rgba(245,240,232,0.22)",pointerEvents:"none",
        animation:"fs 1s ease 1.8s both",
      }}>tap to skip</div>
      <style>{`@keyframes fs{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  );
}
