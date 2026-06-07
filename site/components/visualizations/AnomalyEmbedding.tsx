"use client";

import { useState, useMemo } from "react";
import * as d3 from "d3";
import { generateAnomalyData } from "@/lib/synthetic";

const W = 320, H = 320;
const CX = W / 2, CY = H / 2;
const SCALE = 52; // pixels per unit

export default function AnomalyEmbedding() {
  const [threshold, setThreshold] = useState(2.5);
  const { background, signal } = useMemo(() => generateAnomalyData(), []);

  const ringR = threshold * SCALE;

  const bgFlagged = background.filter((p) => p.dist > threshold);
  const sigFlagged = signal.filter((p) => p.dist > threshold);
  const fpr = bgFlagged.length / background.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* SVG */}
      <svg
        width={W} height={H}
        style={{ display: "block", backgroundColor: "#F9F6F0", border: "1px solid var(--rule)" }}
      >
        {/* Background SM cloud */}
        {background.map((p, i) => {
          const cx = CX + p.x * SCALE;
          const cy = CY + p.y * SCALE;
          const flagged = p.dist > threshold;
          return (
            <circle key={`bg-${i}`}
              cx={cx} cy={cy} r="2.5"
              fill={flagged ? "#C2461F" : "#1B1B1F"}
              opacity={flagged ? 0.55 : 0.18}
            />
          );
        })}

        {/* Signal anomaly points */}
        {signal.map((p, i) => {
          const cx = CX + p.x * SCALE;
          const cy = CY + p.y * SCALE;
          const flagged = p.dist > threshold;
          return (
            <circle key={`sig-${i}`}
              cx={cx} cy={cy} r="3"
              fill="#C2461F"
              opacity={flagged ? 0.85 : 0.3}
              stroke={flagged ? "#C2461F" : "none"}
              strokeWidth="1"
            />
          );
        })}

        {/* Threshold ring */}
        <circle
          cx={CX} cy={CY} r={ringR}
          fill="none"
          stroke="#C2461F"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          opacity="0.7"
        />
        <circle cx={CX} cy={CY} r={4} fill="#1B1B1F" opacity={0.3} />

        {/* Ring label */}
        <text
          x={CX + ringR * 0.68} y={CY - ringR * 0.68}
          fontSize="9" fill="#C2461F"
          fontFamily="var(--font-jetbrains), monospace"
        >
          τ = {threshold.toFixed(1)}
        </text>
      </svg>

      {/* Slider */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, maxWidth: 360 }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--ink-mute)", width: 24 }}>τ</span>
        <input
          type="range" min={50} max={500} step={5}
          value={Math.round(threshold * 100)}
          onChange={(e) => setThreshold(Number(e.target.value) / 100)}
          style={{ flex: 1, accentColor: "var(--signal-warm)" }}
        />
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--accent)", width: 36, textAlign: "right" }}>
          {threshold.toFixed(2)}
        </span>
      </div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {[
          { label: "bkg flagged", value: bgFlagged.length, unit: `/ ${background.length}` },
          { label: "signal flagged", value: sigFlagged.length, unit: `/ ${signal.length}` },
          { label: "FPR", value: (fpr * 100).toFixed(1), unit: "%" },
        ].map((m) => (
          <div key={m.label} style={{ border: "1px solid var(--rule)", padding: "10px 12px" }}>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 18, fontWeight: 700, color: "var(--ink)" }}>
              {m.value}<span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{m.unit}</span>
            </p>
            <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)" }}>{m.label}</p>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6 }}>
        No signal model. The SM cloud is built from background-only events; anything beyond a
        calibrated SW₁ distance from the cloud is anomalous by construction. Drag the threshold
        and watch the candidate set respond.
      </p>
    </div>
  );
}
