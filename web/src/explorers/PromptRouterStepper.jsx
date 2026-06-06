import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, MessageSquare, GitBranch, Terminal, Hash } from 'lucide-react';

const FIXTURES = [
  {
    prompt: 'Tag these jets and decorrelate mass from the classifier score',
    recipe: 'hep-tagging-disco',
    steps: [
      { tool: 'compute_scattering', args: { input_oid: '…28hex…', signal_len: 4096, cfg: { dim: '2', group: 'so2', J: 4, Q: 8, L: 8 } } },
      { tool: 'reduce_scattering',  args: { coeff_oid: '…28hex…', method: 'ratio' } },
      { tool: 'run_classifier',     args: { feature_oid: '…28hex…' } },
    ],
    result: { coeff_oid: 'a3f9c1d2e4b5067891234567abcd', exec_ms: 18.4 },
  },
  {
    prompt: 'Detect BSM anomalies — model-independent search for new physics',
    recipe: 'bsm-anomaly',
    steps: [
      { tool: 'compute_scattering', args: { input_oid: '…28hex…', signal_len: 4096, cfg: { dim: '2', group: 'so2', J: 4, Q: 8, L: 8 } } },
      { tool: 'reduce_scattering',  args: { coeff_oid: '…28hex…', method: 'ratio' } },
      { tool: 'detect_anomaly',     args: { query_oid: '…28hex…', tau: 0.42, k: 10 } },
    ],
    result: { is_anomaly: true, distance: 0.617, nearest_oid: 'b2c3d4e5f6a7890123456789abcd' },
  },
  {
    prompt: 'Extract scattering features from this plasma volume, dim=3, group=so3',
    recipe: 'general-feature',
    steps: [
      { tool: 'compute_scattering', args: { input_oid: '…28hex…', signal_len: 8192, cfg: { dim: '3', group: 'so3', J: 3, Q: 4 } } },
      { tool: 'reduce_scattering',  args: { coeff_oid: '…28hex…', method: 'mean' } },
    ],
    result: { coeff_oid: 'd4e5f6a7b8c9012345678901abcd', exec_ms: 32.1 },
  },
  {
    prompt: 'Run a general scattering feature extraction on this HDF5 dataset',
    recipe: 'general-feature',
    steps: [
      { tool: 'compute_scattering', args: { input_oid: '…28hex…', signal_len: 2048, cfg: { dim: '1', group: 'trivial', J: 6, Q: 16 } } },
      { tool: 'reduce_scattering',  args: { coeff_oid: '…28hex…', method: 'log_mean' } },
    ],
    result: { coeff_oid: 'e5f6a7b8c9d0123456789012abcd', exec_ms: 9.7 },
  },
];

const RECIPE_COLOR = {
  'hep-tagging-disco': 'text-teal-400 bg-teal-900/30 border-teal-700/40',
  'bsm-anomaly':       'text-indigo-400 bg-indigo-900/30 border-indigo-700/40',
  'general-feature':   'text-amber-400 bg-amber-900/30 border-amber-700/40',
};

const STAGES = ['Prompt', 'Recipe', 'Tool sequence', 'Result'];

export function PromptRouterStepper() {
  const [fixtureIdx, setFixtureIdx] = useState(0);
  const [stage, setStage] = useState(0);
  const f = FIXTURES[fixtureIdx];

  function next() { setStage(s => Math.min(s + 1, STAGES.length - 1)); }
  function prev() { setStage(s => Math.max(s - 1, 0)); }
  function selectFixture(i) { setFixtureIdx(i); setStage(0); }

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare size={16} className="text-teal-400" />
        <span className="text-slate-200 font-bold text-sm">Prompt Router Stepper</span>
      </div>

      {/* Fixture selector */}
      <div className="flex gap-2 flex-wrap">
        {FIXTURES.map((fx, i) => (
          <button
            key={i}
            onClick={() => selectFixture(i)}
            className={`text-xs px-3 py-1 rounded-full font-mono transition-colors ${
              i === fixtureIdx ? 'bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {fx.recipe}
          </button>
        ))}
      </div>

      {/* Stage indicators */}
      <div className="flex gap-1">
        {STAGES.map((s, i) => (
          <div key={s} className={`flex-1 h-1 rounded-full transition-all ${i <= stage ? 'bg-teal-500' : 'bg-slate-700'}`} />
        ))}
      </div>

      {/* Stage content */}
      <div className="bg-slate-900 rounded-xl p-4 min-h-36">
        {stage === 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-mono uppercase">
              <MessageSquare size={12} /> User prompt
            </div>
            <p className="text-slate-200 text-sm font-medium leading-relaxed">"{f.prompt}"</p>
          </div>
        )}

        {stage === 1 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-mono uppercase">
              <GitBranch size={12} /> Recipe selected
            </div>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono font-bold ${RECIPE_COLOR[f.recipe] ?? 'text-slate-300 bg-slate-800 border-slate-700'}`}>
              {f.recipe}
            </div>
            <p className="text-slate-500 text-xs mt-3">
              Keyword match on: {f.prompt.toLowerCase()}
            </p>
          </div>
        )}

        {stage === 2 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-mono uppercase">
              <Terminal size={12} /> JSON-RPC tool sequence
            </div>
            <div className="space-y-2">
              {f.steps.map((step, i) => (
                <div key={i} className="bg-slate-800 rounded-lg p-3 font-mono text-xs">
                  <span className="text-teal-400 font-bold">{step.tool}</span>
                  <pre className="text-slate-400 mt-1 overflow-x-auto">
                    {JSON.stringify(step.args, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === 3 && (
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 font-mono uppercase">
              <Hash size={12} /> Result (OID — no tensors)
            </div>
            <pre className="bg-slate-800 rounded-lg p-3 font-mono text-xs text-teal-300 overflow-x-auto">
              {JSON.stringify(f.result, null, 2)}
            </pre>
            <p className="text-slate-600 text-xs mt-2">
              Full coefficients remain in POSIX shm, referenced only by the 28-hex handle.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={prev} disabled={stage === 0}
          className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
          <ChevronLeft size={16} /> Back
        </button>
        <span className="text-slate-600 text-xs font-mono">{STAGES[stage]}</span>
        <button onClick={next} disabled={stage === STAGES.length - 1}
          className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-white disabled:opacity-30 transition-colors">
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
