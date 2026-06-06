import React, { useState } from 'react';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import { usePreviewSocket } from './lib/usePreviewSocket';
import { PipelineVisualizer } from './PipelineVisualizer';
import { ScatteringVisualizer } from './ScatteringVisualizer';
import { FilterBankExplorer } from './explorers/FilterBankExplorer';
import { HnswGraphExplorer } from './explorers/HnswGraphExplorer';
import { PromptRouterStepper } from './explorers/PromptRouterStepper';
import { AutoscalerSimulator } from './explorers/AutoscalerSimulator';

const TABS = [
  { id: 'live',       label: 'Live Feed'      },
  { id: 'filterbank', label: 'Filter Bank'    },
  { id: 'hnsw',       label: 'HNSW Graph'     },
  { id: 'router',     label: 'Prompt Router'  },
  { id: 'scaler',     label: 'Autoscaler'     },
];

function TabBar({ active, onSelect }) {
  return (
    <div className="flex gap-1 border-b border-slate-700 px-4 overflow-x-auto">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${
            t.id === active
              ? 'border-teal-400 text-teal-300'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('live');
  const { previews, pipelineEvents, connected, fetchFullBlock } = usePreviewSocket();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-700 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-teal-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="font-bold text-base">Vikshep</span>
          <span className="text-slate-500 text-xs font-mono hidden sm:inline">control-plane dashboard</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          {connected
            ? <><Wifi size={13} className="text-teal-400" /><span className="text-teal-400">connected</span></>
            : <><WifiOff size={13} className="text-slate-500" /><span className="text-slate-500">no backend</span></>}
        </div>
      </header>

      {/* Tab bar */}
      <TabBar active={tab} onSelect={setTab} />

      {/* Content */}
      <main className="flex-1 overflow-auto">
        {tab === 'live' && (
          <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-700">
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Pipeline Events</h2>
              <PipelineVisualizer pipelineEvents={pipelineEvents} />
            </div>
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
                Scattering Previews
                <span className="ml-2 text-slate-600 normal-case">(thumbnails only — full block fetched on demand)</span>
              </h2>
              <ScatteringVisualizer previews={previews} fetchFullBlock={fetchFullBlock} />
            </div>
          </div>
        )}
        {tab === 'filterbank' && <FilterBankExplorer />}
        {tab === 'hnsw'       && <HnswGraphExplorer />}
        {tab === 'router'     && <PromptRouterStepper />}
        {tab === 'scaler'     && <AutoscalerSimulator />}
      </main>
    </div>
  );
}
