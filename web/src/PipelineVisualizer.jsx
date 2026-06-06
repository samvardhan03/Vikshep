import React from 'react';
import { CheckCircle2, XCircle, Loader2, ArrowDown } from 'lucide-react';

const STATUS_STYLE = {
  start:  { icon: Loader2,      color: 'text-amber-400',  bg: 'bg-amber-900/30',  border: 'border-amber-700/40' },
  done:   { icon: CheckCircle2, color: 'text-teal-400',   bg: 'bg-teal-900/30',   border: 'border-teal-700/40'  },
  error:  { icon: XCircle,      color: 'text-red-400',    bg: 'bg-red-900/30',    border: 'border-red-700/40'   },
};

function PipelineNode({ event }) {
  const s = STATUS_STYLE[event.status] ?? STATUS_STYLE.start;
  const Icon = s.icon;
  const meta = [
    event.dim   ? `dim=${event.dim}`   : null,
    event.group ? `group=${event.group}` : null,
    event.exec_ms != null ? `${event.exec_ms.toFixed(1)}ms` : null,
  ].filter(Boolean).join('  ');

  return (
    <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${s.bg} ${s.border}`}>
      <Icon size={16} className={`${s.color} mt-0.5 shrink-0 ${event.status === 'start' ? 'animate-spin' : ''}`} />
      <div className="min-w-0">
        <span className={`font-mono text-sm font-bold ${s.color}`}>{event.node}</span>
        {meta && <span className="ml-3 text-slate-500 text-xs font-mono">{meta}</span>}
      </div>
    </div>
  );
}

export function PipelineVisualizer({ pipelineEvents = [] }) {
  if (pipelineEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm">
        <ArrowDown size={24} className="mb-2 opacity-40" />
        No pipeline events yet
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {pipelineEvents.map((ev, i) => (
        <PipelineNode key={i} event={ev} />
      ))}
    </div>
  );
}
