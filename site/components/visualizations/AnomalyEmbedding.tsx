"use client";

import { useState, useMemo } from "react";
import { generateAnomalyData } from "@/lib/synthetic";

// Compact card viewport (no overflow)
const VW = 280, VH = 200;
const CX = VW / 2, CY = VH / 2;
const SCALE = 36; // reduced so max-dist≈3 → 108px < CX-12=128 margin

// Full interactive viewport
const FW = 320, FH = 320;
const FCX = FW / 2, FCY = FH / 2;
const FSCALE = 52;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

interface AnomalyEmbeddingProps {
  compact?: boolean;
}

export default function AnomalyEmbedding({ compact = false }: AnomalyEmbeddingProps) {
  const [threshold, setThreshold] = useState(2.5);
  const { background, signal } = useMemo(() => generateAnomalyData(), []);

  // Subsample for compact in-card version
  const bgPoints = compact ? background.slice(0, 40) : background;
  const sigPoints = compact ? signal.slice(0, 12) : signal;

  const bgFlagged = background.filter((p) => p.dist > threshold);
  const sigFlagged = signal.filter((p) => p.dist > threshold);
  const fpr = bgFlagged.length / background.length;

  if (compact) {
    const ringR = clamp(threshold * SCALE, 8, CX - 12);
    const labelX = clamp(CX + ringR * 0.68, 8, VW - 40);
    const labelY = clamp(CY - ringR * 0.68, 12, VH - 8);
    return (
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        width="100%"
        style={{ display: "block", maxWidth: "100%", backgroundColor: "#F9F6F0", border: "1px solid var(--rule)" }}
        aria-label="BSM anomaly embedding scatter"
      >
        {bgPoints.map((p, i) => {
          const cx = clamp(CX + p.x * SCALE, 4, VW - 4);
          const cy = clamp(CY + p.y * SCALE, 4, VH - 4);
          return <circle key={`bg-${i}`} cx={cx} cy={cy} r="2" fill={p.dist > threshold ? "#C2461F" : "#1B1B1F"} opacity={p.dist > threshold ? 0.55 : 0.18} />;
        })}
        {sigPoints.map((p, i) => {
          const cx = clamp(CX + p.x * SCALE, 4, VW - 4);
          const cy = clamp(CY + p.y * SCALE, 4, VH - 4);
          return <circle key={`sig-${i}`} cx={cx} cy={cy} r="2.5" fill="#C2461F" opacity={p.dist > threshold ? 0.85 : 0.3} />;
        })}
        <circle cx={CX} cy={CY} r={ringR} fill="none" stroke="#C2461F" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
        <circle cx={CX} cy={CY} r="3" fill="#1B1B1F" opacity={0.3} />
        <text x={labelX} y={labelY} fontSize="9" fill="#C2461F" fontFamily="var(--font-jetbrains), monospace">
          τ = {threshold.toFixed(1)}
        </text>
      </svg>
    );
  }

  // Full interactive version
  const ringR = threshold * FSCALE;
  const labelX = clamp(FCX + ringR * 0.68, 8, FW - 48);
  const labelY = clamp(FCY - ringR * 0.68, 12, FH - 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ overflowX: "auto" }}>
        <svg
          viewBox={`0 0 ${FW} ${FH}`}
          width="100%"
          style={{ display: "block", maxWidth: FW, backgroundColor: "#F9F6F0", border: "1px solid var(--rule)" }}
        >
          {bgPoints.map((p, i) => {
            const cx = clamp(FCX + p.x * FSCALE, 4, FW - 4);
            const cy = clamp(FCY + p.y * FSCALE, 4, FH - 4);
            return <circle key={`bg-${i}`} cx={cx} cy={cy} r="2.5" fill={p.dist > threshold ? "#C2461F" : "#1B1B1F"} opacity={p.dist > threshold ? 0.55 : 0.18} />;
          })}
          {sigPoints.map((p, i) => {
            const cx = clamp(FCX + p.x * FSCALE, 4, FW - 4);
            const cy = clamp(FCY + p.y * FSCALE, 4, FH - 4);
            return <circle key={`sig-${i}`} cx={cx} cy={cy} r="3" fill="#C2461F" opacity={p.dist > threshold ? 0.85 : 0.3} stroke={p.dist > threshold ? "#C2461F" : "none"} strokeWidth="1" />;
          })}
          <circle cx={FCX} cy={FCY} r={ringR} fill="none" stroke="#C2461F" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
          <circle cx={FCX} cy={FCY} r="4" fill="#1B1B1F" opacity={0.3} />
          <text x={labelX} y={labelY} fontSize="9" fill="#C2461F" fontFamily="var(--font-jetbrains), monospace">
            τ = {threshold.toFixed(1)}
          </text>
        </svg>
      </div>

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
        calibrated SW₁ distance from the cloud is anomalous by construction.
      </p>
    </div>
  );
}
