export const metadata = { title: "Professor Brief — Vikshep" };

const wrap: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  padding: "0 24px",
};
const monoSm: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
};
const sec: React.CSSProperties = {
  padding: "48px 0",
  borderBottom: "1px solid var(--rule)",
};
const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.78,
  color: "var(--ink-mute)",
};

export default function BriefPage() {
  return (
    <article>
      {/* Print controls — hidden in print */}
      <div
        className="no-print"
        style={{
          borderBottom: "1px solid var(--rule)",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 12,
          color: "var(--ink-mute)",
        }}
      >
        <span>This page is printable. Use browser print (Ctrl-P / Cmd-P) for a clean two-page PDF.</span>
        <a
          href="/pilot"
          style={{ color: "var(--ink)", textDecoration: "none" }}
        >
          ← Back to Pilot
        </a>
      </div>

      {/* Page 1 — What it is */}
      <header style={{ ...sec, paddingTop: 64 }}>
        <div style={wrap}>
          <p style={{ ...monoSm, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "var(--ink-mute)", marginBottom: 12 }}>
            Vikshep — Professor Brief · July 2025
          </p>
          <h1
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(28px,3.6vw,48px)",
              lineHeight: 1.1,
              color: "var(--ink)",
              marginBottom: 20,
            }}
          >
            Deterministic wavelet-scattering features for physics.
            <br />
            From Geant4 output to physics answer.
          </h1>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5, marginBottom: 0 }}>
            AGPL-3.0 control plane · GPU engine ships as binaries (research: free)
          </p>
        </div>
      </header>

      {/* The problem */}
      <section style={sec}>
        <div style={wrap}>
          <p style={{ ...monoSm, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)", marginBottom: 10 }}>
            The problem
          </p>
          <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Neural-network taggers sculpt the mass spectrum.
          </h2>
          <p style={prose}>
            Every standard jet classifier learns to use the jet mass as a discriminating feature:
            signal jets have a characteristic mass; QCD jets have a falling distribution.
            A cut on the tagger score deforms the background mass spectrum, producing a
            spurious bump at the signal hypothesis. The significance is fake. This is the
            mass-sculpting problem, and it is acute in every boosted-object analysis.
          </p>
          <p style={{ ...prose, marginTop: 12 }}>
            Existing mitigations (JEDI-net, mass decorrelation via adversarial training, DDT)
            all involve learned components that trade some physics correctness for decorrelation.
            None provides a closed-form guarantee.
          </p>
        </div>
      </section>

      {/* The solution */}
      <section style={sec}>
        <div style={wrap}>
          <p style={{ ...monoSm, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)", marginBottom: 10 }}>
            The solution
          </p>
          <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Two mathematical guarantees, not heuristics.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div>
              <p style={{ ...monoSm, fontSize: 13, color: "var(--ink)", marginBottom: 8 }}>1. Deterministic scattering features</p>
              <p style={prose}>
                Fixed analytic Morlet wavelets — no learned weights. The scattering ratio
                r₂ = S₂/S₁ is dimensionless, scale-invariant, and mass-decorrelated by
                construction. No training step, no data-hungry fitting.
              </p>
            </div>
            <div>
              <p style={{ ...monoSm, fontSize: 13, color: "var(--ink)", marginBottom: 8 }}>2. DisCo distance-correlation penalty</p>
              <p style={prose}>
                A weighted Szekely-Rizzo distance correlation penalty (dCorr = 0 iff
                statistical independence) is added to the classifier loss. This provides
                a closed-form guarantee that the tagger output is independent of the
                resonance mass — not a heuristic, not a regularisation trick.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Page break hint */}
      <div style={{ pageBreakAfter: "always" }} />

      {/* Page 2 — Evidence and getting started */}
      <section style={sec}>
        <div style={wrap}>
          <p style={{ ...monoSm, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)", marginBottom: 10 }}>
            Evidence
          </p>
          <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Live pilot: University of Edinburgh — boosted di-boson resonance search.
          </h2>
          <p style={prose}>
            In partnership with a nuclear-physics researcher at the University of Edinburgh,
            Vikshep is running on Geant4-simulated ATLAS data on the boosted di-boson resonance
            topology (X → ZV/WZ/ZH, gg → H, at four mass points: 700/1000/1500/2000 GeV).
            Vikshep replaces a neural-network tagger trained on eight high-level kinematic
            variables. Two numbers will be reported against the analysis's existing Wilks
            Δχ² significance pipeline:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 16, maxWidth: 440 }}>
            {[
              { label: "Δσ", note: "Significance gain over the NN baseline at equal cut efficiency (Asimov proxy; Wilks Δχ² to follow)" },
              { label: "ΔJSD", note: "Jensen-Shannon divergence pre/post cut — reduction vs. NN baseline" },
            ].map((m) => (
              <div key={m.label} style={{ border: "1px solid var(--rule)", padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 28, fontWeight: 700, color: "var(--ink)", opacity: 0.3 }}>TBD</p>
                <p style={{ ...monoSm, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--accent)", marginBottom: 6 }}>{m.label}</p>
                <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.5 }}>{m.note}</p>
              </div>
            ))}
          </div>
          <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginTop: 12 }}>
            Success criterion: Vikshep achieves equal or higher Δσ at strictly lower ΔJSD.
          </p>
        </div>
      </section>

      {/* Getting started */}
      <section style={sec}>
        <div style={wrap}>
          <p style={{ ...monoSm, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)", marginBottom: 10 }}>
            Getting started
          </p>
          <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", marginBottom: 16 }}>
            Four commands from Geant4 output to tagger features.
          </h2>
          <pre style={{
            border: "1px solid var(--rule)",
            padding: "16px 20px",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12,
            lineHeight: 1.7,
            color: "var(--ink)",
            overflowX: "auto",
            marginBottom: 16,
          }}>{`git clone https://github.com/samvardhan03/Vikshep && cd Vikshep
pip install -e backend/ingest

vikshep-ingest g4 your_output.csv --schema komal_v1
vikshep-recipe tag --features manifest.json --label is_signal --protect mass --lambda 1.0`}</pre>
          <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", lineHeight: 1.6 }}>
            The <code>komal_v1</code> schema expects per-hit CSV rows with{" "}
            <code>event_id, layer, phi, theta, momentum[, energy]</code>.
            Other ntuple formats supported via <code>--schema generic --column-map</code>.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={{ ...monoSm, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--accent)", marginBottom: 10 }}>
            Contact
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
            {[
              { name: "Samvardhan Singh", role: "Infra / MLOps", email: "shekhawatsamvardhan@gmail.com" },
              { name: "Yash Mishra", role: "Systems / Optimal Transport", email: "yash01012002@gmail.com" },
              { name: "Komal Papanwar", role: "Physics — ATLAS / Edinburgh", email: "kpapanwar@gmail.com" },
            ].map((p) => (
              <div key={p.name} style={{ border: "1px solid var(--rule)", padding: "16px 20px" }}>
                <p style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>{p.name}</p>
                <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginBottom: 8 }}>{p.role}</p>
                <a href={`mailto:${p.email}`} style={{ ...monoSm, fontSize: 12, color: "var(--ink)", textDecoration: "none" }}>{p.email}</a>
              </div>
            ))}
          </div>
          <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginTop: 16 }}>
            github.com/samvardhan03/Vikshep · AGPL-3.0 + Commercial · 2025 Vikshep
          </p>
        </div>
      </section>
    </article>
  );
}
