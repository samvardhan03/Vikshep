"use client";

import { useState, useMemo } from "react";
import * as d3 from "d3";
import { generateR2Data } from "@/lib/synthetic";

const W = 340, H = 220, PAD = { left: 44, right: 16, top: 16, bottom: 36 };

export default function R2Invariance() {
  const [mode, setMode] = useState<"r2" | "s1">("r2");
  const { signal, background } = useMemo(() => generateR2Data(), []);

  const yKey = mode === "r2" ? "r2" : "s1";
  const allY = [...signal, ...background].map((d) => d[yKey]);
  const allM = [...signal, ...background].map((d) => d.m);

  const xScale = d3.scaleLinear(d3.extent(allM) as [number, number], [PAD.left, W - PAD.right]);
  const yScale = d3.scaleLinear([d3.min(allY)! * 0.9, d3.max(allY)! * 1.05], [H - PAD.bottom, PAD.top]);

  const xTicks = xScale.ticks(5);
  const yTicks = yScale.ticks(4);

  const yLabel = mode === "r2" ? "r₂ = S₂/S₁" : "S₁ (mass-correlated)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Toggle */}
      <div style={{ display: "flex", gap: 2 }}>
        {(["r2", "s1"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 14px",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              border: "1px solid var(--rule)",
              cursor: "pointer",
              backgroundColor: mode === m ? "var(--ink)" : "var(--bg-elev)",
              color: mode === m ? "var(--bg)" : "var(--ink-mute)",
              transition: "all 150ms",
            }}
          >
            {m === "r2" ? "r₂ = S₂/S₁ (invariant)" : "raw S₁ (correlated)"}
          </button>
        ))}
      </div>

      {/* Scatter plot */}
      <div style={{ overflowX: "auto" }}>
      <svg width={W} height={H} style={{ display: "block", backgroundColor: "#F9F6F0" }}>
        {/* Grid */}
        {yTicks.map((t) => (
          <line key={t} x1={PAD.left} y1={yScale(t)} x2={W - PAD.right} y2={yScale(t)}
            stroke="#E5D9CD" strokeWidth="1" />
        ))}

        {/* Background points (blue-ink) */}
        {background.map((d, i) => (
          <circle key={`bg-${i}`}
            cx={xScale(d.m)} cy={yScale(d[yKey])}
            r="3" fill="#1B1B1F" opacity={0.35}
          />
        ))}

        {/* Signal points (warm) */}
        {signal.map((d, i) => (
          <circle key={`sig-${i}`}
            cx={xScale(d.m)} cy={yScale(d[yKey])}
            r="3.5" fill="#C2461F" opacity={0.7}
          />
        ))}

        {/* X-axis */}
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom}
          stroke="#1B1B1F" strokeWidth="1" />
        {xTicks.map((t) => (
          <g key={t}>
            <line x1={xScale(t)} y1={H - PAD.bottom} x2={xScale(t)} y2={H - PAD.bottom + 4}
              stroke="#1B1B1F" strokeWidth="1" />
            <text x={xScale(t)} y={H - PAD.bottom + 14} textAnchor="middle"
              fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">
              {t}
            </text>
          </g>
        ))}
        <text x={(PAD.left + W - PAD.right) / 2} y={H - 2} textAnchor="middle"
          fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">
          m_jj [GeV]
        </text>

        {/* Y-axis */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom}
          stroke="#1B1B1F" strokeWidth="1" />
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left - 4} y1={yScale(t)} x2={PAD.left} y2={yScale(t)}
              stroke="#1B1B1F" strokeWidth="1" />
            <text x={PAD.left - 6} y={yScale(t) + 4} textAnchor="end"
              fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Legend */}
        <circle cx={PAD.left + 8} cy={PAD.top + 8} r="4" fill="#1B1B1F" opacity={0.5} />
        <text x={PAD.left + 16} y={PAD.top + 12} fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">background</text>
        <circle cx={PAD.left + 8} cy={PAD.top + 22} r="4" fill="#C2461F" opacity={0.8} />
        <text x={PAD.left + 16} y={PAD.top + 26} fontSize="9" fill="#4A4A52" fontFamily="var(--font-jetbrains), monospace">signal</text>
      </svg>
      </div>

      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--ink)" }}>{yLabel}.</strong>{" "}
        {mode === "r2"
          ? "r₂ is dimensionless — it can't carry an energy scale. It's the scattering analogue of D2, generalized to a full basis."
          : "S₁ is proportional to jet pT, which correlates with mass. Cutting on S₁ sculpts the background spectrum."}
      </p>
    </div>
  );
}
