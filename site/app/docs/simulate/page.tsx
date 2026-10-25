import Link from "next/link";

export const metadata = { title: "Simulate — Docs" };

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

const mono: React.CSSProperties = {
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
  marginBottom: 4,
};

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

const rule: React.CSSProperties = {
  borderBottom: "1px solid var(--rule)",
  paddingBottom: 32,
  marginBottom: 0,
};

const SCHEMAS = [
  {
    name: "komal_v1",
    format: "Geant4 CSV",
    cols: "event_id, layer, hit_x, hit_y, hit_z, energy_dep, particle_id",
    note: "Default schema for the Edinburgh pilot analysis (ATLAS boosted di-boson).",
  },
  {
    name: "generic",
    format: "Geant4 CSV",
    cols: "Any — specify column mapping with --column-map",
    note: "Use --column-map key=col,... to map schema fields to arbitrary column names.",
  },
  {
    name: "well_hdf5",
    format: "HDF5 (Well schema)",
    cols: "t0/t1/t2 fields; periodic or wall boundary conditions",
    note: "Well-scale ingest (over 1 TB) is a hosted-plane feature (Lab/Enterprise).",
  },
  {
    name: "root_uproot",
    format: "ROOT TTree",
    cols: "ATLAS analysis framework output; via uproot",
    note: "Requires uproot extra: pip install -e 'backend/ingest[uproot]'",
  },
];

export default function SimulateDocsPage() {
  return (
    <article>
      <div style={rule}>
        <p style={eyebrow}>Simulate</p>
        <h1 style={h1Style}>Geant4 ingest workflow</h1>
        <p style={{ ...prose, marginBottom: 24 }}>
          Vikshep does not replace Geant4 — it ingests its output. Pass a CSV export
          from any Geant4 run (or ROOT TTree, or HDF5 Well schema) and Vikshep
          converts it to a content-addressed grid ready for the scattering transform.
          No rewriting of your Geant4 macro or detector description is needed.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Install", href: "/docs/install" },
            { label: "Quickstart", href: "/docs/quickstart" },
            { label: "Verify", href: "/docs/verify" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                ...mono,
                fontSize: 12,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                color: "var(--ink)",
                border: "1px solid var(--rule)",
                padding: "8px 16px",
                textDecoration: "none",
              }}
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </div>

      {/* Ingest overview */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>What ingest does</h2>
        <p style={prose}>
          The ingest pipeline reads the Geant4 output, detects or applies the column schema,
          rasterizes each event into a shared-memory grid (one grid per event, per layer),
          computes per-layer and per-event aggregates, and writes a{" "}
          <code style={mono}>manifest.json</code> with content-addressed output OIDs and
          provenance. No raw tensors are written to disk; only the aggregates and the OIDs
          are stored in the manifest.
        </p>
        <p style={{ ...prose, marginTop: 12 }}>
          The manifest is the input to the scattering transform and to all downstream recipes.
          It is the single source of truth for what data was ingested, when, and from what source.
        </p>
      </section>

      {/* CLI */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>CLI — Geant4 CSV</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          The quickest path: a CSV export from Geant4, one command.
        </p>
        <pre style={codeBlock}>{`vikshep-ingest g4 examples/g4_quickstart/sample.csv --schema komal_v1`}</pre>
        <p style={note}>
          Writes <code style={mono}>manifest.json</code> and{" "}
          <code style={mono}>provenance.json</code> to the current directory.
          The manifest lists every output OID and the per-layer aggregate values.
        </p>

        <h2 style={h2Style}>Non-standard column names</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          If your Geant4 CSV uses different column names, use{" "}
          <code style={mono}>--schema generic</code> with a{" "}
          <code style={mono}>--column-map</code>:
        </p>
        <pre style={codeBlock}>{`vikshep-ingest g4 data/sim_output.csv \\
  --schema generic \\
  --column-map "event_id=evtId,layer=layerNo,energy_dep=eDep,hit_x=x,hit_y=y,hit_z=z"`}</pre>
      </section>

      {/* Studio ingest */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Studio — Ingest screen</h2>
        <p style={prose}>
          In Studio, the Ingest screen accepts drag-drop or a file dialog. The workflow is:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Schema detection — Vikshep detects the column profile or prompts for a manual column map.",
            "Column mapping UI — an editable key-value table for non-komal_v1 files.",
            "Aggregates preview — a table of per-layer statistics computed immediately from the manifest.",
            "Per-layer energy and multiplicity histograms — rendered from manifest aggregates; no raw tensors cross the UI layer.",
            "Pad policy editor — set circular or zero-pad boundary conditions per axis.",
            "Run ingest — submits via the Executor, shows progress, lands on Results.",
          ].map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 10, fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.6 }}>
              <span style={{ ...mono, fontSize: 11, color: "var(--accent)", flexShrink: 0, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Supported schemas */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Supported schemas</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "var(--font-jetbrains), monospace",
            fontSize: 12,
          }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Schema", "Format", "Columns / fields", "Notes"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink-mute)", fontWeight: "normal", textTransform: "uppercase", letterSpacing: "0.10em", fontSize: 10, backgroundColor: "var(--bg-elev)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCHEMAS.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{s.name}</td>
                  <td style={{ padding: "10px 12px", color: "var(--ink-mute)" }}>{s.format}</td>
                  <td style={{ padding: "10px 12px", color: "var(--ink-mute)", fontSize: 11, lineHeight: 1.5 }}>{s.cols}</td>
                  <td style={{ padding: "10px 12px", color: "var(--ink-mute)", fontSize: 11, lineHeight: 1.5 }}>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Provenance */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Provenance output</h2>
        <p style={prose}>
          Every ingest run writes a <code style={mono}>provenance.json</code> alongside
          the manifest. The provenance records:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            "schema_version, engine_version, engine_build_hash",
            "executor (local or cloud), platform",
            "op (e.g. ingest_g4), config_digest (sha256 of sorted config JSON)",
            "seed (if set), input_oids (content hashes of input files), output_oids",
            "wall_clock_ms, created_at (ISO 8601 UTC)",
            "manifest_hash (self-fingerprint of the manifest, excluding this field)",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ ...note }}>
          The provenance manifest is the basis of the Determinism Certificate.
          See{" "}
          <Link href="/docs/verify" style={{ color: "var(--ink)" }}>
            Verify
          </Link>{" "}
          for how to issue and verify certificates.
        </p>
      </section>

      {/* Next steps */}
      <section>
        <h2 style={h2Style}>Next: scattering features and recipes</h2>
        <p style={{ ...prose, marginBottom: 16 }}>
          After ingest, pass the manifest to the scattering transform (requires the
          open core from vikshep-compute) and then to a recipe:
        </p>
        <pre style={codeBlock}>{`# Calibrate detector response
vikshep-recipe calibrate --features manifest.json --target layer1_e_mean

# Tag with DisCo decorrelation
vikshep-recipe tag --features manifest.json \\
  --label is_signal --protect mass --lambda 1.0`}</pre>
        <p style={{ ...note }}>
          The <code style={mono}>scattering</code> extra must be installed (see{" "}
          <Link href="/docs/install" style={{ color: "var(--ink)" }}>Install → Path 2</Link>
          ) for the scattering transform. The calibrate and tag recipes fall back to
          per-event aggregates if the scattering core is not present; the report states
          which path ran.
        </p>
      </section>
    </article>
  );
}
