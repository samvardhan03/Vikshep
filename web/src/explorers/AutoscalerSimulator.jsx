import React, { useState, useMemo } from 'react';
import { Server, Activity } from 'lucide-react';

// Erlang-C formula: probability that an arriving call waits (P(wait > 0))
// a = offered load (λ/μ), c = servers
function erlangC(c, a) {
  if (a >= c) return 1;
  // Compute P0 via Poisson summation
  let sum = 0;
  let term = 1;
  for (let k = 1; k <= c; k++) term *= a / k;
  const lastTerm = term; // a^c / c!
  for (let k = 0; k < c; k++) {
    let t = 1;
    for (let j = 1; j <= k; j++) t *= a / j;
    sum += t;
  }
  const denom = sum + lastTerm * (c / (c - a));
  const p0 = 1 / denom;
  return (lastTerm * (c / (c - a)) * p0);
}

// Minimum pods needed to keep P(wait) < threshold
function autoScalePods(lambda, mu, maxRho = 0.8) {
  const a = lambda / mu;
  const minC = Math.max(1, Math.ceil(a));
  for (let c = minC; c <= minC + 20; c++) {
    const rho = a / c;
    if (rho < maxRho) return c;
  }
  return minC + 20;
}

function Slider({ label, value, min, max, step = 1, fmt = v => v, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs font-mono w-20 shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-teal-500 h-1"
      />
      <span className="text-teal-300 text-xs font-mono w-16 text-right shrink-0">{fmt(value)}</span>
    </div>
  );
}

function PodGrid({ pods, maxPods = 20 }) {
  const cells = Array.from({ length: Math.min(maxPods, 32) }, (_, i) => i < pods);
  return (
    <div className="flex flex-wrap gap-1.5">
      {cells.map((active, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded transition-colors duration-300 flex items-center justify-center ${active ? 'bg-teal-500' : 'bg-slate-700'}`}
        >
          {active && <Server size={10} className="text-white" />}
        </div>
      ))}
      {pods > maxPods && <span className="text-slate-500 text-xs font-mono">+{pods - maxPods}</span>}
    </div>
  );
}

export function AutoscalerSimulator() {
  const [lambda, setLambda] = useState(100);   // events/sec
  const [execMs, setExecMs] = useState(20);    // ms per event

  const metrics = useMemo(() => {
    const mu = 1000 / execMs;                  // events/sec per pod
    const pods = autoScalePods(lambda, mu, 0.8);
    const a = lambda / mu;
    const rho = a / pods;
    const ec = erlangC(pods, a);
    const avgWait = rho >= 1 ? Infinity : ec / (pods * mu * (1 - rho));   // seconds
    const p95 = execMs / 1000 + (rho < 1 ? avgWait * 2.3 : 10);           // rough P95
    const queueDepth = rho < 1 ? ec * rho / (1 - rho) : lambda / mu * 10;
    return { pods, rho, queueDepth, p95Ms: p95 * 1000 };
  }, [lambda, execMs]);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={16} className="text-teal-400" />
        <span className="text-slate-200 font-bold text-sm">Autoscaler Simulator</span>
      </div>

      <div className="space-y-3 bg-slate-900 rounded-xl p-4">
        <Slider label="λ (events/s)" value={lambda} min={10} max={1000} step={10}
          fmt={v => `${v}/s`} onChange={setLambda} />
        <Slider label="exec_ms" value={execMs} min={1} max={100} step={1}
          fmt={v => `${v}ms`} onChange={setExecMs} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className="text-teal-400 font-mono font-bold text-2xl">{metrics.pods}</div>
          <div className="text-slate-500 text-xs">GPU pods</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className={`font-mono font-bold text-2xl ${metrics.rho > 0.85 ? 'text-red-400' : metrics.rho > 0.7 ? 'text-amber-400' : 'text-teal-400'}`}>
            {(metrics.rho * 100).toFixed(0)}%
          </div>
          <div className="text-slate-500 text-xs">utilisation ρ</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className="text-indigo-400 font-mono font-bold text-2xl">
            {metrics.queueDepth.toFixed(1)}
          </div>
          <div className="text-slate-500 text-xs">queue depth</div>
        </div>
        <div className="bg-slate-900 rounded-xl p-3 text-center">
          <div className={`font-mono font-bold text-2xl ${metrics.p95Ms > 200 ? 'text-red-400' : 'text-teal-400'}`}>
            {metrics.p95Ms > 9999 ? '∞' : `${metrics.p95Ms.toFixed(0)}ms`}
          </div>
          <div className="text-slate-500 text-xs">P95 latency</div>
        </div>
      </div>

      <div>
        <p className="text-slate-500 text-xs mb-2 font-mono">GPU pod grid (active = teal)</p>
        <PodGrid pods={metrics.pods} />
      </div>

      <p className="text-slate-600 text-xs">
        M/M/c queue model. Pods scale until ρ &lt; 0.8 (Erlang-C).
        P95 ≈ exec_ms + avg_wait × 2.3.
      </p>
    </div>
  );
}
