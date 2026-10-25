export const metadata = { title: "Studio — Vikshep" };

const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};

const sec = (border = true): React.CSSProperties => ({
  padding: "72px 0",
  borderBottom: border ? "1px solid var(--rule)" : "none",
});

const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--accent)",
  marginBottom: 12,
};

const h1: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(34px,5vw,76px)",
  lineHeight: 1.02,
  letterSpacing: "-0.02em",
  color: "var(--ink)",
  marginBottom: 20,
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(22px,2.8vw,40px)",
  lineHeight: 1.1,
  color: "var(--ink)",
  marginBottom: 16,
};

const h3: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: 22,
  lineHeight: 1.2,
  color: "var(--ink)",
  marginBottom: 10,
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

const screenshotPlaceholder: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16/10",
  backgroundColor: "var(--bg-elev)",
  border: "1px dashed var(--rule)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginTop: 24,
  marginBottom: 8,
};

const PILLARS = [
  {
    symbol: "G",
    label: "Simulate",
    sub: "Geant4 inside",
    body: "Vikshep embeds your Geant4 detector — it does not replace it. Pass a CSV export from any Geant4 run, or use the bundled Geant4 runner (Desktop) to drive simulation directly from the Workspace. Vikshep ingests the shower, not the simulation logic.",
    detail: "Supported inputs: Geant4 CSV (komal_v1, generic column-map), ROOT TTree, HDF5 Well schema.",
    screenshotAlt: "Studio Ingest screen — drag-drop Geant4 CSV, schema detection, aggregate preview",
  },
  {
    symbol: "ψ",
    label: "Analyze",
    sub: "Deterministic features",
    body: "The wavelet scattering transform cascades fixed analytic Morlet wavelets through the ingested grid. No weights are learned during feature extraction. The feature map cannot adapt to leak mass or encode nuisance variables — that is a theorem, not a tuning choice.",
    detail: "r₂ = S₂/S₁ is scale-free by construction. DisCo enforces statistical independence from the resonance mass.",
    screenshotAlt: "Studio Features screen — J/Q/L config form with live filter bank preview and coefficient count",
  },
  {
    symbol: "⊞",
    label: "Prove",
    sub: "Determinism Certificates",
    body: "Every Studio result carries a Determinism Certificate: the provenance manifest, the conformance evidence (suite version, numerics version, backend, local self-test result), and an optional Ed25519 signature that identifies the installation that produced it. The certificate proves which computation ran; any reviewer can re-run the computation and verify the output OIDs match.",
    detail: "Certificate format: VDS-1. Free offline verifier: vikshep-conformance (open source).",
    screenshotAlt: "Studio Provenance screen — hash chain panel with Reproduce button and certificate export",
  },
];

const VDS_TIERS = [
  {
    id: "Tier 1",
    label: "Bit-exact on every conforming backend",
    body: "Tier-1 outputs are identical bytes on CPU (reference Rust), CUDA, and Metal, for the same input and numerics version. Tier 1 covers all S₀, S₁, S₂ and r₂ tensor computations — all IEEE-754 binary32, explicit flush-to-zero semantics, no FMA unless this specification permits it, no libm.",
  },
  {
    id: "Tier 2",
    label: "Bit-exact on every platform — Rust CPU only",
    body: "Tier-2 computations always run in the reference Rust CPU code, regardless of which backend is active. This covers filter and twiddle-table construction, the DisCo statistics (dCorr_w, JSD), anomaly search, and report generation. GPU backends must not re-implement Tier-2 code; they receive Tier-2 results as inputs.",
  },
  {
    id: "Tier 3",
    label: "Provenance recorded — not certified",
    body: "Tier-3 covers operations outside VDS-1 control: Geant4 simulation, loader pre-processing from non-deterministic sources, external model inference. Studio records Tier-3 provenance (tool, version, build, platform, seed), but this specification does not certify Tier-3 reproducibility.",
  },
];

const APP_BASE = process.env.NEXT_PUBLIC_VIKSHEP_API_BASE ?? null;

export default function StudioPage() {
  return (
    <article>

      {/* Hero */}
      <header style={{ ...sec(), paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Vikshep Studio</p>
          <h1 style={h1}>
            Simulate with Geant4.
            <br />
            Analyze deterministically.
            <br />
            <span style={{ color: "var(--ink-mute)", fontStyle: "italic" }}>Prove it.</span>
          </h1>
          <p style={{ ...prose, marginBottom: 32 }}>
            Studio is a single application that runs on your desktop and on the
            Vikshep hosted plane. Both shells use the same engine, so a cloud
            result and a local result for the same input are identical bytes —
            verifiable by anyone with the free conformance tool.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="/download"
              style={{
                ...mono,
                color: "var(--bg)",
                backgroundColor: "var(--ink)",
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Download →
            </a>
            <a
              href="/pricing"
              style={{
                ...mono,
                color: "var(--ink)",
                border: "1px solid var(--rule)",
                padding: "10px 20px",
                textDecoration: "none",
              }}
            >
              Editions and pricing →
            </a>
          </div>
        </div>
      </header>

      {/* Three pillars */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Three pillars</p>
          <h2 style={h2}>Simulate. Analyze. Prove.</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 1,
            backgroundColor: "var(--rule)",
          }}>
            {PILLARS.map((p) => (
              <div
                key={p.label}
                style={{
                  backgroundColor: "var(--bg)",
                  padding: "40px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <div>
                  <span style={{
                    fontFamily: "var(--font-source-serif), Georgia, serif",
                    fontSize: 32,
                    fontWeight: 300,
                    color: "var(--accent)",
                    display: "block",
                    marginBottom: 8,
                  }}>
                    {p.symbol}
                  </span>
                  <p style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-mute)", marginBottom: 6 }}>
                    {p.sub}
                  </p>
                  <h3 style={h3}>{p.label}</h3>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>{p.body}</p>
                <p style={{ ...mono, fontSize: 12, color: "var(--ink-mute)", paddingTop: 12, borderTop: "1px solid var(--rule)" }}>
                  {p.detail}
                </p>

                {/* Screenshot placeholder */}
                <div style={screenshotPlaceholder}>
                  <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)" }}>
                    Screenshot placeholder
                  </p>
                  <p style={{ fontSize: 12, color: "var(--ink-mute)", maxWidth: 280, textAlign: "center", lineHeight: 1.5 }}>
                    {p.screenshotAlt}
                  </p>
                  <p style={{ ...mono, fontSize: 10, color: "var(--rule)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    Owner to supply
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Determinism tiers */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>VDS-1 — Vikshep Determinism Specification</p>
          <h2 style={h2}>What "deterministic" means, exactly.</h2>
          <p style={{ ...prose, marginBottom: 40 }}>
            VDS-1 defines three tiers. Every Vikshep computation declares which
            tier its outputs belong to. The certificate records this alongside the
            engine version and conformance evidence.{" "}
            <a href="/determinism" style={{ color: "var(--ink)" }}>
              Plain-language explanation →
            </a>
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 760 }}>
            {VDS_TIERS.map((tier, i) => (
              <div
                key={tier.id}
                style={{
                  padding: "28px 0",
                  borderBottom: i < VDS_TIERS.length - 1 ? "1px solid var(--rule)" : "none",
                  display: "grid",
                  gridTemplateColumns: "120px 1fr",
                  gap: 24,
                  alignItems: "start",
                }}
              >
                <div>
                  <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", marginBottom: 4 }}>
                    {tier.id}
                  </p>
                  <p style={{ ...mono, fontSize: 12, color: "var(--ink)", lineHeight: 1.4 }}>
                    {tier.label}
                  </p>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>{tier.body}</p>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 32,
            padding: "16px 20px",
            border: "1px solid var(--rule)",
            borderLeft: "2px solid var(--accent)",
            maxWidth: 640,
          }}>
            <p style={{ ...mono, fontSize: 12, color: "var(--ink)", lineHeight: 1.6 }}>
              Free offline verifier:{" "}
              <code style={{ color: "var(--accent)" }}>vikshep-conformance verify &lt;certificate&gt; --inputs &lt;dir&gt;</code>
              {" "}— re-runs the recorded computation with the open CPU reference and compares
              every output OID. Prints VERIFIED or MISMATCH. Works fully offline.
            </p>
          </div>
        </div>
      </section>

      {/* Desktop and hosted */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Two shells, one engine</p>
          <h2 style={h2}>Desktop. Hosted. Same bytes.</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 1,
            backgroundColor: "var(--rule)",
          }}>
            <div style={{ backgroundColor: "var(--bg)", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-mute)" }}>Desktop</p>
              <h3 style={h3}>Run on your hardware</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>
                The Tauri desktop application bundles the engine and runs compute locally
                on CPU or GPU (Metal on macOS, CUDA on Linux/Windows). Data never leaves
                your facility. Optional burst-to-cloud routes individual jobs through your
                org API key.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "CPU reference backend — VDS-1 Tier 1 certified",
                  "Metal (macOS 13+) — in development",
                  "CUDA (Linux / Windows) — in development",
                  "Offline licence verification (Ed25519, 24h lease)",
                  "2 concurrent devices per seat",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="/download" style={{ ...mono, fontSize: 13, color: "var(--ink)", border: "1px solid var(--rule)", padding: "10px 20px", textDecoration: "none", alignSelf: "flex-start" }}>
                Download →
              </a>
            </div>
            <div style={{ backgroundColor: "var(--bg-elev)", padding: "36px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-mute)" }}>Hosted</p>
              <h3 style={h3}>Run on Vikshep workers</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>
                The same Studio application served at{" "}
                {APP_BASE ? (
                  <a href={APP_BASE} style={{ color: "var(--ink)" }}>{APP_BASE.replace("https://", "")}</a>
                ) : (
                  "the Vikshep hosted plane"
                )}
                , authenticated by your account. Compute runs on managed CPU and GPU
                workers. Results are content-addressed (28-char OIDs) and carry the same
                VDS-1 certificates as local runs.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {[
                  "CPU workers — VDS-1 Tier 1 certified",
                  "GPU workers — in development",
                  "Metered by dataset-shard and scattering run",
                  "Results stored in content-addressed blob storage",
                  "7-day trial + 900 GPU-seconds (Lab tier)",
                ].map((item) => (
                  <li key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
                    {item}
                  </li>
                ))}
              </ul>
              {APP_BASE ? (
                <a href={`${APP_BASE}/signin`} style={{ ...mono, fontSize: 13, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "10px 20px", textDecoration: "none", alignSelf: "flex-start" }}>
                  Open Studio →
                </a>
              ) : (
                <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Studio%20hosted" style={{ ...mono, fontSize: 13, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "10px 20px", textDecoration: "none", alignSelf: "flex-start" }}>
                  Contact for access →
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Docs links */}
      <section style={sec(false)}>
        <div style={wrap}>
          <p style={eyebrow}>Documentation</p>
          <h2 style={{ ...h2, marginBottom: 28 }}>Read the docs</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, backgroundColor: "var(--rule)", maxWidth: 720 }}>
            {[
              { label: "Studio overview", href: "/docs/studio", desc: "Screens, workspace, projects" },
              { label: "Simulate", href: "/docs/simulate", desc: "Geant4 ingest workflow" },
              { label: "Verify", href: "/docs/verify", desc: "Verifying determinism certificates" },
              { label: "Install", href: "/docs/install", desc: "CLI setup and prerequisites" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  backgroundColor: "var(--bg)",
                  padding: "24px 20px",
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <p style={{ ...mono, fontSize: 13, color: "var(--ink)" }}>{link.label} →</p>
                <p style={{ fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>{link.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

    </article>
  );
}
