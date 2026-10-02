import Link from "next/link";

export const metadata = { title: "Docs" };

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
  fontSize: "clamp(28px,3.5vw,48px)",
  color: "var(--ink)",
  lineHeight: 1.1,
  marginBottom: 16,
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(20px,2.4vw,28px)",
  color: "var(--ink)",
  lineHeight: 1.2,
  marginBottom: 12,
  marginTop: 40,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 680,
};

const rule: React.CSSProperties = {
  borderBottom: "1px solid var(--rule)",
  paddingBottom: 32,
  marginBottom: 32,
};

const FREE_ITEMS = [
  "G4 Direct Interface — Geant4 CSV → features in one command",
  "All loaders: g4, root-uproot, hdf5, well (local CPU)",
  "Per-event 2-D rasterization and aggregate features",
  "DisCo mass-decorrelation training and calibration CLIs",
  "Benchmark harness (Asimov proxy, JSD)",
  "Agent orchestrator and all recipes",
  "Web preview dashboard (client-side)",
  "AGPL-3.0 — full source, modifications must be open",
  "Community support via GitHub Issues",
];

const PAID_ITEMS = [
  "Hosted GPU scattering runs (Lab / Enterprise)",
  "Well-scale ingest over 1 TB (hosted)",
  "SW1 catalogue search (hosted)",
  "Harness-as-a-service",
  "Premium 3-D SO(3) engine paths",
  "Commercial license (no AGPL copyleft)",
  "Priority support and SLA",
];

const ENGINE_STATUS = [
  {
    label: "Available now",
    body: "The vikshep-ingest / vikshep-recipe CLI: Geant4 CSV ingest, per-event 2-D rasterization into shared memory, per-event aggregates, calibration regression, DisCo-penalised tagging on the aggregates (training gradient: Pearson proxy; reported dCorr²: exact weighted), and the benchmark harness. Tested today: byte-identical reports under a fixed seed on the same machine.",
  },
  {
    label: "In development",
    body: "The open deterministic scattering core (samvardhan03/vikshep-compute), which computes S₀/S₁/S₂ and r₂ = S₂/S₁ on the ingested grids. It is built against a written determinism specification (VDS-1) with a cross-platform conformance suite.",
  },
  {
    label: "Planned",
    body: "Desktop app. GPU acceleration.",
  },
];

const TRIAL_ITEMS = [
  "Hosted plane access — dual-capped by TRIAL_DAYS and TRIAL_GPU_SECONDS",
  "No card required",
  "One trial per verified email",
  "The download itself (AGPL source, local CLI) never expires",
];

export default function DocsIndexPage() {
  return (
    <article>
      <div style={rule}>
        <p style={eyebrow}>Documentation</p>
        <h1 style={h1Style}>
          From Geant4 output to physics answer.
        </h1>
        <p style={{ ...prose, marginBottom: 24 }}>
          Vikshep is a deterministic feature-extraction plane for physics data.
          Its feature plane is the wavelet scattering transform: nothing is
          learned during feature extraction — the wavelet filters are fixed
          analytic Morlets chosen by geometry, not trained. Translation
          invariance and deformation stability are theorems about the
          transform, not benchmarks. The transform is delivered by the open
          deterministic core, in development; see Engine status below for what
          the released CLI does today.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Install", href: "/docs/install" },
            { label: "Quickstart", href: "/docs/quickstart" },
            { label: "Recipes", href: "/docs/recipes" },
            { label: "FAQ", href: "/docs/faq" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                textTransform: "uppercase",
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

      {/* Engine status */}
      <div id="engine-status" style={rule}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Engine status</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 14, maxWidth: 680 }}>
          {ENGINE_STATUS.map((item) => (
            <li key={item.label} style={{ fontSize: 15, lineHeight: 1.7, color: "var(--ink-mute)" }}>
              <span
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "var(--ink)",
                  marginRight: 10,
                }}
              >
                {item.label}
              </span>
              {item.body}
            </li>
          ))}
        </ul>
      </div>

      {/* Free-vs-paid boundary table */}
      <div>
        <h2 style={h2Style}>Free vs. paid boundary</h2>
        <p style={{ ...prose, marginBottom: 24 }}>
          The control plane is AGPL-3.0 and ships in full. The private engine is
          intended to ship as binaries; none has been released yet. The table below is the single source of truth; it is also{" "}
          <Link href="/pricing" style={{ color: "var(--ink)" }}>
            referenced from Pricing
          </Link>
          .
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            backgroundColor: "var(--rule)",
            marginBottom: 24,
          }}
        >
          {/* Headers */}
          {["Free forever (AGPL, local)", "Trial (hosted plane)", "Lab / Enterprise (paid)"].map((h) => (
            <div
              key={h}
              style={{
                backgroundColor: "var(--bg-elev)",
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "var(--ink)",
                }}
              >
                {h}
              </p>
            </div>
          ))}

          {/* Free column */}
          <div style={{ backgroundColor: "var(--bg)", padding: "16px" }}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {FREE_ITEMS.map((item) => (
                <li
                  key={item}
                  style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}
                >
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Trial column */}
          <div style={{ backgroundColor: "var(--bg)", padding: "16px" }}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {TRIAL_ITEMS.map((item) => (
                <li
                  key={item}
                  style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}
                >
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>~</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Paid column */}
          <div style={{ backgroundColor: "var(--bg)", padding: "16px" }}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {PAID_ITEMS.map((item) => (
                <li
                  key={item}
                  style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}
                >
                  <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p style={{ ...prose, fontSize: 13, fontStyle: "italic" }}>
          The download itself never expires — the AGPL source and local CLI
          run indefinitely on your own hardware at no cost. The trial covers the
          hosted plane only and is dual-capped (time + GPU-seconds); both caps
          are enforced server-side and require no card.
        </p>
      </div>

      {/* Architecture one-liner */}
      <div style={{ marginTop: 40 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>How it fits together</h2>
        <p style={prose}>
          The control plane (agent, loaders, recipes, site — all AGPL-3.0) speaks
          to the engine over a frozen seam: 28-char SHA3-256 object IDs in POSIX
          shared memory, line-delimited JSON-RPC 2.0. Raw tensors never reach
          TypeScript or the browser. The engine binary (
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>omnipulse-mcp</code>)
          is not released yet; once it is, set{" "}
          <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>OMNIPULSE_MCP_BIN</code> to
          its path. The loaders and CLI recipes are pure Python, require no engine,
          and are the starting point for most analyses today.
        </p>
      </div>
    </article>
  );
}
