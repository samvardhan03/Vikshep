import Link from "next/link";

export const metadata = { title: "Studio — Docs" };

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

const rule: React.CSSProperties = {
  borderBottom: "1px solid var(--rule)",
  paddingBottom: 32,
  marginBottom: 32,
};

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

const SCREENS = [
  {
    name: "Workspace",
    desc: "Landing screen. Lists projects (named collections of datasets and runs), recent datasets (ingested, with OID, date, source type), and recent runs (op name, status, timestamp, provenance hash). Quick-start CTA: Ingest a dataset.",
  },
  {
    name: "Ingest",
    desc: "Accepts drag-drop or file-dialog for Geant4 CSV, ROOT TTree, HDF5 (Well schema). Steps: schema detection → column mapping UI → aggregates preview (per-layer statistics) → per-layer energy and multiplicity histograms → pad policy editor → Run ingest.",
  },
  {
    name: "Features (Scattering Config)",
    desc: "Config form for the wavelet scattering transform: J (1–14), Q (1–32), L (1–16 for dim=2/3), order (1–2), Dim (1/2/3), Group (trivial/so2/so3), pad policy per axis. Filter bank preview shows Morlet coverage. Live coefficient count estimate: J × Q × (L if dim>1 else 1) × order.",
  },
  {
    name: "Recipes",
    desc: "Three recipe forms (calibrate, tag, anomaly), each with parameter inputs and a live progress panel. calibrate: target column, R² score, residual std, feature importances. tag: label/protect/weights columns, lambda sweep UI, lambda frontier table. anomaly: k-NN parameter, SW1 threshold, flagged event list.",
  },
  {
    name: "Results",
    desc: "Per-run result panel: dCorr_w report card (actual value; target = 0 for decorrelation), JSD pre/post-cut histogram overlay, lambda frontier scatter (AUC vs JSD), Asimov proxy significance (labelled explicitly as proxy, not Wilks), SW1 graph viewer for anomaly runs, Export report.json / report.md.",
  },
  {
    name: "Provenance",
    desc: "Hash chain panel per ProvenanceManifest: engine_version, engine_build_hash, executor (local/cloud), platform, config_digest, input OIDs → output OIDs, wall_clock_ms, created_at, manifest_hash. Reproduce button re-submits the same job and diffs the output OIDs (green = identical, red = differ).",
  },
  {
    name: "Compute",
    desc: "Executor selector: Local or Cloud. Local: engine binary version, sidecar status. Cloud: org quota (GPU-seconds remaining), estimated cost, job queue depth, current job status. Desktop only: burst-to-cloud checkbox routes any job to the cloud executor.",
  },
  {
    name: "Settings",
    desc: "Tabs: Licence (plan, trial expiry, GPU-seconds remaining, licence key field) / Devices (table of activated devices, release button, DEVICE_LIMIT message for 3rd-device attempts) / API Key / Engine (version, check for updates) / Updates (auto-updater, Desktop only).",
  },
];

export default function StudioDocsPage() {
  return (
    <article>
      <div style={rule}>
        <p style={eyebrow}>Studio</p>
        <h1 style={h1Style}>Vikshep Studio overview</h1>
        <p style={{ ...prose, marginBottom: 24 }}>
          Studio is a single React application that runs in two shells: the Vikshep
          hosted plane (served at{" "}
          <code style={mono}>/studio</code>) and the Tauri desktop application.
          Both shells share the same <code style={mono}>studio-core</code> TypeScript
          package and the same engine, so every result carries an identical
          ProvenanceManifest regardless of where it ran.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Simulate", href: "/docs/simulate" },
            { label: "Verify", href: "/docs/verify" },
            { label: "Install", href: "/docs/install" },
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

      {/* Two shells */}
      <div style={rule}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Two shells, one engine</h2>
        <p style={prose}>
          Studio runs either as a Tauri desktop application (Desktop) or as a session-authenticated
          web application served by the Vikshep private app (Hosted). Both shells use the same{" "}
          <code style={mono}>studio-core</code> Executor abstraction. The{" "}
          <code style={mono}>LocalExecutor</code> dispatches to the Python sidecar CLIs
          and, when present, to the <code style={mono}>vikshep-mcp</code> binary for scattering
          and anomaly ops. The <code style={mono}>CloudExecutor</code> sends jobs to the
          hosted{" "}
          <code style={mono}>/api/jobs</code> endpoint and polls for results.
        </p>
        <p style={{ ...note }}>
          The parity guarantee: for any CPU op with the same input content, LocalExecutor
          and CloudExecutor produce identical <code style={mono}>outputOids</code>. Verified
          by the <code style={mono}>parity.test.ts</code> integration test (runs with{" "}
          <code style={mono}>VIKSHEP_PARITY_TEST=1</code>).
        </p>
      </div>

      {/* Screens */}
      <div style={rule}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Screens</h2>
        <p style={{ ...prose, marginBottom: 24 }}>
          Studio has eight screens. Each screen maps to a named route in both the hosted
          and desktop shells.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {SCREENS.map((screen, i) => (
            <div
              key={screen.name}
              style={{
                padding: "20px 0",
                borderBottom: i < SCREENS.length - 1 ? "1px solid var(--rule)" : "none",
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 20,
                alignItems: "start",
              }}
            >
              <p style={{ ...mono, fontSize: 12, color: "var(--ink)" }}>{screen.name}</p>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>{screen.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Licence and devices */}
      <div style={rule}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Licence and device limits</h2>
        <p style={prose}>
          Studio Academic and Studio Pro seats allow up to 2 concurrent device activations.
          Each device holds a 24-hour Ed25519 offline-verifiable lease, renewed automatically
          while the device is online. After{" "}
          <code style={mono}>OFFLINE_GRACE_DAYS</code> (default 14 days) without a heartbeat,
          Studio degrades to Free-tier behaviour — it never locks project files or data.
        </p>
        <p style={{ ...prose, marginTop: 12 }}>
          To release a device slot: Settings → Devices → Release. The slot is freed
          immediately. A third activation attempt returns a{" "}
          <code style={mono}>DEVICE_LIMIT</code> error with the two current holders listed,
          each with a one-click Release action.
        </p>
      </div>

      {/* Download */}
      <div>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Getting the desktop app</h2>
        <p style={prose}>
          Desktop builds are not publicly available yet. After launch, builds are available
          to licensed accounts from your account page after sign-in. See the{" "}
          <Link href="/download" style={{ color: "var(--ink)" }}>
            download page
          </Link>{" "}
          for system requirements and the full download flow.
        </p>
      </div>
    </article>
  );
}
