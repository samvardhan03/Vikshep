import CodeBlock from "@/components/CodeBlock";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";
import ModuleStackBadges from "@/components/ModuleStackBadges";
import RecipeCard from "@/components/RecipeCard";
import UseCaseCard from "@/components/UseCaseCard";
import MathBlock from "@/components/MathBlock";
import MassSculptingKiller from "@/components/visualizations/MassSculptingKiller";
import ProblemSection from "@/components/ProblemSection";
import ScatteringCascade from "@/components/visualizations/ScatteringCascade";
import R2Invariance from "@/components/visualizations/R2Invariance";
import WaveletFilterBank from "@/components/visualizations/WaveletFilterBank";
import DeformationStability from "@/components/visualizations/DeformationStability";
import AnomalyEmbedding from "@/components/visualizations/AnomalyEmbedding";

// ── shared style helpers ──────────────────────────────────────────
const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 14,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  lineHeight: 1.4,
  color: "var(--accent)",
};

const sectionH2: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(28px,3.6vw,52px)",
  lineHeight: 1.1,
  color: "var(--ink)",
};

const wrapper = (border = true): React.CSSProperties => ({
  padding: "96px 0",
  borderBottom: border ? "1px solid var(--rule)" : "none",
});

const inner: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};

// ── founders data ─────────────────────────────────────────────────
const FOUNDERS = [
  {
    name: "Samvardhan Singh",
    eyebrow: "ARCHITECT — APPLIED AI / MLOPS",
    role: "Automation Engineering & AI/MLOps Research, NielsenIQ",
    focus: "Automation engineering, AI/MLOps pipelines, engineering outcomes.",
    sectionLabel: "Maintains" as const,
    items: [
      { label: "omni-wst-core", note: "C++/CUDA DSP engine", href: "https://pypi.org/project/omni-wst-core/" },
      { label: "omni-ffi", note: "cxx zero-copy FFI bridge", href: "https://crates.io/crates/omni-ffi" },
      { label: "omnipulse-agent", note: "Python agentic control plane (PyPI)", href: "https://pypi.org/project/omnipulse-agent/" },
    ],
    portfolio: "https://samvardhan.vercel.app/",
    email: "shekhawatsamvardhan@gmail.com",
    linkedin: null as string | null,
  },
  {
    name: "Yash Mishra",
    eyebrow: "ARCHITECT — SYSTEMS / OPTIMAL TRANSPORT",
    role: "Senior Software Engineer, Bajaj Finserv",
    focus: "Concurrent systems, optimal transport, real-time indexing logic.",
    sectionLabel: "Maintains" as const,
    items: [
      { label: "vector-index", note: "Concurrent HNSW", href: "https://crates.io/crates/vector-index" },
      { label: "sliced-wasserstein", note: "SW₁ distance metric for HNSW", href: "https://crates.io/crates/sliced-wasserstein" },
    ],
    portfolio: null as string | null,
    email: "yash01012002@gmail.com",
    linkedin: "https://www.linkedin.com/in/mishra-yash2002/",
  },
  {
    name: "Komal Papanwar",
    eyebrow: "RESEARCH PARTNER — ATLAS / DIBOSON PILOT",
    role: "MS Nuclear & Particle Physics, University of Edinburgh",
    focus: "Leads the ATLAS boosted di-boson resonance pilot analysis on Geant4-simulated data.",
    sectionLabel: "Leads" as const,
    items: [
      { label: "Edinburgh pilot", note: "ATLAS boosted di-boson resonance search", href: "/pilot" },
    ],
    portfolio: null as string | null,
    email: "kpapanwar@gmail.com",
    linkedin: "https://www.linkedin.com/in/komal-papanwar-170208251/",
  },
];

// ── quickstart steps ──────────────────────────────────────────────
const QUICKSTART = `# 1. Install the engine (binary wheel)
pip install vikshep

# 2. Install the Rust orchestrator
cargo install omnipulse-mcp

# 3. Run a recipe
export OMNIPULSE_MCP_BIN=$(which omnipulse-mcp)
bun run vikshep/agent/src/main.ts process \\
  --input data/jets.root \\
  --recipe hep-tagging-disco`;

// ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <>
      {/* 2.1 — Hero */}
      <section style={{ ...wrapper(), paddingTop: 112 }}>
        <div style={inner}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12,1fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div
              style={{
                gridColumn: "span 12",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
              className="md:col-span-8"
            >
              <p style={eyebrow}>Scientific compute infrastructure</p>
              <h1
                style={{
                  fontFamily: "var(--font-source-serif), Georgia, serif",
                  fontWeight: 300,
                  fontSize: "clamp(48px,6.4vw,100px)",
                  lineHeight: 1.02,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                Black-box ML sculpts the backgrounds it measures.{" "}
                <span style={{ color: "var(--ink-mute)", fontStyle: "italic" }}>
                  We rebuilt the substrate.
                </span>
              </h1>
              <p
                style={{
                  fontSize: 19,
                  lineHeight: 1.55,
                  color: "var(--ink-mute)",
                  maxWidth: 640,
                }}
              >
                Vikshep is a deterministic, deformation-stable feature-extraction plane for physics
                analyses. Mass-decorrelated jet tagging, template-free BSM anomaly detection, and
                rotation-invariant field inference — on-prem, GPU-accelerated, MCP-native.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                <CodeBlock copyable>pip install vikshep</CodeBlock>
                <a
                  href="https://github.com/samvardhan03/Vikshep"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 13,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  View on GitHub ↗
                </a>
                <a
                  href="/math"
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 13,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  Read the math ↗
                </a>
                <a
                  href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20inquiry"
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 13,
                    color: "var(--bg)",
                    backgroundColor: "var(--ink)",
                    padding: "6px 14px",
                    textDecoration: "none",
                  }}
                >
                  Talk to founders →
                </a>
              </div>
              <ModuleStackBadges />
            </div>
          </div>
        </div>
      </section>

      {/* 2.2 — The problem */}
      <section style={wrapper()}>
        <div style={inner}>
          <ProblemSection />
        </div>
      </section>

      {/* 2.3 — The solution */}
      <section style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Two ideas, one guarantee</p>
          <h2 style={{ ...sectionH2, maxWidth: 760, marginBottom: 40 }}>
            Deterministic features. Closed-form decorrelation. Reusable across every scientific domain.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 1,
              backgroundColor: "var(--rule)",
            }}
          >
            {/* Card A — Deterministic feature extraction + ScatteringCascade */}
            <div style={{ padding: 28, backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 28, color: "var(--accent)", fontFamily: "var(--font-serif), Georgia, serif" }}>ψ</span>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300, fontSize: 20, color: "var(--ink)", lineHeight: 1.25 }}>
                Deterministic feature extraction
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-mute)" }}>
                The wavelet scattering transform produces a complete, multiscale, oriented description of the radiation
                pattern inside a jet (or any signal). Filters are fixed analytic Morlets; the cascade structure provides
                translation invariance and Lipschitz-bounded stability to deformation. No learned weights means no mass
                leakage by construction. r₂ = S₂ / S₁ is dimensionless and scale-invariant — the substructure observable, generalized.
              </p>
              <ScatteringCascade />
            </div>

            {/* Card B — Mathematical decorrelation + R2Invariance */}
            <div style={{ padding: 28, backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 28, color: "var(--accent)", fontFamily: "var(--font-serif), Georgia, serif" }}>⟂</span>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300, fontSize: 20, color: "var(--ink)", lineHeight: 1.25 }}>
                Mathematical decorrelation
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-mute)" }}>
                A weighted distance-correlation penalty enforces statistical independence between the tagger output and
                the resonance mass on background events. dCorr(ŷ, m | bkg) = 0 ⟺ the score cut removes background
                uniformly in mass ⟺ the background shape is preserved exactly. Not a heuristic. A closed-form guarantee.
              </p>
              <R2Invariance />
            </div>

            {/* Card C — One engine, every dimension */}
            <div style={{ padding: 28, backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ fontSize: 28, color: "var(--accent)", fontFamily: "var(--font-serif), Georgia, serif" }}>⊗</span>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300, fontSize: 20, color: "var(--ink)", lineHeight: 1.25 }}>
                One engine, every dimension
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-mute)" }}>
                The same templated kernel handles 1-D time series, 2-D detector images, and 3-D volumes. Oriented Morlet
                wavelets for SE(2) roto-translation. Solid-harmonic wavelets for SO(3) rotation. The (Dim, Group, J, Q, L)
                parameters are runtime config in the MCP tool schema — not a rebuild. ATLAS jet tagging, weak-lensing maps,
                plasma simulation fields: same binary.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2.3b — Wavelet filter bank */}
      <section style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>The filter bank</p>
          <h2 style={{ ...sectionH2, maxWidth: 640, marginBottom: 12 }}>
            J scales, L orientations — fixed by design.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-mute)", maxWidth: 560, marginBottom: 32 }}>
            Each cell shows the energy of one Morlet wavelet basis function in (scale j, orientation θ) space.
            The bank is computed once at startup; no learning, no adaptation. Toggle J and L to explore the coverage.
          </p>
          <WaveletFilterBank />
        </div>
      </section>

      {/* 2.4 — Mass-sculpting killer demo */}
      <section id="mass-sculpting" style={wrapper()}>
        <div style={inner}>
          <p style={eyebrow}>The mass-sculpting problem</p>
          <h2 style={{ ...sectionH2, marginBottom: 12 }}>
            NN taggers sculpt. r₂ doesn't.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink-mute)", maxWidth: 580, marginBottom: 32 }}>
            Every standard jet classifier correlates with m_jj — cutting on it deforms the
            background mass spectrum, creating fake bumps. The scattering ratio r₂ = S₂/S₁ is
            dimensionless and mass-decorrelated by construction. DisCo makes it rigorous.
          </p>
          <MassSculptingKiller />
        </div>
      </section>

      {/* 2.5 — Recipes */}
      <section id="recipes" style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Three recipes, one engine</p>
          <h2 style={{ ...sectionH2, marginBottom: 40 }}>Drop in a pipeline. Or write your own.</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 16,
            }}
          >
            <RecipeCard
              number="01"
              title="HEP Tagging (DisCo)"
              tagline="Mass-decorrelated boosted-object tagging."
              body="Ingest jet constituents or calorimeter images, extract r₂ substructure features via 2-D oriented scattering, train the classifier under a distance-correlation penalty on the resonance mass. Background shape preserved; tagging efficiency competitive with the best learned taggers."
              command={`bun run main.ts process --request "tag jets, decorrelate mass"`}
              href="/recipes/hep-tagging"
            />
            <RecipeCard
              number="02"
              title="BSM Anomaly Detection"
              tagline="Template-free new-physics search."
              body="Embed every event in the scattering feature space; index the Standard-Model background in an HNSW graph with Sliced-Wasserstein distance; flag events beyond a calibrated distance from the SM manifold. No signal model, no retraining for each hypothesis."
              command={`bun run main.ts process --request "find events that don't look like SM"`}
              href="/recipes/bsm-anomaly"
              visualization={<AnomalyEmbedding />}
            />
            <RecipeCard
              number="03"
              title="General Feature Extraction"
              tagline="Cosmology, plasma, GW, hydrodynamics."
              body="Pass any {dim, group, J, Q, L} config at runtime. 1-D for transient time series. 2-D for lensing/CMB. 3-D for density fields and plasma simulations. Same engine, same MCP tool, different physics."
              command={`bun run main.ts process --request "extract rotation-invariant features"`}
              href="/recipes/feature-extract"
            />
            <RecipeCard
              number="04"
              title="Fast-Sim Validation"
              tagline="Preview · Q3 2026"
              body="A principled fidelity metric for ML-generated Geant4 surrogates. The Wasserstein distance between scattering distributions of generated vs full-simulation showers — interpretable, decomposable by scale and orientation. The CaloChallenge community has been hand-rolling metrics; this is the one that doesn't move when the binning changes."
              command="Coming Q3 — Talk to founders →"
              href="mailto:shekhawatsamvardhan@gmail.com?subject=Fast-sim%20validation"
              preview
            />
          </div>
        </div>
      </section>

      {/* 2.6 — Architecture diagram */}
      <section id="architecture" style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>How it works</p>
          <h2 style={{ ...sectionH2, maxWidth: 640, marginBottom: 32 }}>
            The full stack, from TypeScript to CUDA.
          </h2>
          <ArchitectureDiagram />
        </div>
      </section>

      {/* 2.7 — Built for */}
      <section style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Where this earns its license</p>
          <h2 style={{ ...sectionH2, maxWidth: 760, marginBottom: 40 }}>
            Built for analyses where the statistical guarantee is the publishable result.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <UseCaseCard
              category="Particle physics — boosted-object discovery"
              body="Mass-decorrelated jet tagging for ATLAS, CMS, and HL-LHC-era analyses. The two numbers that matter — significance gain and background-shape distortion — are validated against your existing pipeline. Currently in pilot with the University of Edinburgh."
              footer="Wilks Δχ² · JSD-preserved background · on-prem · zero data egress"
            />
            <UseCaseCard
              category="Cosmology & astrophysics — field-level inference"
              body="Rotation-invariant, deformation-stable features for weak-lensing maps, CMB patches, and 3-D density fields. First-order coefficients recover power-spectrum-like information; second-order recovers non-Gaussian bispectrum-like structure where the power spectrum is blind."
              footer="SE(2) and SO(3) invariance · GPU-accelerated · facility-scale throughput"
            />
            <UseCaseCard
              category="Simulation-heavy science — plasma, nuclear, hydrodynamics"
              body="Multiscale feature extraction over volumetric simulation data. Solid-harmonic scattering for SO(3)-covariant features of fluid and plasma fields. The same engine that tags jets describes turbulent flow."
              footer="Runtime (Dim, Group) config · ROOT, HDF5, VTK loaders · no model retraining per domain"
            />
          </div>
          <div
            style={{
              padding: 32,
              border: "1px solid var(--rule)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontWeight: 300,
                fontSize: 20,
                color: "var(--ink)",
              }}
            >
              Custom deployment · Contract-based · SLA committed
            </h3>
            <a
              href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20deployment"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                color: "var(--bg)",
                backgroundColor: "var(--ink)",
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Talk to founders →
            </a>
          </div>
        </div>
      </section>

      {/* 2.8 — Math teaser */}
      <section style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>No black box</p>
          <h2 style={{ ...sectionH2, maxWidth: 760, marginBottom: 40 }}>
            Every coefficient is derivable from the input. Every guarantee is provable.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <MathBlock
              title="The cascade"
              latex={String.raw`S_2[\lambda_1,\lambda_2]\,x \;=\; \big|\,|x \star \psi_{\lambda_1}|\,\star\,\psi_{\lambda_2}\big| \,\star\, \phi_J`}
              caption="Modulus, convolve, modulus, low-pass. Non-expansive. Lipschitz-stable to deformation."
              href="/math#s1"
            />
            <MathBlock
              title="The invariance"
              latex={String.raw`\|S(\mathcal{L}_\tau x) - Sx\| \;\le\; C\!\left(\|\nabla\tau\|_\infty + \tfrac{\|\tau\|_\infty}{2^J} + \|H\tau\|_\infty\right)\|x\|`}
              caption="Small deformations produce small changes in features. Detector smearing is bounded, not amplified."
              href="/math#s2"
            >
              <DeformationStability />
            </MathBlock>
            <MathBlock
              title="The decorrelation"
              latex={String.raw`\mathcal{L} \;=\; \mathrm{wBCE}(\hat y, y) \;+\; \lambda\,\mathrm{dCorr}^2_w(\hat y,\, m \mid \text{bkg})`}
              caption="Distance correlation is zero iff the tagger output is statistically independent of the mass. The cut preserves the spectrum by construction."
              href="/math#s6"
            />
          </div>
          <a
            href="/math"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            Read the substrate, end to end →
          </a>
        </div>
      </section>

      {/* 2.9 — Pilot evidence */}
      <section id="pilot-callout" style={wrapper()}>
        <div style={{ ...inner, maxWidth: 760 }}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Currently in the wild</p>
          <h2 style={{ ...sectionH2, marginBottom: 24 }}>
            University of Edinburgh — boosted di-boson resonance search
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--ink-mute)", marginBottom: 24 }}>
            In partnership with a nuclear-physics researcher at the University of Edinburgh, Vikshep is
            running on Geant4-simulated ATLAS data, replacing a neural-network tagger trained on eight
            high-level kinematic variables. The benchmark is the analysis&#39;s own Wilks Δχ² significance
            pipeline. Two numbers will be reported: the significance gain (Δσ) over the NN baseline, and
            the reduction in background mass-shape distortion (ΔJSD). Results: Q1 2026.
          </p>
          <a
            href="/pilot"
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
              color: "var(--ink)",
              textDecoration: "none",
            }}
          >
            Pilot details →
          </a>
        </div>
      </section>

      {/* 2.10 — Get started */}
      <section style={wrapper()}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Get started in three steps</p>
          <h2 style={{ ...sectionH2, maxWidth: 640, marginBottom: 40 }}>
            Try it in 90 seconds.
          </h2>
          <div
            style={{
              maxWidth: 640,
              padding: 24,
              backgroundColor: "var(--bg-elev)",
              border: "1px solid var(--rule)",
              marginBottom: 24,
            }}
          >
            <pre
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--ink)",
                overflowX: "auto",
                margin: 0,
              }}
            >
              {QUICKSTART}
            </pre>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <a
              href="https://github.com/samvardhan03/Vikshep"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                color: "var(--bg)",
                backgroundColor: "var(--ink)",
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              View the GitHub repo →
            </a>
            <a
              href="#"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                color: "var(--ink)",
                border: "1px solid var(--rule)",
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Read the JOSS paper →
            </a>
          </div>
        </div>
      </section>

      {/* Pre-footer CTA band */}
      <section style={wrapper()}>
        <div style={inner}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 1,
              backgroundColor: "var(--rule)",
            }}
          >
            <div style={{ padding: "40px 32px", backgroundColor: "var(--bg)", display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", lineHeight: 1.2 }}>
                Run it yourself
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-mute)" }}>
                Apache-2.0. Open-source. GPU-accelerated binary wheels on PyPI. Works on your hardware, in your facility.
              </p>
              <a
                href="https://github.com/samvardhan03/Vikshep"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  alignSelf: "flex-start",
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 13,
                  color: "var(--ink)",
                  border: "1px solid var(--rule)",
                  padding: "8px 16px",
                  textDecoration: "none",
                }}
              >
                GitHub →
              </a>
            </div>
            <div style={{ padding: "40px 32px", backgroundColor: "var(--bg-elev)", display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", lineHeight: 1.2 }}>
                Or have us run it with you
              </h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-mute)" }}>
                We integrate into your existing analysis pipeline, validate against your significance benchmark, and deliver the two numbers that matter.
              </p>
              <a
                href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20collaboration"
                style={{
                  alignSelf: "flex-start",
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 13,
                  color: "var(--bg)",
                  backgroundColor: "var(--ink)",
                  padding: "8px 16px",
                  textDecoration: "none",
                }}
              >
                Talk to founders →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2.11 — Founders */}
      <section id="founders" style={wrapper(false)}>
        <div style={inner}>
          <p style={{ ...eyebrow, marginBottom: 16 }}>Founders &amp; creators</p>
          <h2 style={{ ...sectionH2, marginBottom: 40 }}>The people behind the plane</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {FOUNDERS.map((f) => (
              <div
                key={f.name}
                style={{
                  border: "1px solid var(--rule)",
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div>
                  <p
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      color: "var(--accent)",
                      marginBottom: 6,
                    }}
                  >
                    {f.eyebrow}
                  </p>
                  <h3
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontWeight: 300,
                      fontSize: 28,
                      lineHeight: 1.1,
                      color: "var(--ink)",
                      marginBottom: 4,
                    }}
                  >
                    {f.name}
                  </h3>
                  <p style={{ fontSize: 14, color: "var(--ink-mute)" }}>{f.role}</p>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink-mute)" }}>{f.focus}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {f.portfolio && (
                    <a
                      href={f.portfolio}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, color: "var(--ink)", textDecoration: "none" }}
                    >
                      ↗ {f.portfolio.replace("https://", "")}
                    </a>
                  )}
                  {f.linkedin && (
                    <a
                      href={f.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, color: "var(--ink)", textDecoration: "none" }}
                    >
                      ↗ {f.linkedin.replace("https://", "")}
                    </a>
                  )}
                  <a
                    href={`mailto:${f.email}`}
                    style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, color: "var(--ink)", textDecoration: "none" }}
                  >
                    ✉ {f.email}
                  </a>
                </div>
                <div style={{ paddingTop: 16, borderTop: "1px solid var(--rule)", display: "flex", flexDirection: "column", gap: 8 }}>
                  <p
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--ink-mute)",
                    }}
                  >
                    {f.sectionLabel}
                  </p>
                  {f.items.map((m) => (
                    <a
                      key={m.label}
                      href={m.href}
                      target={m.href.startsWith("http") ? "_blank" : undefined}
                      rel={m.href.startsWith("http") ? "noopener noreferrer" : undefined}
                      style={{ display: "flex", alignItems: "baseline", gap: 10, textDecoration: "none" }}
                    >
                      <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink)" }}>
                        {m.label}
                      </code>
                      <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: "var(--ink-mute)" }}>
                        — {m.note}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 24,
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
              color: "var(--ink-mute)",
            }}
          >
            Vikshep is the scientific-compute companion to OmniPulse. Same engine, same maintainers,
            distinct product surfaces.{" "}
            <a
              href="https://omnipulseid.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--ink)", textDecoration: "none" }}
            >
              → OmniPulse for media IP
            </a>
          </aside>
        </div>
      </section>
    </>
  );
}
