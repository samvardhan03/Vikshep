"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { computeMetrics } from "@/lib/lookup-tables";
import { M_MIN, M_MAX, N_BINS, BIN_W } from "@/lib/synthetic";

const W = 480, H = 200;
const PAD = { left: 44, right: 16, top: 16, bottom: 36 };

const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function buildPath(hist: number[], yMax: number): string {
  const xScale = d3.scaleLinear([0, N_BINS], [PAD.left, W - PAD.right]);
  const yScale = d3.scaleLinear([0, yMax], [H - PAD.bottom, PAD.top]);

  const area = d3
    .area<number>()
    .x((_, i) => xScale(i + 0.5))
    .y0(H - PAD.bottom)
    .y1((v) => yScale(v))
    .curve(d3.curveStep);

  return area(hist) ?? "";
}

export default function MassSculptingKiller() {
  const [mode, setMode] = useState<"nn" | "vs">("nn");
  const [cut, setCut] = useState(50);       // 0–100 (score * 100)
  const [lambda, setLambda] = useState(50); // 0–100 (lambda * 0.01)

  const cutScore = cut / 100;
  const lambdaVal = lambda / 100;

  const metrics = useMemo(
    () => computeMetrics(mode, cutScore, lambdaVal),
    [mode, cutScore, lambdaVal]
  );

  const yMax = Math.max(...metrics.preCutHist, ...metrics.postCutHist) * 1.1 || 0.05;

  const prePath = useMemo(() => buildPath(metrics.preCutHist, yMax), [metrics.preCutHist, yMax]);
  const postPath = useMemo(() => buildPath(metrics.postCutHist, yMax), [metrics.postCutHist, yMax]);

  // X-axis ticks
  const xTicks = [500, 1000, 1500, 2000, 2500, 3000];
  const xScale = d3.scaleLinear([0, N_BINS], [PAD.left, W - PAD.right]);
  const xTickPos = xTicks.map((v) => ({
    pos: xScale((v - M_MIN) / BIN_W),
    label: `${v}`,
  }));

  // Y-axis ticks
  const yScale = d3.scaleLinear([0, yMax], [H - PAD.bottom, PAD.top]);
  const yTicks = yScale.ticks(4);

  const jsdPct = (metrics.jsdVal * 1000).toFixed(2); // ×1000 for readability

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 2 }}>
        {(["nn", "vs"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 16px",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              border: "1px solid var(--rule)",
              cursor: "pointer",
              backgroundColor: mode === m ? "var(--ink)" : "var(--bg-elev)",
              color: mode === m ? "var(--bg)" : "var(--ink-mute)",
              transition: "all 150ms",
            }}
          >
            {m === "nn" ? "Standard NN tagger" : "Vikshep r₂ tagger"}
          </button>
        ))}
      </div>

      {/* Histogram */}
      <div style={{ overflowX: "auto" }}>
      <svg
        width={W}
        height={H}
        style={{ display: "block", backgroundColor: "#F9F6F0", border: "1px solid var(--rule)" }}
      >
        {/* Grid */}
        {yTicks.map((t) => (
          <line
            key={t}
            x1={PAD.left} y1={yScale(t)}
            x2={W - PAD.right} y2={yScale(t)}
            stroke="#E5D9CD" strokeWidth="1"
          />
        ))}

        {/* Pre-cut area (ink, faint fill) */}
        <path
          d={prePath}
          fill="rgba(27,27,31,0.07)"
          stroke="#1B1B1F"
          strokeWidth="1.5"
        />

        {/* Post-cut area (animated) */}
        <motion.path
          d={postPath}
          fill="rgba(194,70,31,0.15)"
          stroke="#C2461F"
          strokeWidth="1.5"
          animate={{ d: postPath }}
          transition={{ type: "tween", duration: 0.18, ease: "easeOut" }}
        />

        {/* Signal bump reference line */}
        {(() => {
          const sigBin = (1200 - M_MIN) / BIN_W;
          const sx = xScale(sigBin);
          return (
            <line
              x1={sx} y1={PAD.top}
              x2={sx} y2={H - PAD.bottom}
              stroke="#C2461F" strokeWidth="1"
              strokeDasharray="3 3" opacity="0.4"
            />
          );
        })()}

        {/* X-axis */}
        <line
          x1={PAD.left} y1={H - PAD.bottom}
          x2={W - PAD.right} y2={H - PAD.bottom}
          stroke="#1B1B1F" strokeWidth="1"
        />
        {xTickPos.map(({ pos, label }) => (
          <g key={label}>
            <line x1={pos} y1={H - PAD.bottom} x2={pos} y2={H - PAD.bottom + 4} stroke="#1B1B1F" strokeWidth="1" />
            <text
              x={pos} y={H - PAD.bottom + 14}
              textAnchor="middle" fontSize="9"
              fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace"
            >
              {label}
            </text>
          </g>
        ))}
        <text
          x={(PAD.left + W - PAD.right) / 2} y={H - 2}
          textAnchor="middle" fontSize="9"
          fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace"
        >
          m_jj [GeV]
        </text>

        {/* Y-axis */}
        <line
          x1={PAD.left} y1={PAD.top}
          x2={PAD.left} y2={H - PAD.bottom}
          stroke="#1B1B1F" strokeWidth="1"
        />
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left - 4} y1={yScale(t)} x2={PAD.left} y2={yScale(t)} stroke="#1B1B1F" strokeWidth="1" />
            <text
              x={PAD.left - 6} y={yScale(t) + 4}
              textAnchor="end" fontSize="9"
              fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace"
            >
              {t.toFixed(3)}
            </text>
          </g>
        ))}

        {/* Legend */}
        <line x1={PAD.left + 8} y1={PAD.top + 8} x2={PAD.left + 20} y2={PAD.top + 8}
          stroke="#1B1B1F" strokeWidth="1.5" />
        <text x={PAD.left + 24} y={PAD.top + 12} fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">
          pre-cut bkg
        </text>
        <line x1={PAD.left + 8} y1={PAD.top + 22} x2={PAD.left + 20} y2={PAD.top + 22}
          stroke="#C2461F" strokeWidth="1.5" />
        <text x={PAD.left + 24} y={PAD.top + 26} fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">
          post-cut bkg
        </text>
      </svg>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 480 }}>
        {/* Cut score slider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", width: 60 }}>
            cut c
          </span>
          <input
            type="range" min={5} max={95} step={1}
            value={cut}
            onChange={(e) => setCut(Number(e.target.value))}
            style={{ flex: 1, accentColor: "var(--signal-warm)" }}
          />
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--accent)", width: 36, textAlign: "right" }}>
            {(cut / 100).toFixed(2)}
          </span>
        </div>

        {/* Lambda slider — only meaningful for vs mode */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            opacity: mode === "vs" ? 1 : 0.35,
            transition: "opacity 200ms",
          }}
        >
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", width: 60 }}>
            λ DisCo
          </span>
          <input
            type="range" min={0} max={100} step={1}
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            disabled={mode === "nn"}
            style={{ flex: 1, accentColor: "var(--signal-warm)" }}
          />
          <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--accent)", width: 36, textAlign: "right" }}>
            {(lambda / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Metrics tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 480 }}>
        {[
          { label: "AUC", value: metrics.auc.toFixed(3), sub: "signal vs bkg" },
          { label: "JSD ×10³", value: jsdPct, sub: "mass sculpting" },
        ].map((m) => (
          <div key={m.label} style={{ border: "1px solid var(--rule)", padding: "12px 16px" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 22, fontWeight: 700, color: "var(--ink)" }}>
              {m.value}
            </p>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              {m.label}
            </p>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)", marginTop: 2 }}>
              {m.sub}
            </p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6, maxWidth: 480 }}>
        The standard NN tagger is correlated with jet mass — cutting on it sculpts the background
        spectrum (JSD rises). The Vikshep r₂ tagger with DisCo penalty (λ) keeps the post-cut
        shape flat. AUC quantifies discrimination power; JSD quantifies sculpting. Drag the sliders
        to see the tradeoff.
      </p>
    </div>
  );
}
