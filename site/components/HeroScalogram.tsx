"use client";

import { useEffect, useRef } from "react";

// ─── constants (tune these if needed after seeing it) ───────────────────────
const COLS = 80;          // horizontal cells in the heatmap
const ROWS = 16;          // scale bands — countable, minimal
const SCROLL_SPEED = 55;  // pixels of absolute-x per second (slow, calm)
const CHIRP_A = 0.042;    // chirp rate: how fast frequency rises
const BURST_PERIOD = 880; // pixels between burst centers
const BURST_WIDTH = 28000;// gaussian burst width (larger = wider)

// ─── color helpers ─────────────────────────────────────────────────────────
function hexToRgb(h: string): [number, number, number] {
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return [r, g, b];
}
function lerp3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// ─── synthetic signal ────────────────────────────────────────────────────────
function signal(X: number): number {
  const t = X / 60;
  const chirp = Math.sin(t * t * CHIRP_A);
  const burstPhase = (X % BURST_PERIOD) - BURST_PERIOD / 2;
  const burst = 0.7 * Math.sin(t * 2.5) * Math.exp(-(burstPhase * burstPhase) / BURST_WIDTH);
  return chirp + burst;
}

// ─── cheap scalogram magnitude at (Xc, scale_r) ────────────────────────────
function magnitude(Xc: number, scaleR: number): number {
  const period = scaleR * 9;
  const halfWin = Math.round(period * 1.2);
  let cosAcc = 0, sinAcc = 0, count = 0;
  for (let dx = -halfWin; dx <= halfWin; dx += 2) {
    const s = signal(Xc + dx);
    const phase = (2 * Math.PI * dx) / period;
    cosAcc += s * Math.cos(phase);
    sinAcc += s * Math.sin(phase);
    count++;
  }
  return Math.sqrt(cosAcc * cosAcc + sinAcc * sinAcc) / count;
}

// ─── component ───────────────────────────────────────────────────────────────
export default function HeroScalogram() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    if (!ctx) return;

    // read CSS variables (or fall back to hardcoded)
    const style = getComputedStyle(document.documentElement);
    const paperHex = (style.getPropertyValue("--paper").trim() || "#EFEEEA");
    const accentHex = (style.getPropertyValue("--accent").trim() || "#2C3FBF");
    const warmHex = (style.getPropertyValue("--accent-warm").trim() || "#C24A1F");
    const inkHex = (style.getPropertyValue("--ink").trim() || "#0E1116");

    const cPaper = hexToRgb(paperHex);
    const cAccent = hexToRgb(accentHex);
    const cWarm = hexToRgb(warmHex);
    const cInk = hexToRgb(inkHex);

    const W = canvas.width;
    const H = canvas.height;

    // layout
    const SIG_H = Math.round(H * 0.22);   // signal band height
    const GAP = 2;                          // hairline between bands
    const SCALO_TOP = SIG_H + GAP;
    const SCALO_H = H - SCALO_TOP;

    const cellW = W / COLS;
    const cellH = SCALO_H / ROWS;

    // precompute scale values (row 0 = finest/highest frequency at top)
    const scales: number[] = [];
    for (let r = 0; r < ROWS; r++) {
      scales.push(Math.pow(2, r * 0.38));
    }

    let globalMax = 0.001;

    function computeColumn(col: number, offset: number): number[] {
      const Xc = offset + col * cellW + cellW / 2;
      return scales.map((s) => magnitude(Xc, s));
    }

    // check reduced motion
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let startTime: number | null = null;

    function draw(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = reducedMotion ? 0 : (timestamp - startTime) / 1000;
      const offset = elapsed * SCROLL_SPEED;

      ctx.clearRect(0, 0, W, H);

      // ── background ─────────────────────────────────────────────────────────
      ctx.fillStyle = paperHex;
      ctx.fillRect(0, 0, W, H);

      // ── compute all columns for this frame ─────────────────────────────────
      const mags: number[][] = [];
      globalMax = 0.001;
      for (let c = 0; c < COLS + 4; c++) {
        const col = computeColumn(c, offset);
        mags.push(col);
        col.forEach((v) => { if (v > globalMax) globalMax = v; });
      }

      // ── scalogram heatmap ──────────────────────────────────────────────────
      const THRESHOLD = 0.28; // cells below this fraction of max stay near-background
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const raw = mags[c][r] / globalMax;
          // remap: below threshold → nearly invisible; above → full colour range
          const v = raw < THRESHOLD ? raw * 0.18 : THRESHOLD * 0.18 + (raw - THRESHOLD) / (1 - THRESHOLD) * 0.82;

          let rgb: [number, number, number];
          if (v < 0.5) {
            rgb = lerp3(cPaper, cAccent, v * 2);
          } else {
            rgb = lerp3(cAccent, cWarm, (v - 0.5) * 2);
          }

          const px = c * cellW;
          const py = SCALO_TOP + r * cellH;
          ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
          ctx.beginPath();
          ctx.roundRect(px + 1, py + 1, cellW - 2, cellH - 2, 2);
          ctx.fill();
        }
      }

      // ── hairline separator ─────────────────────────────────────────────────
      ctx.fillStyle = "rgba(107,107,102,0.2)";
      ctx.fillRect(0, SIG_H, W, GAP);

      // ── signal line ────────────────────────────────────────────────────────
      ctx.beginPath();
      ctx.strokeStyle = `rgb(${cInk[0]},${cInk[1]},${cInk[2]})`;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      const sigPad = 16;
      for (let px = 0; px <= W; px += 2) {
        const Xabs = offset + px;
        const s = signal(Xabs);
        const sy = sigPad + ((1 - s) / 2) * (SIG_H - sigPad * 2);
        if (px === 0) ctx.moveTo(px, sy);
        else ctx.lineTo(px, sy);
      }
      ctx.stroke();

      if (!reducedMotion) {
        rafRef.current = requestAnimationFrame(draw);
      }
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "1.25rem" }}>
      {/* eyebrow caption */}
      <span style={{
        fontFamily: "var(--font-jetbrains, monospace)",
        fontSize: "11px",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--ink-mute)",
      }}>
        WAVELET SCATTERING · |x ⋆ ψ<sub style={{ fontSize: "9px" }}>λ</sub>|
      </span>

      {/* canvas */}
      <canvas
        ref={canvasRef}
        width={640}
        height={420}
        style={{
          width: "100%",
          height: "auto",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(20,25,50,0.05)",
          display: "block",
        }}
      />

      {/* math caption beneath */}
      <div style={{ maxWidth: "40ch" }}>
        <p style={{
          fontFamily: "var(--font-jetbrains, monospace)",
          fontSize: "12px",
          color: "var(--ink)",
          marginBottom: "4px",
          letterSpacing: "0.01em",
        }}>
          A signal, decomposed across scales.
        </p>
        <p style={{
          fontFamily: "var(--font-jetbrains, monospace)",
          fontSize: "11px",
          color: "var(--ink-mute)",
          lineHeight: "1.6",
        }}>
          Fixed filters, no training.{" "}
          <span style={{ fontStyle: "italic" }}>S₁[λ] = |x ⋆ ψ<sub style={{ fontSize: "9px" }}>λ</sub>| ⋆ φ<sub style={{ fontSize: "9px" }}>J</sub></span>
          {" "}— each row is one scale band. Bright
          cells are where the signal has energy. Nothing is learned.
        </p>
      </div>
    </div>
  );
}
