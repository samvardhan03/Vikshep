import React, { useState } from 'react';
import { Download, BarChart3, Hash } from 'lucide-react';

function ThumbnailHeatmap({ maxpool, w, h }) {
  if (!maxpool || maxpool.length === 0) return null;
  const cols = w || 16;
  const rows = h || Math.ceil(maxpool.length / cols);
  const min = Math.min(...maxpool);
  const max = Math.max(...maxpool);
  const range = max - min || 1;
  const cellW = 100 / cols;
  const cellH = 100 / rows;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-28 rounded-lg">
      {maxpool.map((v, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const t = (v - min) / range;
        const r = Math.round(t * 30 + 14);
        const g = Math.round(t * 184 + 165);
        const b = Math.round((1 - t) * 166 + 100);
        return (
          <rect
            key={i}
            x={col * cellW}
            y={row * cellH}
            width={cellW}
            height={cellH}
            fill={`rgb(${r},${g},${b})`}
          />
        );
      })}
    </svg>
  );
}

function PreviewCard({ preview, onFetchFull }) {
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  async function handleFetch() {
    setFetching(true);
    setFetchError(null);
    try {
      await onFetchFull(preview.coeff_oid, 0);
    } catch (e) {
      setFetchError(e.message);
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center gap-2 mb-2 text-xs font-mono">
        <Hash size={12} className="text-teal-400" />
        <span className="text-slate-400 truncate w-40">{preview.coeff_oid}</span>
        <span className="ml-auto text-slate-500">
          dim={preview.dim} group={preview.group} {preview.exec_ms != null ? `${preview.exec_ms.toFixed(1)}ms` : ''}
        </span>
      </div>
      <ThumbnailHeatmap
        maxpool={preview.thumbnail?.maxpool ?? []}
        w={preview.thumbnail?.w}
        h={preview.thumbnail?.h}
      />
      {preview.summary && (
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[
            ['mean', preview.summary.mean?.toFixed(4)],
            ['std', preview.summary.std?.toFixed(4)],
            ['l2', preview.summary.l2?.toFixed(4)],
            ['paths', preview.summary.n_paths],
          ].map(([label, val]) => (
            <div key={label} className="text-center bg-slate-900 rounded p-1">
              <div className="text-teal-400 font-mono text-xs font-bold">{val ?? '–'}</div>
              <div className="text-slate-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={handleFetch}
        disabled={fetching}
        className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-bold py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:opacity-50 transition-colors"
      >
        <Download size={12} />
        {fetching ? 'Fetching…' : 'Fetch full coefficients'}
      </button>
      {fetchError && <p className="text-red-400 text-xs mt-1">{fetchError}</p>}
    </div>
  );
}

export function ScatteringVisualizer({ previews = [], fetchFullBlock }) {
  if (previews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
        <BarChart3 size={32} className="mb-2 opacity-40" />
        Waiting for scattering results…
      </div>
    );
  }
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
      {previews.map((p) => (
        <PreviewCard key={p.coeff_oid} preview={p} onFetchFull={fetchFullBlock} />
      ))}
    </div>
  );
}
