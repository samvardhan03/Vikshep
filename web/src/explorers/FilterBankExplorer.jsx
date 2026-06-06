import React, { useState, useMemo } from 'react';
import { SlidersHorizontal } from 'lucide-react';

// Morlet frequency response: Gaussian in log-frequency centred at log2(centerFreq)
function morletResponse(logFreq, centerLogFreq, Q) {
  const sigma = 1 / (Q * Math.SQRT2);
  const d = (logFreq - centerLogFreq) / sigma;
  return Math.exp(-0.5 * d * d);
}

// Low-pass phi response: Gaussian at low freq with scale 2^J
function lowpassResponse(logFreq, J) {
  const sigma = 0.5;
  return Math.exp(-0.5 * ((logFreq + J) / sigma) ** 2);
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs font-mono w-4">{label}</span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-teal-500 h-1"
      />
      <span className="text-teal-300 text-xs font-mono w-5 text-right">{value}</span>
    </div>
  );
}

export function FilterBankExplorer() {
  const [J, setJ] = useState(4);
  const [Q, setQ] = useState(8);
  const [L, setL] = useState(4);

  const N_FREQS = 200;
  const LOG_MIN = -8;
  const LOG_MAX = 2;

  // Compute filter bank energy at each log-frequency bin
  const { bankData, parseval, pathCount1, pathCount2 } = useMemo(() => {
    const logFreqs = Array.from({ length: N_FREQS }, (_, i) =>
      LOG_MIN + (i / (N_FREQS - 1)) * (LOG_MAX - LOG_MIN)
    );

    // Each wavelet centred at log2(ξ) = -j - q/Q, j in [0,J), q in [1,Q]
    const wavelets = [];
    for (let j = 0; j < J; j++) {
      for (let q = 1; q <= Q; q++) {
        const ctr = -(j + (q - 1) / Q);
        wavelets.push({ j, q, ctr });
      }
    }

    // Bank energy at each frequency
    const bankData = logFreqs.map(lf => {
      let energy = 0;
      for (const w of wavelets) energy += morletResponse(lf, w.ctr, Q) ** 2;
      energy += lowpassResponse(lf, J) ** 2;
      return { lf, energy };
    });

    // Parseval score: average of energy array (ideal = 1.0)
    const parseval = bankData.reduce((s, d) => s + d.energy, 0) / N_FREQS;

    const pathCount1 = J * Q;
    const pathCount2 = Math.floor(J * Q * (J * Q - 1) / 2);

    return { bankData, parseval: Math.min(parseval, 2), pathCount1, pathCount2 };
  }, [J, Q, L]);

  // SVG path for energy curve
  const svgW = 500;
  const svgH = 120;
  const path = bankData.map((d, i) => {
    const x = (i / (N_FREQS - 1)) * svgW;
    const y = svgH - Math.min(d.energy, 2) / 2 * svgH * 0.9;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');

  // Oriented Morlet mini-grid (L orientations of a 2-D wavelet)
  const orients = Array.from({ length: L }, (_, i) => (i * Math.PI) / L);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal size={16} className="text-teal-400" />
        <span className="text-slate-200 font-bold text-sm">Filter Bank Explorer</span>
      </div>

      <div className="space-y-3 bg-slate-900 rounded-xl p-4">
        <Slider label="J" value={J} min={1} max={8} onChange={setJ} />
        <Slider label="Q" value={Q} min={1} max={16} onChange={setQ} />
        <Slider label="L" value={L} min={1} max={16} onChange={setL} />
      </div>

      {/* Frequency-domain energy plot */}
      <div>
        <p className="text-slate-500 text-xs mb-2 font-mono">Energy ∑|ψ̂(ω)|² + |φ̂(ω)|² (log-freq axis)</p>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-28 bg-slate-900 rounded-xl">
          <line x1="0" y1={svgH * 0.55} x2={svgW} y2={svgH * 0.55} stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <path d={path} fill="none" stroke="#2dd4bf" strokeWidth="2" />
          <text x="4" y="12" fill="#64748b" fontSize="9" fontFamily="monospace">2.0</text>
          <text x="4" y={svgH * 0.55 - 2} fill="#64748b" fontSize="9" fontFamily="monospace">1.0</text>
          <text x="4" y={svgH - 2} fill="#64748b" fontSize="9" fontFamily="monospace">0</text>
        </svg>
      </div>

      {/* Parseval bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400 font-mono">Parseval energy (avg / ideal 1.0)</span>
          <span className="text-teal-300 font-mono font-bold">{parseval.toFixed(3)}</span>
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${parseval > 0.85 ? 'bg-teal-500' : parseval > 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(parseval, 1) * 100}%` }}
          />
        </div>
      </div>

      {/* Path counts */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className="text-teal-400 font-mono font-bold text-xl">{pathCount1}</div>
          <div className="text-slate-500 text-xs">1st-order paths (J×Q)</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className="text-indigo-400 font-mono font-bold text-xl">{pathCount2}</div>
          <div className="text-slate-500 text-xs">2nd-order pairs</div>
        </div>
      </div>

      {/* Oriented wavelets mini-grid */}
      <div>
        <p className="text-slate-500 text-xs mb-2 font-mono">{L} oriented Morlet filters (2-D, group SO(2))</p>
        <div className="flex flex-wrap gap-2">
          {orients.map((theta, i) => {
            const cos = Math.cos(theta);
            const sin = Math.sin(theta);
            const pts = Array.from({ length: 40 }, (_, k) => {
              const t = (k / 39) * 4 - 2;
              const gauss = Math.exp(-0.5 * t * t);
              const wave = Math.cos(t * 4) * gauss;
              const x = 18 + (t * cos - wave * sin * 0.5) * 6;
              const y = 18 + (t * sin + wave * cos * 0.5) * 6;
              return `${k === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(' ');
            return (
              <svg key={i} viewBox="0 0 36 36" className="w-8 h-8 bg-slate-900 rounded-lg">
                <path d={pts} fill="none" stroke="#818cf8" strokeWidth="1.5" />
              </svg>
            );
          })}
        </div>
      </div>
    </div>
  );
}
