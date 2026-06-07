"use client";

import { useState, useMemo } from "react";
import { morlet2D } from "@/lib/synthetic";

const CELL_SIZE = 3;   // px per grid cell (display)
const GRID = 12;       // cells per axis
const PANEL = GRID * CELL_SIZE; // 36px SVG panel

function valueToColor(v: number, min: number, max: number): string {
  const t = (v - min) / Math.max(1e-9, max - min);
  if (t < 0.5) {
    const s = t * 2;
    return `rgb(${Math.round(27 + (251 - 27) * s)},${Math.round(27 + (241 - 27) * s)},${Math.round(31 + (230 - 31) * s)})`;
  }
  const s = (t - 0.5) * 2;
  return `rgb(${Math.round(251 + (194 - 251) * s)},${Math.round(241 + (70 - 241) * s)},${Math.round(230 + (31 - 230) * s)})`;
}

interface WaveletPatchProps {
  j: number;
  theta: number;
  onHover: (info: string | null) => void;
}

function WaveletPatch({ j, theta, onHover }: WaveletPatchProps) {
  const grid = useMemo(() => morlet2D(j, theta, GRID), [j, theta]);

  const flat = grid.flat();
  const min = Math.min(...flat);
  const max = Math.max(...flat);

  const label = `j=${j}, θ=${((theta * 180) / Math.PI).toFixed(0)}°`;

  return (
    <svg
      width={PANEL} height={PANEL}
      style={{ display: "block", cursor: "crosshair", border: "1px solid var(--rule)" }}
      onMouseEnter={() => onHover(label)}
      onMouseLeave={() => onHover(null)}
    >
      {grid.map((row, py) =>
        row.map((v, px) => (
          <rect
            key={`${py}-${px}`}
            x={px * CELL_SIZE} y={py * CELL_SIZE}
            width={CELL_SIZE} height={CELL_SIZE}
            fill={valueToColor(v, min, max)}
          />
        ))
      )}
    </svg>
  );
}

function Slider({
  label, value, min, max,
  onChange,
}: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, width: 16, color: "var(--ink-mute)" }}>{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "var(--signal-warm)" }}
      />
      <span style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, width: 20, textAlign: "right", color: "var(--accent)" }}>{value}</span>
    </div>
  );
}

export default function WaveletFilterBank() {
  const [J, setJ] = useState(4);
  const [L, setL] = useState(8);
  const [tooltip, setTooltip] = useState<string | null>(null);

  const thetas = useMemo(
    () => Array.from({ length: L }, (_, i) => (i * Math.PI) / L),
    [L]
  );
  const js = useMemo(() => Array.from({ length: J }, (_, j) => j), [J]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Controls */}
      <div
        style={{
          padding: 16,
          border: "1px solid var(--rule)",
          backgroundColor: "var(--bg-elev)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 400,
        }}
      >
        <Slider label="J" value={J} min={1} max={6} onChange={setJ} />
        <Slider label="L" value={L} min={1} max={12} onChange={setL} />
      </div>

      {/* Grid */}
      <div>
        <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 10, color: "var(--ink-mute)", marginBottom: 8 }}>
          {J}×{L} filter bank · {J * L} wavelets
        </p>
        {tooltip && (
          <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--accent)", marginBottom: 6 }}>
            {tooltip}
          </p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {thetas.map((theta, l) => (
            <div key={l} style={{ display: "flex", gap: 2 }}>
              {js.map((j) => (
                <WaveletPatch
                  key={`${j}-${l}`}
                  j={j} theta={theta}
                  onHover={setTooltip}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <p style={{ fontFamily: "var(--font-jetbrains)", fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6 }}>
        The bank that the engine uses. Fixed analytic Morlets at log-spaced scales and
        uniformly-spaced orientations. Filters never change — that&#39;s the point.
      </p>
    </div>
  );
}
