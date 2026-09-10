export const metadata = { title: "API Reference — Vikshep Docs" };

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
  marginTop: 48,
};

const h3Style: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 14,
  color: "var(--ink)",
  marginTop: 32,
  marginBottom: 8,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
};

const code: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 13,
  background: "var(--bg-elev)",
  padding: "2px 6px",
  border: "1px solid var(--rule)",
};

const pre: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 13,
  background: "var(--ink)",
  color: "var(--bg)",
  padding: "16px 20px",
  overflowX: "auto",
  lineHeight: 1.6,
  marginTop: 12,
  marginBottom: 12,
};

const table: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: 14,
  marginTop: 12,
  marginBottom: 24,
};

const th: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: "var(--ink-mute)",
  textAlign: "left",
  padding: "8px 12px 8px 0",
  borderBottom: "1px solid var(--rule)",
};

const td: React.CSSProperties = {
  padding: "10px 12px 10px 0",
  borderBottom: "1px solid var(--rule)",
  verticalAlign: "top",
  color: "var(--ink-mute)",
  fontSize: 14,
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", padding: "0 24px" };
const sec: React.CSSProperties = { padding: "64px 0", borderBottom: "1px solid var(--rule)" };

const API_BASE = process.env.NEXT_PUBLIC_VIKSHEP_API_BASE ?? "https://api.vikshep.dev";

export default function ApiReferencePage() {
  return (
    <article>
      <header style={{ ...sec, paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Docs / API</p>
          <h1 style={h1Style}>Compute API reference</h1>
          <p style={{ ...prose, maxWidth: 640 }}>
            The Vikshep Compute API accepts physics analysis jobs, returns job IDs for async
            polling, and streams results as JSON. All endpoints require a Bearer API key issued
            through your{" "}
            <a href="/account/keys" style={{ color: "var(--ink)" }}>account</a>.
          </p>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink-mute)", marginTop: 12 }}>
            Base URL: <code style={code}>{API_BASE}</code>
          </p>
        </div>
      </header>

      {/* Auth */}
      <section style={sec}>
        <div style={wrap}>
          <h2 style={h2Style}>Authentication</h2>
          <p style={prose}>
            Include your API key in every request as an HTTP Bearer token:
          </p>
          <pre style={pre}>
{`Authorization: Bearer vsk_your_key_here`}
          </pre>
          <p style={prose}>
            Keys begin with <code style={code}>vsk_</code> and are shown once at creation.
            A revoked or unknown key returns <code style={code}>401 UNKNOWN_KEY</code> or{" "}
            <code style={code}>401 KEY_REVOKED</code>.
          </p>
        </div>
      </section>

      {/* Jobs endpoints */}
      <section style={sec}>
        <div style={wrap}>
          <h2 style={h2Style}>Job endpoints</h2>

          <h3 style={h3Style}>POST /api/jobs — Submit a job</h3>
          <p style={prose}>Submit a recipe for execution. Returns immediately with a job ID.</p>
          <pre style={pre}>
{`curl -X POST ${API_BASE}/api/jobs \\
  -H "Authorization: Bearer vsk_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "recipe": "recipe_tag",
    "input": {
      "manifest_path": "/data/manifest.json",
      "label": "is_signal",
      "protect": "jet_mass"
    },
    "gpu_seconds_requested": 120
  }'`}
          </pre>
          <p style={{ ...prose, marginBottom: 8 }}>Request body:</p>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Field</th>
                <th style={th}>Type</th>
                <th style={th}>Required</th>
                <th style={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["recipe", "string", "yes", "One of the supported op names (see table below)"],
                ["input", "object", "yes", "Recipe-specific parameters"],
                ["gpu_seconds_requested", "number", "no", "Requested budget (default: 60). Clamped to remaining quota."],
              ].map(([f, t, r, d]) => (
                <tr key={f}>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>{f}</td>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>{t}</td>
                  <td style={td}>{r}</td>
                  <td style={td}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ ...prose, marginBottom: 8 }}>Response (202 Accepted):</p>
          <pre style={pre}>
{`{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "recipe": "recipe_tag",
  "message": "Job queued. Poll /api/jobs/[id] for status."
}`}
          </pre>

          <h3 style={h3Style}>GET /api/jobs/[id] — Poll job status</h3>
          <pre style={pre}>
{`curl ${API_BASE}/api/jobs/550e8400-e29b-41d4-a716-446655440000 \\
  -H "Authorization: Bearer vsk_your_key"`}
          </pre>
          <pre style={pre}>
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "recipe": "recipe_tag",
  "status": "done",
  "result": {
    "output": { "auc": 0.97, "dcorr2": 0.001, ... },
    "wall_clock_seconds": 14.2
  },
  "gpu_seconds_used": 15,
  "queued_at": "2026-09-10T09:00:00Z",
  "finished_at": "2026-09-10T09:00:15Z"
}`}
          </pre>
          <p style={prose}>
            <code style={code}>status</code> transitions: <code style={code}>queued</code> →{" "}
            <code style={code}>running</code> → <code style={code}>done</code> or{" "}
            <code style={code}>failed</code>. Poll every 2–5 seconds.
          </p>
        </div>
      </section>

      {/* Supported ops */}
      <section style={sec}>
        <div style={wrap}>
          <h2 style={h2Style}>Supported recipes (CPU mode)</h2>
          <p style={prose}>
            GPU-accelerated scattering ops are pending hardware provisioning. CPU recipe ops are
            available now.
          </p>
          <table style={{ ...table, marginTop: 24 }}>
            <thead>
              <tr>
                <th style={th}>Recipe</th>
                <th style={th}>Status</th>
                <th style={th}>Required input fields</th>
                <th style={th}>Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["ingest_g4", "available", "csv_path, schema? (default: komal_v1)", "Ingest Geant4 CSV → manifest.json"],
                ["recipe_tag", "available", "manifest_path, label, protect, weights?, lambda?", "Particle tagging with DisCo decorrelation"],
                ["recipe_calibrate", "available", "manifest_path, target", "Detector calibration regression"],
                ["scatter", "GPU pending", "—", "Wavelet-scattering feature extraction (GPU required)"],
                ["sw1-graph", "GPU pending", "—", "SW1 graph pipeline (GPU required)"],
              ].map(([r, s, i, d]) => (
                <tr key={r}>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>{r}</td>
                  <td style={{ ...td, color: s === "available" ? "var(--ink)" : "var(--signal-warm)", fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>{s}</td>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>{i}</td>
                  <td style={td}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Error vocabulary */}
      <section style={sec}>
        <div style={wrap}>
          <h2 style={h2Style}>Error vocabulary</h2>
          <table style={{ ...table, marginTop: 16 }}>
            <thead>
              <tr>
                <th style={th}>Status</th>
                <th style={th}>error code</th>
                <th style={th}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["401", "MISSING_KEY", "No Authorization header"],
                ["401", "UNKNOWN_KEY", "Key not found in keystore"],
                ["401", "KEY_REVOKED", "Key has been revoked"],
                ["402", "PAYMENT_REQUIRED", "No active entitlement or quota exhausted"],
                ["402", "TRIAL_BUDGET_EXHAUSTED", "Trial GPU-seconds depleted"],
                ["400", "UNSUPPORTED_OP", "Recipe not in CPU allowlist (GPU_PENDING or UNKNOWN_RECIPE)"],
                ["400", "MISSING_FIELD", "Required request field absent"],
                ["429", "QUOTA_EXHAUSTED", "Per-org rate limit exceeded"],
                ["503", "KV_UNREACHABLE", "Entitlement cache unavailable; request denied (fail-closed)"],
              ].map(([s, e, m]) => (
                <tr key={e}>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>{s}</td>
                  <td style={{ ...td, fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>{e}</td>
                  <td style={td}>{m}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Quota semantics */}
      <section style={sec}>
        <div style={wrap}>
          <h2 style={h2Style}>Quota semantics</h2>
          <p style={prose}>
            GPU-seconds are billed by actual wall-clock compute time, clamped to the budget
            requested in the job. Budget is clamped to your remaining quota at submit time — if
            remaining is 30s and you request 60s, the job runs with a 30s budget (and the job
            succeeds if it finishes within 30s).
          </p>
          <p style={{ ...prose, marginTop: 12 }}>
            Trial quota: {process.env.NEXT_PUBLIC_TRIAL_GPU_SECONDS ?? "900"} GPU-seconds per
            verified email, shared across all trial jobs. A running job is allowed to complete
            when the budget expires; the <em>next</em> submitted job receives{" "}
            <code style={code}>402 TRIAL_BUDGET_EXHAUSTED</code>.
          </p>
        </div>
      </section>

      {/* Next steps */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={eyebrow}>Next steps</p>
          <div style={{ display: "flex", gap: 32 }}>
            <a href="/docs/quickstart" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, color: "var(--ink)" }}>
              Quickstart →
            </a>
            <a href="/pricing" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 14, color: "var(--ink)" }}>
              Pricing & trial →
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
