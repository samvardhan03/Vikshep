"use client";

import { useMemo } from "react";
import * as d3 from "d3";
import { BlockMath } from "react-katex";
import { generateChirp, computeScattering } from "@/lib/synthetic";

const INK = "#1B1B1F";
const INK_MUTE = "#4A4A52";
const BG_ELEV = "#F9F6F0";
const WARM = "#C2461F";

const PW = 110; // panel width
const PH = 80;  // panel height
const PAD = 8;
const PANELS = 5;
const TOTAL_W = PANELS * PW + (PANELS - 1) * 24;

function SignalPanel({ signal }: { signal: number[] }) {
  const xScale = d3.scaleLinear([0, signal.length - 1], [PAD, PW - PAD]);
  const yScale = d3.scaleLinear([-1, 1], [PH - PAD, PAD]);
  const line = d3.line<number>()
    .x((_, i) => xScale(i))
    .y((v) => yScale(v));
  return (
    <svg width={PW} height={PH} style={{ backgroundColor: BG_ELEV, display: "block" }}>
      <path d={line(signal) ?? ""} fill="none" stroke={INK} strokeWidth="1" />
    </svg>
  );
}

function HeatmapPanel({ data, rows, cols }: { data: number[][]; rows: number; cols: number }) {
  const allVals = data.flat();
  const vMax = Math.max(1e-9, d3.max(allVals) ?? 1);
  const cellW = (PW - PAD * 2) / cols;
  const cellH = (PH - PAD * 2) / rows;
  return (
    <svg width={PW} height={PH} style={{ backgroundColor: BG_ELEV, display: "block" }}>
      {data.map((row, j) =>
        row.map((v, t) => {
          const intensity = Math.min(v / vMax, 1);
          const r = Math.round(251 + (194 - 251) * intensity);
          const g = Math.round(241 + (70 - 241) * intensity);
          const b = Math.round(230 + (31 - 230) * intensity);
          return (
            <rect
              key={`${j}-${t}`}
              x={PAD + t * cellW} y={PAD + j * cellH}
              width={cellW} height={cellH}
              fill={`rgb(${r},${g},${b})`}
            />
          );
        })
      )}
    </svg>
  );
}

function BarPanel({ values, label }: { values: number[]; label?: string[] }) {
  const vMax = Math.max(1e-9, d3.max(values) ?? 1);
  const barW = (PW - PAD * 2) / values.length - 2;
  const yScale = d3.scaleLinear([0, vMax], [PH - PAD, PAD]);
  return (
    <svg width={PW} height={PH} style={{ backgroundColor: BG_ELEV, display: "block" }}>
      {values.map((v, i) => {
        const h = PH - PAD - yScale(v);
        return (
          <g key={i}>
            <rect
              x={PAD + i * (barW + 2)} y={yScale(v)}
              width={barW} height={Math.max(1, h)}
              fill={WARM}
              opacity={0.75 + 0.25 * (i / Math.max(1, values.length - 1))}
            />
            {label && (
              <text
                x={PAD + i * (barW + 2) + barW / 2} y={PH - 1}
                textAnchor="middle"
                fontSize="7" fill={INK_MUTE}
                fontFamily="var(--font-jetbrains), monospace"
              >
                {label[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

const LABELS = [
  { tex: String.raw`x` },
  { tex: String.raw`|x \star \psi_{\lambda_1}|` },
  { tex: String.raw`S_1` },
  { tex: String.raw`|\cdot \star \psi_{\lambda_2}|` },
  { tex: String.raw`S_2` },
];

export default function ScatteringCascade() {
  const { signal, scalogram, s1, s2, s2flat } = useMemo(() => {
    const sig = generateChirp(256);
    return computeScattering(sig);
  }, []);

  const s2Heatmap = useMemo(() => {
    const J = s2.length;
    return Array.from({ length: J }, (_, j1) =>
      Array.from({ length: J }, (_, j2) => s2[j1][j2])
    );
  }, [s2]);

  const panels = [
    <SignalPanel key="sig" signal={signal} />,
    <HeatmapPanel key="scalogram" data={scalogram} rows={scalogram.length} cols={scalogram[0]?.length ?? 64} />,
    <BarPanel key="s1" values={s1} label={s1.map((_, i) => `j${i}`)} />,
    <HeatmapPanel key="s2" data={s2Heatmap} rows={s2Heatmap.length} cols={s2Heatmap[0]?.length ?? 4} />,
    <BarPanel key="s2flat" values={s2flat} />,
  ];

  return (
    <div style={{ overflowX: "auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 24,
          minWidth: TOTAL_W,
          padding: "0 4px",
        }}
      >
        {panels.map((panel, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
            <div style={{ fontSize: 11, textAlign: "center", overflowX: "auto", maxWidth: PW }}>
              <BlockMath math={LABELS[i].tex} />
            </div>
            {panel}
            {i < PANELS - 1 && (
              <div
                style={{
                  position: "absolute",
                  marginLeft: PW + 8,
                  color: INK,
                  fontSize: 18,
                  lineHeight: 1,
                  paddingTop: PH / 2,
                  userSelect: "none",
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
