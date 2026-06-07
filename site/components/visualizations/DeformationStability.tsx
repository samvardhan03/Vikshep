"use client";

import { useState, useMemo } from "react";
import * as d3 from "d3";
import { generateDeformationData } from "@/lib/synthetic";

const W = 200, H = 80, PAD = 10;

function LinePlot({ data, color = "#1B1B1F" }: { data: number[]; color?: string }) {
  const xScale = d3.scaleLinear([0, data.length - 1], [PAD, W - PAD]);
  const ext = d3.extent(data) as [number, number];
  const yScale = d3.scaleLinear([ext[0] - 0.1, ext[1] + 0.1], [H - PAD, PAD]);
  const line = d3.line<number>().x((_, i) => xScale(i)).y((v) => yScale(v));
  return (
    <svg width={W} height={H} style={{ backgroundColor: "#F9F6F0", display: "block" }}>
      <line x1={PAD} y1={H / 2} x2={W - PAD} y2={H / 2} stroke="#E5D9CD" strokeWidth="1" />
      <path d={line(data) ?? ""} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function BarOverlay({ a, b }: { a: number[]; b: number[] }) {
  const total = a.length;
  const maxV = Math.max(...a, ...b, 1e-9);
  const barW = (W - PAD * 2) / total - 3;
  const yScale = d3.scaleLinear([0, maxV], [H - PAD, PAD]);
  return (
    <svg width={W} height={H} style={{ backgroundColor: "#F9F6F0", display: "block" }}>
      {a.map((v, i) => {
        const x = PAD + i * (barW + 3);
        const yA = yScale(v);
        const yB = yScale(b[i]);
        return (
          <g key={i}>
            <rect x={x} y={yA} width={barW} height={H - PAD - yA} fill="#1B1B1F" opacity={0.25} />
            <rect x={x + barW * 0.15} y={yB} width={barW * 0.7} height={H - PAD - yB}
              fill="#C2461F" opacity={0.75} />
          </g>
        );
      })}
    </svg>
  );
}

export default function DeformationStability() {
  const [tauAmp, setTauAmp] = useState(0.15);

  const data = useMemo(() => generateDeformationData(tauAmp), [tauAmp]);

  const relErrPct = (data.relErr * 100).toFixed(2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Signal plots */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div>
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)", marginBottom: 6 }}>
            x(t) — clean signal
          </p>
          <LinePlot data={data.clean} color="#1B1B1F" />
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)", marginBottom: 6 }}>
            x(t − τ(t)) — deformed  ‖τ‖={tauAmp.toFixed(2)}
          </p>
          <LinePlot data={data.deformed} color="#C2461F" />
        </div>
      </div>

      {/* Slider */}
      <div style={{ maxWidth: 400, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--ink-mute)", width: 60 }}>‖τ‖</span>
        <input
          type="range" min={0} max={100} step={1}
          value={Math.round(tauAmp * 100)}
          onChange={(e) => setTauAmp(Number(e.target.value) / 100)}
          style={{ flex: 1, accentColor: "var(--signal-warm)" }}
        />
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "var(--accent)", width: 40, textAlign: "right" }}>
          {tauAmp.toFixed(2)}
        </span>
      </div>

      {/* Scattering bar overlay */}
      <div>
        <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)", marginBottom: 6 }}>
          Scattering coefficients Sx (dark) vs S(L_τ x) (warm) — overlaid
        </p>
        <BarOverlay a={data.scatClean} b={data.scatDeformed} />
      </div>

      {/* Readout */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)" }}>
          ‖S(L_τ x) − Sx‖ / ‖x‖
        </span>
        <span
          style={{
            fontFamily: "var(--font-jetbrains)", fontSize: 20, fontWeight: 700,
            color: parseFloat(relErrPct) > 15 ? "#C2461F" : "#1B1B1F",
          }}
        >
          {relErrPct}%
        </span>
      </div>

      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6 }}>
        Vikshep&#39;s features change at most linearly with how badly your detector smeared the
        signal. Bad pile-up doesn&#39;t blow up your representation.
      </p>
    </div>
  );
}
