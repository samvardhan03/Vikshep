export const metadata = { title: "Quickstart — Docs" };

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--accent)",
  marginBottom: 10,
};

const h1Style: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(24px,3vw,40px)",
  color: "var(--ink)",
  lineHeight: 1.1,
  marginBottom: 16,
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: 22,
  color: "var(--ink)",
  lineHeight: 1.2,
  marginBottom: 10,
  marginTop: 40,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 680,
};

const code: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 13,
};

const codeBlock: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 13,
  backgroundColor: "var(--bg-elev)",
  border: "1px solid var(--rule)",
  padding: "16px 20px",
  lineHeight: 1.6,
  whiteSpace: "pre",
  overflowX: "auto",
  color: "var(--ink)",
  marginTop: 12,
  marginBottom: 12,
};

const outputBlock: React.CSSProperties = {
  ...codeBlock,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--accent)",
};

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

const stepNum: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "var(--accent)",
  marginBottom: 6,
};

export default function QuickstartPage() {
  return (
    <article>
      <p style={eyebrow}>Quickstart</p>
      <h1 style={h1Style}>Geant4 to physics answer in four commands</h1>
      <p style={{ ...prose, marginBottom: 8 }}>
        From a Geant4 CSV export to calibrated features and a
        mass-decorrelated tagger — no GPU, no account, no build step.
      </p>
      <p style={{ ...prose, marginBottom: 32 }}>
        <strong style={{ color: "var(--ink)" }}>Prerequisites:</strong> Python 3.10+, Git.
        Install time (first run): ~20 s. Pipeline time on sample data: ~22 s.
      </p>

      {/* Clone + install */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32, marginBottom: 0 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Clone and install</h2>
        <pre style={codeBlock}>{`git clone https://github.com/samvardhan03/Vikshep.git
cd Vikshep
pip install -e backend/ingest`}</pre>
        <p style={note}>
          <code style={code}>vikshep-ingest</code> is not yet on PyPI.
          Install from the repo clone only.
        </p>
      </section>

      {/* Step 1 */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 1</span>
          Ingest a Geant4 CSV
        </h2>
        <p style={prose}>
          The G4 Direct Interface reads a Geant4 ntuple CSV, rasterizes each
          event into a 2-D (phi, theta) grid, computes 32 aggregate scalars per
          event, and writes a manifest. No engine binary required.
        </p>
        <pre style={codeBlock}>{`vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`Geant4 Direct Interface — profile: komal_v1
  CSV            : examples/g4_quickstart/sample.csv
  Events parsed  : 10
  Hits total     : 45
  Malformed rows : 0
  Grid channels  : 1  (energy)
  Aggregate scalars: 32 per event
  Grid OIDs      : 10 (28-char SHA3-256)
  Manifest written: examples/g4_quickstart/manifest.json`}</pre>
        <p style={{ ...note, marginTop: 16 }}>
          The <code style={code}>komal_v1</code> schema expects per-hit rows:{" "}
          <code style={code}>event_id, layer (1|2|3), phi (rad), theta (rad), momentum (GeV/c)[, energy (GeV)]</code>.
          For other ntuple layouts use{" "}
          <code style={code}>--schema generic --column-map &#123;...&#125;</code>.
        </p>
      </section>

      {/* Step 2 — inspect */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 2 (optional)</span>
          Inspect the manifest
        </h2>
        <p style={prose}>
          The manifest is the control-plane payload — OIDs and scalars, no raw
          tensors. Inspect it before running recipes.
        </p>
        <pre style={codeBlock}>{`cat examples/g4_quickstart/manifest.json | python3 -c "
import json, sys
m = json.load(sys.stdin)
print('Events:', m['n_events'])
print('Aggregates per event:', len(m['aggregate_names']))
print('Grid OIDs (first 3):', m['grid_oids'][:3])
"`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`Events: 10
Aggregates per event: 32
Grid OIDs (first 3): ['...28 hex chars...', '...', '...']`}</pre>
      </section>

      {/* Step 3 */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 3</span>
          Calibrate detector response
        </h2>
        <p style={prose}>
          Fit a regression from aggregate features to a target scalar (e.g.
          energy deposited in a layer). Outputs a calibration report with R² and
          residual std.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe calibrate \\
  --features examples/g4_quickstart/manifest.json \\
  --target layer1_e_mean`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`  Report written: examples/g4_quickstart/calibrate_report.json
  target   : layer1_e_mean
  R^2      : 1.0000
  residual std: 0.0001
  n_events : 10`}</pre>
      </section>

      {/* Step 4 */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 4</span>
          Tag with DisCo mass-decorrelation
        </h2>
        <p style={prose}>
          Train a classifier and enforce zero distance correlation between its
          score and a protected variable (e.g. mass). The{" "}
          <code style={code}>--lambda</code> flag controls the decorrelation
          penalty strength. Higher = stricter decorrelation.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe tag \\
  --features examples/g4_quickstart/manifest.json \\
  --label    layer1_n_hits \\
  --protect  layer2_phi_mean \\
  --lambda   1.0`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`Report written: examples/g4_quickstart/tag_report.json
  lambda   : 1.0
  AUC      : 1.0000
  dCorr^2  : 0.0000  (lower = better decorrelation)
  n_events : 10`}</pre>
        <p style={{ ...note, marginTop: 16 }}>
          <strong style={{ color: "var(--ink)" }}>dCorr² = 0.0000</strong> means the
          tagger score and the protected variable are statistically independent at
          this sample size — mass sculpting is suppressed.
        </p>
      </section>

      {/* What each command produces */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>What each command produces</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Command", "Input", "Output"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["vikshep-ingest g4", "Geant4 CSV", "manifest.json — OIDs + 32 scalars/event"],
                ["vikshep-recipe calibrate", "manifest.json", "calibrate_report.json — R² + residual std"],
                ["vikshep-recipe tag", "manifest.json", "tag_report.json — AUC + dCorr²"],
              ].map(([cmd, input, output], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{cmd}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{input}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timing */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Time to first value</h2>
        <p style={prose}>
          Measured on Apple M-series (macOS 22.6, Python 3.11, no GPU), fresh
          install, sample.csv (10 events):
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["pip install -e backend/ingest", "~20 s (first install; cached ≈ 3 s)"],
            ["vikshep-ingest g4", "~7 s"],
            ["vikshep-recipe calibrate", "< 1 s"],
            ["vikshep-recipe tag", "~15 s (sklearn fit)"],
            ["End-to-end from git clone to tag_report.json", "< 45 s"],
          ].map(([cmd, time]) => (
            <li key={cmd as string} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 13 }}>
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--ink)" }}>{cmd}</code>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--ink-mute)", whiteSpace: "nowrap" }}>{time}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Next steps */}
      <section>
        <h2 style={h2Style}>Next steps</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Run the benchmark harness on a real pipeline", "/docs/recipes"],
            ["Explore the loader table (g4, root-uproot, hdf5, well)", "/docs/recipes"],
            ["Read about GPU acceleration and the engine binary", "/docs/install"],
            ["Understand AGPL scope and when you need a license", "/docs/faq"],
          ].map(([label, href]) => (
            <li key={label as string} style={{ display: "flex", gap: 10, fontSize: 14, lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>→</span>
              <a href={href as string} style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
