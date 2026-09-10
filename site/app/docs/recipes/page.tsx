export const metadata = { title: "Recipes — Docs" };

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

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

export default function RecipesPage() {
  return (
    <article>
      <p style={eyebrow}>Recipes</p>
      <h1 style={h1Style}>CLI recipes and data loaders</h1>
      <p style={{ ...prose, marginBottom: 32 }}>
        Recipes are declarative pipelines — a fixed sequence of ingest, scatter,
        reduce, and (optionally) classify steps. CLI recipes are executable Python
        scripts installed as console scripts; agent recipes are MCP tool sequences.
      </p>

      {/* CLI recipes */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32, marginBottom: 0 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>vikshep-recipe calibrate</h2>
        <p style={prose}>
          Fits a linear regression from aggregate features to a target scalar.
          Useful for detector calibration and response correction.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe calibrate \\
  --features <manifest.json>   # required: path to the ingest manifest
  --target   <column_name>     # required: aggregate scalar to predict
  --output   <report.json>     # optional: default = calibrate_report.json`}</pre>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Flag", "Required", "Description"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["--features", "Yes", "Path to manifest.json from vikshep-ingest"],
                ["--target", "Yes", "Aggregate column name to regress against"],
                ["--output", "No", "Output report path (default: calibrate_report.json)"],
              ].map(([flag, req, desc], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{flag}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{req}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 style={h2Style}>vikshep-recipe tag</h2>
        <p style={prose}>
          Trains a classifier on aggregate features with optional DisCo
          mass-decorrelation. The{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>--protect</code>{" "}
          flag enforces that the classifier score is statistically independent of
          the named variable, suppressing mass sculpting.
        </p>
        <pre style={codeBlock}>{`vikshep-recipe tag \\
  --features <manifest.json>   # required
  --label    <column_name>     # required: binary target
  --protect  <column_name>     # optional: variable to decorrelate from
  --lambda   <float>           # optional: DisCo penalty (default 0.0)
  --output   <report.json>     # optional: default = tag_report.json`}</pre>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Flag", "Required", "Description"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["--features", "Yes", "Path to manifest.json"],
                ["--label", "Yes", "Binary label column (0/1 or bool)"],
                ["--protect", "No", "Column whose correlation with the score must be zero"],
                ["--lambda", "No", "DisCo penalty weight (0 = off, 1 = balanced, >1 = strict)"],
                ["--output", "No", "Output report path (default: tag_report.json)"],
              ].map(([flag, req, desc], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{flag}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{req}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data loaders */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Data loaders</h2>
        <p style={prose}>
          Loaders are discovered via Python entry points (
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>vikshep.loaders</code>
          ). Each loader writes POSIX shared memory and returns a 28-hex SHA3-256
          OID. All loaders are in{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>backend/ingest</code>{" "}
          and installed with{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>pip install -e backend/ingest</code>.
        </p>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Loader", "Format", "CLI entry point"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["g4", "Geant4 CSV (event_id, layer, phi, theta, momentum[, energy])", "vikshep-ingest g4"],
                ["root-uproot", ".root (Geant4, CMS Open Data)", "vikshep-ingest root"],
                ["hdf5", ".h5, generic HDF5", "vikshep-ingest hdf5"],
                ["well", "The Well HDF5 (15 TB physics simulations dataset)", "vikshep-ingest well_slice"],
              ].map(([loader, format, cli], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{loader}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{format}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{cli}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={note}>
          All loaders are CPU-only and require no account. The{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>well</code>{" "}
          loader is available in the Free tier; hosted well-scale ingest (&gt; 1 TB)
          requires Lab or Enterprise.
        </p>
      </section>

      {/* Agent recipes */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Agent recipes</h2>
        <p style={prose}>
          Agent recipes are declarative MCP tool sequences defined in{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>agent/src/recipes/</code>.
          They chain the same steps as the CLI recipes but run through the
          TypeScript/Bun MCP orchestrator, enabling async streaming, provenance
          logging, and the engine GPU paths.
        </p>
        <div style={{ overflowX: "auto", marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Recipe", "Pipeline"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["hep-tagging-disco", "G4 ingest → aggregates → r₂ → DisCo classifier"],
                ["bsm-anomaly", "ingest → scatter → log-mean → HNSW → detect"],
                ["general-feature", "ingest → scatter (Dim, Group from request) → reduce"],
              ].map(([recipe, pipeline], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{recipe}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{pipeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Manifest anatomy */}
      <section>
        <h2 style={h2Style}>Manifest anatomy</h2>
        <p style={prose}>
          The manifest is the control-plane payload produced by any loader. It
          contains OIDs and scalar metadata — no raw tensors.
        </p>
        <pre style={codeBlock}>{`{
  "n_events": 10,
  "schema": "komal_v1",
  "aggregate_names": ["layer1_n_hits", "layer1_e_mean", ...],  // 32 scalars/event
  "grid_oids": ["a3f1...", ...],  // 28-char SHA3-256 hex, one per event
  "pad_policy_per_axis": {
    "phi": "Circular",     // correct for azimuthal angle
    "theta": "ZeroPad"     // correct for polar angle
  }
}`}</pre>
        <p style={prose}>
          The 28-char OIDs are the only handles that cross the AGPL boundary into
          the engine. Raw grid tensors live in POSIX shared memory and never reach
          TypeScript or the browser. The schema is frozen; changing it is a
          breaking change requiring a major version bump in both control plane and
          data plane.
        </p>

        <h2 style={h2Style}>Benchmark harness</h2>
        <p style={prose}>
          Run the harness on a real analysis pipeline to sweep the DisCo lambda
          and record AUC-vs-dCorr² trade-offs:
        </p>
        <pre style={codeBlock}>{`python -m bench.run \\
  --manifest manifest.json \\
  --label    <signal_col> \\
  --protect  <mass_col> \\
  --lambdas  0,0.1,1,10`}</pre>
        <p style={prose}>
          The harness outputs a sweep table and computes the Asimov proxy and
          Jensen-Shannon divergence for each lambda value. All free, all local.
        </p>
      </section>
    </article>
  );
}
