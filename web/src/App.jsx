import React from 'react';
import { BrainCircuit, Activity, Shrink, Zap, ShieldAlert, Cpu, Github, Package, CheckCircle2, Factory, Mail } from 'lucide-react';
import { PipelineVisualizer } from './PipelineVisualizer';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-8 transition-all duration-300 hover:border-blue-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-50/60">
    <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 border border-blue-100 text-blue-600 shadow-sm shadow-blue-50">
      <Icon size={26} strokeWidth={2} />
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed font-medium">{description}</p>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
              <Activity className="text-white" size={20} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">OmniPulse</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <a href="#pipeline" className="hover:text-blue-600 transition-colors">Pipeline</a>
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#enterprise" className="hover:text-blue-600 transition-colors">Integration</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden flex flex-col items-center bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-bold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            v0.1.0 Released on PyPI
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900">
            Domain-Agnostic <br/>
            <span className="text-blue-600">Signal Intelligence.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-700 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            Agentic Model Context Protocol (MCP) for Universal Transient Signal Processing. OmniPulse brings translation-invariant mathematical rigor to EEG and astrophysical arrays.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://github.com/samvardhan03/OmniPulse" target="_blank" rel="noreferrer" className="h-14 px-8 rounded-full bg-slate-900 text-white font-bold flex items-center gap-2 shadow-lg shadow-slate-200 hover:shadow-slate-300 hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center">
              View on GitHub <Github size={18} />
            </a>
            <a href="https://pypi.org/project/omnipulse/" target="_blank" rel="noreferrer" className="h-14 px-8 rounded-full bg-white border-2 border-slate-200 text-blue-600 font-bold flex items-center gap-2 hover:bg-slate-50 hover:border-blue-200 shadow-sm transition-all w-full sm:w-auto justify-center">
              View on PyPI <Package size={18} />
            </a>
          </div>
        </div>
      </section>

      {/* Visual Diagram Section */}
      <section id="pipeline" className="py-24 px-6 relative z-10 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">The Decoupled Architecture</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
              TypeScript orchestrates the heuristics. PyTorch and Kymatio handle the wavelets.
            </p>
          </div>
          <PipelineVisualizer />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative z-10 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">Core Engine Capabilities</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
              Enterprise-grade signal decomposition mapped natively to autonomous workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Activity}
              title="Kymatio WST"
              description="Cascaded Wavelet Scattering Transforms extracting non-stationary transients from extreme high-noise environments."
            />
            <FeatureCard 
              icon={Shrink}
              title="Manifold Compression"
              description="Algorithmic dimensionality reduction to a compact K-dimensional plane retaining 95% of statistical variance."
            />
            <FeatureCard 
              icon={BrainCircuit}
              title="Agentic Orchestrator"
              description="Dynamic TS-powered LLM loops managing mathematical transformations and JSON schema payload parsing."
            />
            <FeatureCard 
              icon={ShieldAlert}
              title="Anomaly Thresholds"
              description="Dual-mode rejection utilizing rigorous 'mean + 3σ' statistical gating to autonomously flag corruption streams."
            />
            <FeatureCard 
              icon={Zap}
              title="MCP Tool Linking"
              description="Type-safe bridging isolating Node.js process state from the underlying Python mathematical engine."
            />
            <FeatureCard 
              icon={Cpu}
              title="Foundation Extensibility"
              description="Ready for PyTorch contrastive alignments. Easily project temporal data arrays into generalized transformer spaces."
            />
          </div>
        </div>
      </section>

      {/* Enterprise Consulting */}
      <section id="enterprise" className="py-24 px-6 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900">Integration Tiers</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg font-medium">
              Flexible deployments for independent researchers or massive industrial clusters.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-10 flex flex-col shadow-sm">
              <h3 className="text-2xl font-bold mb-2 text-slate-900">Community (Apache 2.0)</h3>
              <p className="text-slate-600 mb-8 font-medium">For researchers and independent developers.</p>
              <div className="text-5xl font-extrabold mb-8 text-slate-900">$0<span className="text-xl text-slate-500 font-bold">/forever</span></div>
              <ul className="space-y-5 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="text-blue-600" size={24}/> Core Python Engine (PyPI)</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="text-blue-600" size={24}/> TypeScript Orchestrator Agent</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="text-blue-600" size={24}/> Standard MCP Documentation</li>
                <li className="flex items-center gap-3 text-slate-700 font-medium"><CheckCircle2 className="text-blue-600" size={24}/> GitHub Community Support</li>
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="bg-white border-2 border-indigo-600 rounded-3xl p-10 flex flex-col relative shadow-xl shadow-indigo-100">
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl rounded-tr-3xl uppercase tracking-wider">
                Lab / Enterprise
              </div>
              <h3 className="text-2xl font-bold mb-2 text-slate-900">Lab & Enterprise Integration</h3>
              <p className="text-slate-600 mb-8 font-medium">For Exascale astrophysics and clinical deployments.</p>
              <div className="text-5xl font-extrabold mb-8 text-indigo-600">Custom</div>
              <ul className="space-y-5 mb-10 flex-grow">
                <li className="flex items-center gap-3 text-slate-900 font-bold"><Factory className="text-indigo-600" size={24}/> Proprietary Data Ingestion Pipelines</li>
                <li className="flex items-center gap-3 text-slate-900 font-bold"><BrainCircuit className="text-indigo-600" size={24}/> Custom Quantum Kernel Integrations</li>
                <li className="flex items-center gap-3 text-slate-900 font-bold"><Cpu className="text-indigo-600" size={24}/> Exascale Multi-Node Orchestration</li>
                <li className="flex items-center gap-3 text-slate-900 font-bold"><ShieldAlert className="text-indigo-600" size={24}/> SLA & Dedicated Support</li>
              </ul>
              <a href="mailto:shekhawatsamvardhan@gmail.com" className="w-full h-14 bg-indigo-600 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors shadow-md">
                <Mail size={18}/> Contact for Implementation
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row text-center justify-between items-center gap-4 text-slate-600 text-sm font-medium">
          <div className="flex items-center gap-2 justify-center">
             <Activity size={18} className="text-blue-600" />
             <span className="font-bold text-slate-900 text-lg">OmniPulse</span>
          </div>
          <p>&copy; 2026 Samvardhan Singh. Released under the Apache 2.0 License.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
