import Link from "next/link";

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
        <strong style={{ color: "var(--ink)" }}>Prerequisites:</strong> Python 3.10+.
        Install in a fresh environment: about 1.5 min. The four commands on the 1000-event
        sample: about 2.5 min on an Intel Mac, most of it computing the scattering features once.
      </p>

      {/* Install */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Install and get the sample</h2>
        <pre style={codeBlock}>{`pip install vikshep-ingest
curl -LO https://raw.githubusercontent.com/samvardhan03/Vikshep/main/examples/g4_quickstart/sample.csv`}</pre>
        <p style={note}>
          On Linux (x86_64, aarch64), macOS and Windows (x86_64) this installs the open
          deterministic core as a prebuilt wheel, and the recipes run on wavelet scattering
          features. Elsewhere they fall back to per-event aggregates and say so; see{" "}
          <Link href="/docs/install" style={{ color: "var(--ink)" }}>Install</Link>.
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
        <pre style={codeBlock}>{`vikshep-ingest g4 sample.csv --schema komal_v1`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`Geant4 Direct Interface — profile: komal_v1
  CSV            : sample.csv
  Events parsed  : 1000
  Hits total     : 13808
  Malformed rows : 0
  Grid channels  : 1  (energy)
  Aggregate scalars: 32 per event
  Event columns  : is_signal, true_energy, weight  (usable as --label, --protect, --weights, --target)
  Grid OIDs      : 1000 (28-char SHA3-256)
  Manifest written: manifest.json`}</pre>
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
        <pre style={codeBlock}>{`cat manifest.json | python3 -c "
import json, sys
m = json.load(sys.stdin)
print('Events:', m['n_events'])
print('Event columns:', m['event_column_names'])
print('Grid OIDs (first 3):', m['grid_oids'][:3])
"`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`Events: 1000
Event columns: ['is_signal', 'true_energy', 'weight']
Grid OIDs (first 3): ['...28 hex chars...', '...', '...']`}</pre>
      </section>

      {/* Step 3 */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 3</span>
          Calibrate detector response
        </h2>
        <p style={prose}>
          Fit a regression from the per-event features to a target: here the
          incident energy, <code style={code}>true_energy</code>, one of the sample&apos;s
          event columns. Outputs a calibration report with R² and residual std.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe calibrate \\
  --features manifest.json \\
  --target true_energy`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`  Provenance written: provenance.json
  Report written: calibrate_report.json
vikshep-recipe calibrate
  feature_set  : scattering
  target       : true_energy
  R^2          : 0.5589
  residual std : 3.5026
  n_events     : 1000`}</pre>
        <p style={note}>
          This step computes the scattering features of the 1000 events (the slow part) and
          keeps them next to the manifest in <code style={code}>.vikshep-cache/</code>; the tag
          step reuses them.
        </p>
      </section>

      {/* Step 4 */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>
          <span style={stepNum}>Step 4</span>
          Tag with DisCo decorrelation
        </h2>
        <p style={prose}>
          Train a classifier on the scattering features with a DisCo penalty on
          the dependence between its score and a protected variable (here
          <code style={code}>true_energy</code>), with Monte Carlo event weights.
          The <code style={code}>--lambda</code> flag controls the penalty
          strength. Higher = stricter decorrelation. Training uses the exact weighted
          dCorr² gradient of the open core.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe tag \\
  --features manifest.json \\
  --label    is_signal \\
  --protect  true_energy \\
  --weights  weight \\
  --lambda   1.0`}</pre>
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 16, marginBottom: 4 }}>
          Expected output
        </p>
        <pre style={outputBlock}>{`  Provenance written: provenance.json
  Report written: tag_report.json
vikshep-recipe tag
  feature_set       : scattering
  lambda            : 1.0
  AUC               : 0.9743
  dCorr^2           : 0.0182  (lower = better decorrelation)
  training_gradient : exact_weighted
  reported_dcorr2   : exact_weighted
  n_events          : 1000`}</pre>
        <p style={{ ...note, marginTop: 16 }}>
          <strong style={{ color: "var(--ink)" }}>dCorr² = 0.0182</strong>: the weighted
          distance correlation between the tagger score and <code style={code}>true_energy</code>{" "}
          on background events, down from 0.0374 at <code style={code}>--lambda 0</code> (AUC
          0.9781); <code style={code}>--lambda 10</code> gives 0.0084 at AUC 0.8734. Without the
          open core the recipes use aggregates and a Pearson-proxy gradient, which barely
          decorrelates (0.2540). The sample is synthetic; see the{" "}
          <a href="https://github.com/samvardhan03/Vikshep/tree/main/examples/g4_quickstart" target="_blank" rel="noopener noreferrer" style={{ color: "var(--ink)" }}>quickstart folder</a>.
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
                ["vikshep-ingest g4", "Geant4 CSV", "manifest.json — OIDs, 32 scalars and the event columns per event"],
                ["vikshep-recipe calibrate", "manifest.json", "calibrate_report.json — R² + residual std"],
                ["vikshep-recipe tag", "manifest.json", "tag_report.json — AUC + dCorr² + method fields"],
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
          Measured 2026-11-07 on an Intel Mac (x86_64), macOS 13, Python 3.12, no GPU, fresh
          virtual environment, the 1000-event sample:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["pip install vikshep-ingest (all dependencies)", "~93 s"],
            ["vikshep-ingest g4", "2.4 s"],
            ["vikshep-recipe calibrate (computes the scattering features)", "~140 s"],
            ["vikshep-recipe tag (reuses them)", "4.5 s"],
          ].map(([cmd, time]) => (
            <li key={cmd as string} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "8px 0", borderBottom: "1px solid var(--rule)", fontSize: 13 }}>
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--ink)" }}>{cmd}</code>
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", color: "var(--ink-mute)", whiteSpace: "nowrap" }}>{time}</span>
            </li>
          ))}
        </ul>
        <p style={note}>
          The first command after a fresh install can take longer on macOS while the new
          native libraries load for the first time (measured once here: about 3 minutes).
        </p>
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
