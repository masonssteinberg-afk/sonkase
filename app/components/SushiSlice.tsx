"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Roll {
  group: THREE.Group;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  fillColor: number;
  radius: number;
  height: number;
  sliced: boolean;
  id: number;
}

interface BombFood {
  group: THREE.Group;
  vel: THREE.Vector3;
  rotVel: THREE.Vector3;
  kind: "pizza" | "taco";
  radius: number;
  sliced: boolean;
  id: number;
}

interface HalfRoll {
  group: THREE.Group;
  vel: THREE.Vector3;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

// ── Geometry helpers ───────────────────────────────────────────────────────────
const FILL_COLORS = [0xe83c2c, 0xe87830, 0x3aaa52, 0x8844cc];
const NORI_COLOR  = 0x141f10;
const RICE_COLOR  = 0xf0ece0;

function buildRollGroup(radius: number, height: number, fillColor: number): THREE.Group {
  const g    = new THREE.Group();
  const segs = 32;
  const noriMat = new THREE.MeshPhongMaterial({ color: NORI_COLOR });
  const riceMat = new THREE.MeshPhongMaterial({ color: RICE_COLOR });
  const fillMat = new THREE.MeshPhongMaterial({ color: fillColor });

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segs), noriMat));

  const capGeo = new THREE.CircleGeometry(radius, segs);
  const topCap = new THREE.Mesh(capGeo, riceMat);
  topCap.rotation.x = -Math.PI / 2; topCap.position.y = height / 2;
  g.add(topCap);
  const botCap = new THREE.Mesh(capGeo.clone(), riceMat);
  botCap.rotation.x = Math.PI / 2;  botCap.position.y = -height / 2;
  g.add(botCap);

  const fillGeo = new THREE.CircleGeometry(radius * 0.58, segs);
  const tf = new THREE.Mesh(fillGeo, fillMat);
  tf.rotation.x = -Math.PI / 2; tf.position.y = height / 2 + 0.01;
  g.add(tf);
  const bf = new THREE.Mesh(fillGeo.clone(), fillMat);
  bf.rotation.x = Math.PI / 2;  bf.position.y = -height / 2 - 0.01;
  g.add(bf);

  return g;
}

function buildHalf(radius: number, halfH: number, fillColor: number, cutAtTop: boolean): THREE.Group {
  const g    = new THREE.Group();
  const segs = 32;
  const noriMat = new THREE.MeshPhongMaterial({ color: NORI_COLOR });
  const riceMat = new THREE.MeshPhongMaterial({ color: RICE_COLOR });
  const fillMat = new THREE.MeshPhongMaterial({ color: fillColor });

  g.add(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, halfH, segs), noriMat));

  const outerY   = cutAtTop ? -halfH / 2 : halfH / 2;
  const outer    = new THREE.Mesh(new THREE.CircleGeometry(radius, segs), riceMat);
  outer.rotation.x = cutAtTop ? Math.PI / 2 : -Math.PI / 2;
  outer.position.y = outerY;
  g.add(outer);
  const outerFill = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.58, segs), fillMat);
  outerFill.rotation.x = cutAtTop ? Math.PI / 2 : -Math.PI / 2;
  outerFill.position.y = outerY + (cutAtTop ? -0.01 : 0.01);
  g.add(outerFill);

  const innerY   = cutAtTop ? halfH / 2 : -halfH / 2;
  const inner    = new THREE.Mesh(new THREE.CircleGeometry(radius, segs), riceMat);
  inner.rotation.x = cutAtTop ? -Math.PI / 2 : Math.PI / 2;
  inner.position.y = innerY;
  g.add(inner);
  const innerFill = new THREE.Mesh(new THREE.CircleGeometry(radius * 0.58, segs), fillMat);
  innerFill.rotation.x = cutAtTop ? -Math.PI / 2 : Math.PI / 2;
  innerFill.position.y = innerY + (cutAtTop ? 0.01 : -0.01);
  g.add(innerFill);

  return g;
}

function buildPizzaGroup(): THREE.Group {
  const g    = new THREE.Group();
  const SEGS = 3; // triangle = pizza-slice wedge

  const crustMat  = new THREE.MeshPhongMaterial({ color: 0xc4904a });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.14, SEGS), crustMat));

  const sauceMat = new THREE.MeshPhongMaterial({ color: 0xc8402a });
  const sauce    = new THREE.Mesh(new THREE.CircleGeometry(0.44, SEGS), sauceMat);
  sauce.rotation.x = -Math.PI / 2; sauce.position.y = 0.075;
  g.add(sauce);

  const cheeseMat = new THREE.MeshPhongMaterial({ color: 0xf0d060 });
  const cheese    = new THREE.Mesh(new THREE.CircleGeometry(0.33, SEGS), cheeseMat);
  cheese.rotation.x = -Math.PI / 2; cheese.position.y = 0.077;
  g.add(cheese);

  const pepMat = new THREE.MeshPhongMaterial({ color: 0x8b2020 });
  [0, 1, 2].forEach(i => {
    const angle = (i / 3) * Math.PI * (2 / 3) - Math.PI / 6;
    const pep   = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.025, 10), pepMat);
    pep.position.set(Math.cos(angle) * 0.19, 0.088, Math.sin(angle) * 0.14);
    g.add(pep);
  });

  return g;
}

function buildTacoGroup(): THREE.Group {
  const g = new THREE.Group();

  // Shell — half-torus gives the classic U-shape
  const shellMat = new THREE.MeshPhongMaterial({ color: 0xd4a843, side: THREE.DoubleSide });
  const shell    = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.16, 8, 20, Math.PI), shellMat);
  shell.rotation.z = Math.PI / 2;
  g.add(shell);

  // Lettuce
  const lettuceMat = new THREE.MeshPhongMaterial({ color: 0x4a9a3a });
  const lettuce    = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 5), lettuceMat);
  lettuce.scale.set(1.4, 0.35, 0.9);
  lettuce.position.y = 0.26;
  g.add(lettuce);

  // Meat / salsa
  const meatMat = new THREE.MeshPhongMaterial({ color: 0xb84a2a });
  const meat    = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 5), meatMat);
  meat.scale.set(1.2, 0.4, 0.7);
  meat.position.set(-0.08, 0.2, 0.05);
  g.add(meat);

  return g;
}

// ── Audio ─────────────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function playSlice() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(900, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, audioCtx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.start(); osc.stop(audioCtx.currentTime + 0.18);
  } catch { /* ignore */ }
}

function playBoom() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const bufSize = audioCtx.sampleRate * 0.35;
    const buf     = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const data    = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 1.8);
    }
    const src  = audioCtx.createBufferSource();
    src.buffer = buf;
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    src.connect(gain); gain.connect(audioCtx.destination);
    src.start();
  } catch { /* ignore */ }
}

// ── Math util ─────────────────────────────────────────────────────────────────
function ptToSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SushiSlice({ onEnter }: { onEnter: () => void }) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore]               = useState(0);
  const [combo, setCombo]               = useState(0);
  const [comboVisible, setComboVisible] = useState(false);
  const [gameOver, setGameOver]         = useState(false);
  const [gameOverKind, setGameOverKind] = useState<"pizza" | "taco" | null>(null);

  const rolls      = useRef<Roll[]>([]);
  const bombs      = useRef<BombFood[]>([]);
  const halves     = useRef<HalfRoll[]>([]);
  const particles  = useRef<Particle[]>([]);
  const trail      = useRef<TrailPoint[]>([]);
  const slicing    = useRef(false);
  const lastSliceT = useRef(0);
  const comboCount = useRef(0);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scoreRef   = useRef(0);
  const rollId     = useRef(0);
  const dead       = useRef(false);
  const onEnterRef = useRef(onEnter);
  useEffect(() => { onEnterRef.current = onEnter; }, [onEnter]);

  useEffect(() => {
    const mount = mountRef.current!;
    const W = mount.clientWidth, H = mount.clientHeight;

    // ── Renderer ───────────────────────────────────────────────────────────────
    const BG_COLOR = 0xF5F0E8;
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.autoClear = false;
    mount.appendChild(renderer.domElement);

    // ── Fade overlay (motion trail) ────────────────────────────────────────────
    const fadeScene = new THREE.Scene();
    const fadeCam   = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const fadeMat   = new THREE.MeshBasicMaterial({
      color: BG_COLOR, transparent: true, opacity: 0.84, depthWrite: false,
    });
    fadeScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), fadeMat));

    // ── Main scene ─────────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    scene.background = new THREE.Color(BG_COLOR);

    const camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 100);
    camera.position.set(0, 0, 10);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pointLight = new THREE.PointLight(0xffeedd, 1.6, 40);
    pointLight.position.set(0, 8, 6);
    scene.add(pointLight);

    const getHalfH = () => camera.position.z * Math.tan((camera.fov / 2) * Math.PI / 180);
    const getHalfW = () => getHalfH() * camera.aspect;

    // ── Spawn ──────────────────────────────────────────────────────────────────
    function spawnObject() {
      if (dead.current) return;
      const fromLeft = Math.random() > 0.5;
      const hh = getHalfH(), hw = getHalfW();
      const spawnX = fromLeft ? -hw - 1.5 : hw + 1.5;
      const spawnY = -hh * 0.4 + (Math.random() - 0.5) * hh * 0.6;
      const speed  = 7 + Math.random() * 5;
      const vel    = new THREE.Vector3(fromLeft ? speed : -speed, 8 + Math.random() * 5, 0);
      const rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      );

      const roll = Math.random();
      if (roll < 0.65) {
        const radius    = 0.55 + Math.random() * 0.2;
        const height    = 1.2 + Math.random() * 0.6;
        const fillColor = FILL_COLORS[Math.floor(Math.random() * FILL_COLORS.length)];
        const group     = buildRollGroup(radius, height, fillColor);
        group.position.set(spawnX, spawnY, (Math.random() - 0.5) * 2);
        scene.add(group);
        rolls.current.push({ group, fillColor, radius, height, sliced: false, id: rollId.current++, vel, rotVel });
      } else if (roll < 0.825) {
        const group = buildPizzaGroup();
        group.position.set(spawnX, spawnY, (Math.random() - 0.5) * 2);
        scene.add(group);
        bombs.current.push({ group, kind: "pizza", radius: 0.62, sliced: false, id: rollId.current++, vel, rotVel });
      } else {
        const group = buildTacoGroup();
        group.position.set(spawnX, spawnY, (Math.random() - 0.5) * 2);
        scene.add(group);
        bombs.current.push({ group, kind: "taco", radius: 0.60, sliced: false, id: rollId.current++, vel, rotVel });
      }
    }

    const spawnInterval = setInterval(spawnObject, 1500);
    spawnObject();

    // ── Slice sushi ────────────────────────────────────────────────────────────
    function sliceRoll(roll: Roll) {
      if (roll.sliced || dead.current) return;
      roll.sliced = true;
      scene.remove(roll.group);
      roll.group.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });

      const pos   = roll.group.position.clone();
      const halfH = roll.height / 2;

      const swipeDir = trail.current.length >= 2
        ? new THREE.Vector3(
            trail.current[trail.current.length - 1].x - trail.current[trail.current.length - 2].x,
            -(trail.current[trail.current.length - 1].y - trail.current[trail.current.length - 2].y),
            0
          ).normalize()
        : new THREE.Vector3(0, 1, 0);
      const perp = new THREE.Vector3(-swipeDir.y, swipeDir.x, 0).multiplyScalar(2.5);

      [true, false].forEach(topHalf => {
        const g = buildHalf(roll.radius, halfH, roll.fillColor, topHalf);
        g.position.copy(pos);
        g.position.y += topHalf ? halfH / 2 : -halfH / 2;
        g.rotation.copy(roll.group.rotation);
        scene.add(g);
        const outV = topHalf ? perp.clone() : perp.clone().negate();
        halves.current.push({
          group: g,
          vel:   roll.vel.clone().add(outV).add(new THREE.Vector3(0, topHalf ? 2 : -2, 0)),
          life:  2.2,
        });
      });

      const pMat = new THREE.MeshBasicMaterial({ color: RICE_COLOR });
      for (let i = 0; i < 8; i++) {
        const pm = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), pMat.clone());
        pm.position.copy(pos);
        scene.add(pm);
        particles.current.push({
          mesh: pm,
          vel:  new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 3),
          life: 0.6 + Math.random() * 0.3,
          maxLife: 0.6 + Math.random() * 0.3,
        });
      }

      const now = Date.now();
      if (now - lastSliceT.current < 700) {
        comboCount.current = Math.min(comboCount.current + 1, 8);
      } else {
        comboCount.current = 0;
      }
      lastSliceT.current = now;
      const mult = comboCount.current > 1 ? comboCount.current : 1;
      scoreRef.current += 10 * mult;
      setScore(scoreRef.current);
      if (comboCount.current > 1) {
        setCombo(comboCount.current);
        setComboVisible(true);
        clearTimeout(comboTimer.current);
        comboTimer.current = setTimeout(() => setComboVisible(false), 900);
      }
      playSlice();
    }

    // ── Slice bomb → game over ─────────────────────────────────────────────────
    function sliceBomb(bomb: BombFood) {
      if (bomb.sliced || dead.current) return;
      bomb.sliced  = true;
      dead.current = true;
      scene.remove(bomb.group);

      const color = bomb.kind === "pizza" ? 0xc8402a : 0xd4a843;
      const pMat  = new THREE.MeshBasicMaterial({ color });
      for (let i = 0; i < 12; i++) {
        const pm = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), pMat.clone());
        pm.position.copy(bomb.group.position);
        scene.add(pm);
        particles.current.push({
          mesh: pm,
          vel:  new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 4),
          life: 0.8 + Math.random() * 0.4,
          maxLife: 0.8 + Math.random() * 0.4,
        });
      }

      playBoom();
      setGameOver(true);
      setGameOverKind(bomb.kind);
      setTimeout(() => onEnterRef.current(), 2500);
    }

    // ── Project to screen ──────────────────────────────────────────────────────
    function projectToScreen(pos: THREE.Vector3) {
      const v    = pos.clone().project(camera);
      const rect = renderer.domElement.getBoundingClientRect();
      return { x: (v.x + 1) / 2 * rect.width, y: (-v.y + 1) / 2 * rect.height };
    }

    // ── Check swipe ────────────────────────────────────────────────────────────
    function checkSlice(ax: number, ay: number, bx: number, by: number) {
      if (dead.current) return;
      rolls.current.forEach(roll => {
        if (roll.sliced) return;
        const p = projectToScreen(roll.group.position);
        const r = Math.max(60, (roll.radius / (roll.group.position.z - camera.position.z + 10)) * 500);
        if (ptToSegDist(p.x, p.y, ax, ay, bx, by) < r) sliceRoll(roll);
      });
      bombs.current.forEach(bomb => {
        if (bomb.sliced) return;
        const p = projectToScreen(bomb.group.position);
        const r = Math.max(60, (bomb.radius / (bomb.group.position.z - camera.position.z + 10)) * 500);
        if (ptToSegDist(p.x, p.y, ax, ay, bx, by) < r) sliceBomb(bomb);
      });
    }

    // ── 2D trail overlay ───────────────────────────────────────────────────────
    const oc   = overlayRef.current!;
    const octx = oc.getContext("2d")!;
    oc.width   = W;
    oc.height  = H;

    function drawTrail() {
      octx.clearRect(0, 0, oc.width, oc.height);
      const now  = Date.now();
      const live = trail.current.filter(p => now - p.t < 150);
      trail.current = live;
      if (live.length < 2) return;
      for (let i = 1; i < live.length; i++) {
        const a = live[i - 1], b = live[i];
        const age = (now - b.t) / 150;
        octx.beginPath();
        octx.moveTo(a.x, a.y);
        octx.lineTo(b.x, b.y);
        octx.strokeStyle = `rgba(255,255,255,${(1 - age) * 0.85})`;
        octx.lineWidth   = 3 * (1 - age) + 1;
        octx.lineCap     = "round";
        octx.stroke();
      }
    }

    // ── Animation loop ─────────────────────────────────────────────────────────
    const GRAVITY = -13;
    let last  = performance.now();
    let rafId: number;

    function animate(now: number) {
      rafId = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const hh = getHalfH();

      rolls.current = rolls.current.filter(roll => {
        if (roll.sliced) return false;
        roll.vel.y += GRAVITY * dt;
        roll.group.position.addScaledVector(roll.vel, dt);
        roll.group.rotation.x += roll.rotVel.x * dt;
        roll.group.rotation.y += roll.rotVel.y * dt;
        roll.group.rotation.z += roll.rotVel.z * dt;
        if (roll.group.position.y < -hh - 4) { scene.remove(roll.group); return false; }
        return true;
      });

      bombs.current = bombs.current.filter(bomb => {
        if (bomb.sliced) return false;
        bomb.vel.y += GRAVITY * dt;
        bomb.group.position.addScaledVector(bomb.vel, dt);
        bomb.group.rotation.x += bomb.rotVel.x * dt;
        bomb.group.rotation.y += bomb.rotVel.y * dt;
        bomb.group.rotation.z += bomb.rotVel.z * dt;
        if (bomb.group.position.y < -hh - 4) { scene.remove(bomb.group); return false; }
        return true;
      });

      halves.current = halves.current.filter(h => {
        h.vel.y += GRAVITY * dt;
        h.group.position.addScaledVector(h.vel, dt);
        h.group.rotation.x += 2 * dt;
        h.group.rotation.z += 1.5 * dt;
        h.life -= dt;
        if (h.life <= 0) { scene.remove(h.group); return false; }
        return true;
      });

      particles.current = particles.current.filter(p => {
        p.vel.y += GRAVITY * 0.5 * dt;
        p.mesh.position.addScaledVector(p.vel, dt);
        p.life -= dt;
        const alpha = Math.max(0, p.life / p.maxLife);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity     = alpha;
        (p.mesh.material as THREE.MeshBasicMaterial).transparent = true;
        if (p.life <= 0) { scene.remove(p.mesh); return false; }
        return true;
      });

      renderer.clearDepth();
      renderer.render(fadeScene, fadeCam);
      renderer.render(scene, camera);
      drawTrail();
    }
    rafId = requestAnimationFrame(animate);

    // ── Input ──────────────────────────────────────────────────────────────────
    let prevX = 0, prevY = 0;
    function onDown(x: number, y: number) {
      slicing.current = true; prevX = x; prevY = y;
      trail.current   = [{ x, y, t: Date.now() }];
    }
    function onMove(x: number, y: number) {
      if (!slicing.current) return;
      checkSlice(prevX, prevY, x, y);
      trail.current.push({ x, y, t: Date.now() });
      prevX = x; prevY = y;
    }
    function onUp() { slicing.current = false; trail.current = []; }

    const el         = renderer.domElement;
    const mouseDown  = (e: MouseEvent)  => onDown(e.clientX, e.clientY);
    const mouseMove  = (e: MouseEvent)  => onMove(e.clientX, e.clientY);
    const mouseUp    = ()               => onUp();
    const touchStart = (e: TouchEvent) => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); };
    const touchMove  = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); };
    const touchEnd   = ()               => onUp();

    el.addEventListener("mousedown",  mouseDown);
    window.addEventListener("mousemove", mouseMove);
    window.addEventListener("mouseup",   mouseUp);
    el.addEventListener("touchstart", touchStart, { passive: false });
    el.addEventListener("touchmove",  touchMove,  { passive: false });
    el.addEventListener("touchend",   touchEnd);

    function onResize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      oc.width = w; oc.height = h;
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(spawnInterval);
      clearTimeout(comboTimer.current);
      el.removeEventListener("mousedown",  mouseDown);
      window.removeEventListener("mousemove", mouseMove);
      window.removeEventListener("mouseup",   mouseUp);
      el.removeEventListener("touchstart", touchStart);
      el.removeEventListener("touchmove",  touchMove);
      el.removeEventListener("touchend",   touchEnd);
      window.removeEventListener("resize",  onResize);
      renderer.dispose();
      scene.clear();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#F5F0E8", overflow: "hidden", cursor: "crosshair" }}>
      <div ref={mountRef} style={{ position: "absolute", inset: 0 }} />
      <canvas ref={overlayRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Score */}
      <div style={{
        position: "absolute", top: 28, right: 36,
        fontFamily: "'Shippori Mincho', Georgia, serif",
        fontSize: 36, color: "#E8C97E", letterSpacing: "0.04em",
        textShadow: "0 0 20px rgba(232,201,126,0.4)",
        userSelect: "none",
      }}>
        {score}
      </div>

      {/* Combo */}
      {comboVisible && !gameOver && (
        <div style={{
          position: "absolute", top: "38%", left: "50%", transform: "translate(-50%,-50%)",
          fontFamily: "'Shippori Mincho', Georgia, serif",
          fontSize: 52, color: "#E8C97E", letterSpacing: "0.08em",
          textShadow: "0 0 30px rgba(232,201,126,0.6)",
          animation: "comboFade 0.9s ease forwards",
          userSelect: "none", pointerEvents: "none",
        }}>
          {combo}× combo
        </div>
      )}

      {/* Game over */}
      {gameOver && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          background: "rgba(13,13,13,0.78)",
          animation: "goFadeIn 0.3s ease forwards",
          pointerEvents: "none",
        }}>
          <div style={{
            fontFamily: "'Shippori Mincho', Georgia, serif",
            fontSize: "clamp(38px, 6vw, 76px)",
            color: "#e83c2c",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            textShadow: "0 0 40px rgba(232,60,44,0.55)",
            marginBottom: 18,
          }}>
            game over
          </div>
          <div style={{
            fontFamily: "'Shippori Mincho', Georgia, serif",
            fontSize: "clamp(13px, 1.8vw, 18px)",
            color: "rgba(245,240,232,0.5)",
            letterSpacing: "0.2em",
          }}>
            you sliced a {gameOverKind}
          </div>
        </div>
      )}

      {/* Enter / escape */}
      {!gameOver && (
        <button
          onClick={onEnter}
          style={{
            position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
            background: "transparent",
            border: "1px solid rgba(232,201,126,0.45)",
            color: "rgba(245,240,232,0.7)",
            fontFamily: "'Shippori Mincho', Georgia, serif",
            fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
            padding: "12px 36px", cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.target as HTMLElement).style.borderColor = "#E8C97E";
            (e.target as HTMLElement).style.color       = "#E8C97E";
          }}
          onMouseLeave={e => {
            (e.target as HTMLElement).style.borderColor = "rgba(232,201,126,0.45)";
            (e.target as HTMLElement).style.color       = "rgba(245,240,232,0.7)";
          }}
        >
          enter →
        </button>
      )}

      <style>{`
        @keyframes comboFade {
          0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
          60%  { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-60%) scale(0.95); }
        }
        @keyframes goFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
