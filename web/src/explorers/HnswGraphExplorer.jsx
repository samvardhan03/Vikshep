import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Network, ToggleLeft, ToggleRight } from 'lucide-react';

// Deterministic LCG for reproducible baked fixture
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

const N_POINTS = 256;
const K = 5;
const SVG_SIZE = 300;

// Pre-generate baked point cloud
const baked = (() => {
  const rand = lcg(42);
  return Array.from({ length: N_POINTS }, (_, i) => ({
    id: i,
    x: rand() * 0.9 + 0.05,
    y: rand() * 0.9 + 0.05,
  }));
})();

function l2(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// Sliced Wasserstein ≈ average 1-D EMD along 8 projections
function sw1(a, b, allPoints) {
  const angles = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 8);
  let total = 0;
  for (const theta of angles) {
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const qa = a.x * cos + a.y * sin;
    const qb = b.x * cos + b.y * sin;
    // Approximate SW₁ by comparing sorted projections of neighbourhood
    const neighbourhood = allPoints
      .slice(0, 32) // use first 32 as reference distribution
      .map(p => p.x * cos + p.y * sin)
      .sort((x, y) => x - y);
    const rankA = neighbourhood.filter(v => v <= qa).length / 32;
    const rankB = neighbourhood.filter(v => v <= qb).length / 32;
    total += Math.abs(rankA - rankB);
  }
  return total / 8;
}

function knn(query, points, k, metric) {
  return points
    .map(p => ({ p, d: metric(query, p, points) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k)
    .map(x => x.p);
}

export function HnswGraphExplorer() {
  const [query, setQuery] = useState({ x: 0.5, y: 0.5 });
  const [useSW, setUseSW] = useState(false);
  const svgRef = useRef(null);

  const nn = useMemo(() => {
    const metric = useSW ? sw1 : l2;
    return knn(query, baked, K, metric);
  }, [query, useSW]);

  const nnL2 = useMemo(() => knn(query, baked, K, l2), [query]);
  const nnSW = useMemo(() => knn(query, baked, K, sw1), [query]);
  const recall = nnL2.filter(p => nnSW.find(q => q.id === p.id)).length;

  const toSvg = (v) => v * SVG_SIZE;

  const handleMouseMove = useCallback((e) => {
    if (!(e.buttons & 1)) return;
    const rect = svgRef.current.getBoundingClientRect();
    setQuery({
      x: Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height)),
    });
  }, []);

  const handleClick = useCallback((e) => {
    const rect = svgRef.current.getBoundingClientRect();
    setQuery({
      x: Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height)),
    });
  }, []);

  const nnIds = new Set(nn.map(p => p.id));

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network size={16} className="text-teal-400" />
          <span className="text-slate-200 font-bold text-sm">HNSW Graph Explorer</span>
        </div>
        <button
          onClick={() => setUseSW(v => !v)}
          className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
        >
          {useSW
            ? <><ToggleRight size={14} className="text-teal-400" /> SW₁</>
            : <><ToggleLeft size={14} className="text-slate-400" /> L2</>}
        </button>
      </div>

      <p className="text-slate-500 text-xs">Click or drag inside the graph to move the query point.</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="w-full bg-slate-900 rounded-xl cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {/* NN edges */}
        {nn.map(p => (
          <line
            key={p.id}
            x1={toSvg(query.x)} y1={toSvg(query.y)}
            x2={toSvg(p.x)} y2={toSvg(p.y)}
            stroke={useSW ? '#818cf8' : '#2dd4bf'}
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
        {/* All points */}
        {baked.map(p => (
          <circle
            key={p.id}
            cx={toSvg(p.x)} cy={toSvg(p.y)}
            r={nnIds.has(p.id) ? 4 : 2}
            fill={nnIds.has(p.id) ? (useSW ? '#818cf8' : '#2dd4bf') : '#334155'}
            opacity={nnIds.has(p.id) ? 1 : 0.7}
          />
        ))}
        {/* Query point */}
        <circle cx={toSvg(query.x)} cy={toSvg(query.y)} r={6} fill="#f59e0b" stroke="#fbbf24" strokeWidth="1.5" />
      </svg>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className="text-amber-400 font-mono font-bold text-lg">{K}</div>
          <div className="text-slate-500 text-xs">k neighbours</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className={`font-mono font-bold text-lg ${useSW ? 'text-indigo-400' : 'text-teal-400'}`}>
            {useSW ? 'SW₁' : 'L2'}
          </div>
          <div className="text-slate-500 text-xs">metric</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className={`font-mono font-bold text-lg ${recall === K ? 'text-teal-400' : 'text-amber-400'}`}>
            {recall}/{K}
          </div>
          <div className="text-slate-500 text-xs">SW₁∩L2 recall</div>
        </div>
      </div>

      <p className="text-slate-600 text-xs">
        {N_POINTS} baked 2-D points. SW₁ uses 8-projection sliced Wasserstein approximation.
        Recall measures agreement between SW₁ and L2 k-NN sets.
      </p>
    </div>
  );
}
