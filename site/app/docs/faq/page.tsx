export const metadata = { title: "FAQ — Docs" };

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
  marginBottom: 24,
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

const FAQ = [
  {
    section: "AGPL-3.0 and licensing",
    items: [
      {
        q: "What is AGPL-3.0 and what does it mean for my analysis?",
        a: "AGPL-3.0 is a copyleft license. If you use Vikshep as a library in your own code and distribute that code — including over a network (e.g. a hosted service) — your code must also be licensed under AGPL-3.0 and its source must be made available. If you only use Vikshep locally for your own analysis and do not distribute it, the copyleft does not propagate. Running Vikshep on your own workstation or cluster for your own analyses is always free.",
      },
      {
        q: "Can I publish results produced with the Free tier?",
        a: "Yes. There are no restrictions on publishing results. We ask that you cite Vikshep in any paper (BibTeX is available on the /pilot page). A reference implementation section describing the pipeline version and parameters is sufficient.",
      },
      {
        q: "When do I need a commercial license?",
        a: "You need a commercial license if: (a) you are deploying Vikshep as part of a proprietary product or service and cannot comply with AGPL-3.0's source-disclosure requirement, or (b) you are a company using Vikshep in production and want SLA support. Academic and research use — including at commercial laboratories — is covered by the AGPL as long as results are openly published.",
      },
      {
        q: "Does the license apply to the engine binaries?",
        a: "The engine binaries (vikshep wheel, omnipulse-mcp) ship under a separate proprietary license — the Vikshep Engine Binary Terms. Research and evaluation use of the binaries is free. Commercial deployment of the binaries requires a license. See LICENSING.md in the repo.",
      },
    ],
  },
  {
    section: "Free vs. hosted",
    items: [
      {
        q: "Does the Free tier include GPU acceleration?",
        a: "CPU inference is available in the Free tier — all loaders, the ingest pipeline, DisCo recipes, and the benchmark harness run without GPU. No tier runs the scattering transform yet: the open deterministic scattering core is in development, and GPU acceleration is planned.",
      },
      {
        q: "What is the trial and how does it work?",
        a: "The trial grants access to the hosted plane (GPU scattering runs, hosted ingest) with a dual cap: a fixed number of days and a fixed GPU-second budget. Both caps are enforced server-side. No card is required; one trial per verified email. The download itself — the AGPL source, the CLI tools, all loaders — never expires and is always free.",
      },
      {
        q: "What happens when my trial expires?",
        a: "The hosted API returns 402 with a reason code (TRIAL_EXPIRED or TRIAL_BUDGET_EXHAUSTED) and a link to /pricing. Your local CLI tools and downloaded data are unaffected — they run indefinitely. You can renew by purchasing a Lab entitlement.",
      },
      {
        q: "Can I use Vikshep for Well-scale ingest (TB+)?",
        a: "The Well loader is available in the Free tier for local CPU use. Hosted Well-scale ingest above 1 TB requires Lab or Enterprise — the hosted engine handles chunking, fan-out, and cost allocation across many GPU nodes.",
      },
    ],
  },
  {
    section: "Technical",
    items: [
      {
        q: "What does 'nothing learned' mean exactly?",
        a: "It describes the feature plane. The wavelet filters are analytic Morlets — their shape is determined by three geometry parameters (J, Q, L) chosen before any data is seen. No gradient step, no training loop, no adaptation. Translation invariance and stability under deformations are theorems about the scattering transform, not empirical claims about a trained model. The scattering transform is being delivered by the open deterministic core, which is in development; the released CLI does not run it yet. Today the CLI ingests Geant4 output, computes per-event aggregates, and trains calibration and DisCo-penalised tagging models on those aggregates. Those models are learned, and the tag report says how: training_gradient \"pearson_proxy\", reported_dcorr2 \"exact_weighted\".",
      },
      {
        q: "What is a 28-char OID and why does it appear in the manifest?",
        a: "An OID (Object ID) is the first 14 bytes of the SHA3-256 hash of a tensor buffer, encoded as 28 lowercase hex characters. It is the only handle for a tensor that crosses the AGPL boundary into the proprietary engine. Raw float tensors live in POSIX shared memory and never reach TypeScript, the browser, or any network. The OID uniquely identifies the tensor for caching and provenance logging.",
      },
      {
        q: "Is Vikshep reproducible across machines?",
        a: "Deterministic by design. Tested today: byte-identical reports under a fixed seed on the same machine (backend/ingest/tests/test_bench_determinism.py). Cross-platform bit identity is the target of the VDS-1 conformance suite, verified in public CI once released. Until then, do not assume bit identity across machines or operating systems. The SHA3-256 OID is a content address: identical bytes always give the same OID.",
      },
      {
        q: "How do I use a Geant4 ntuple format other than komal_v1?",
        a: "Use --schema generic with a --column-map JSON argument: vikshep-ingest g4 data.csv --schema generic --column-map '{\"phi\":\"angle_phi\",\"theta\":\"angle_theta\",\"momentum\":\"p_mag\"}'. The komal_v1 schema (event_id, layer, phi, theta, momentum[, energy]) is the default because it was the first schema tested with a physics collaborator.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <article>
      <p style={eyebrow}>FAQ</p>
      <h1 style={h1Style}>Frequently asked questions</h1>

      {FAQ.map((section) => (
        <div key={section.section} style={{ marginBottom: 48 }}>
          <p
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "var(--ink-mute)",
              marginBottom: 16,
              paddingBottom: 8,
              borderBottom: "1px solid var(--rule)",
            }}
          >
            {section.section}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {section.items.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "20px 0",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-jetbrains), monospace",
                    fontSize: 13,
                    color: "var(--ink)",
                    marginBottom: 8,
                    lineHeight: 1.5,
                  }}
                >
                  {item.q}
                </p>
                <p style={{ ...prose, fontSize: 14, lineHeight: 1.7 }}>
                  {item.a.split(/(`[^`]+`)/).map((part, j) =>
                    part.startsWith("`") && part.endsWith("`") ? (
                      <code key={j} style={code}>
                        {part.slice(1, -1)}
                      </code>
                    ) : (
                      part
                    )
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div
        style={{
          padding: "24px",
          backgroundColor: "var(--bg-elev)",
          border: "1px solid var(--rule)",
          marginTop: 16,
        }}
      >
        <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginBottom: 8 }}>
          More questions?
        </p>
        <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.65 }}>
          Reach us at{" "}
          <a
            href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20question"
            style={{ color: "var(--ink)" }}
          >
            shekhawatsamvardhan@gmail.com
          </a>{" "}
          or open an issue on{" "}
          <a
            href="https://github.com/samvardhan03/Vikshep/issues"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </article>
  );
}
