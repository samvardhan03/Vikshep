import Link from "next/link";

export const metadata = { title: "Pilot" };

// ── shared tokens ─────────────────────────────────────────────────
const eyebrow: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "var(--accent)",
  marginBottom: 10,
};
const h2: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(20px,2.4vw,32px)",
  color: "var(--ink)",
  marginBottom: 20,
  lineHeight: 1.2,
};
const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.78,
  color: "var(--ink-mute)",
  maxWidth: 680,
  marginBottom: 16,
};
const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};
const sec: React.CSSProperties = {
  padding: "64px 0",
  borderBottom: "1px solid var(--rule)",
};
const monoSm: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
};
const card: React.CSSProperties = {
  border: "1px solid var(--rule)",
  padding: "24px 28px",
  backgroundColor: "var(--bg-elev)",
};

// ── Result number tile ─────────────────────────────────────────────
function ResultTile({
  label,
  value,
  unit,
  note,
  pending,
}: {
  label: string;
  value: string;
  unit?: string;
  note: string;
  pending?: boolean;
}) {
  return (
    <div style={card}>
      <p
        style={{
          ...monoSm,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "var(--ink-mute)",
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "var(--font-jetbrains), monospace",
          fontSize: 36,
          fontWeight: 700,
          color: pending ? "var(--ink-mute)" : "var(--ink)",
          opacity: pending ? 0.35 : 1,
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 16, fontWeight: 400, marginLeft: 4, color: "var(--ink-mute)" }}>
            {unit}
          </span>
        )}
      </p>
      <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)" }}>{note}</p>
    </div>
  );
}

// ── Timeline step ─────────────────────────────────────────────────
function TimelineStep({
  date,
  label,
  done,
}: {
  date: string;
  label: string;
  done: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        paddingBottom: 20,
      }}
    >
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: done ? "var(--ink)" : "transparent",
          border: "1.5px solid var(--ink)",
          flexShrink: 0,
          marginTop: 3,
        }}
      />
      <div>
        <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginBottom: 2 }}>{date}</p>
        <p style={{ ...monoSm, fontSize: 13, color: done ? "var(--ink)" : "var(--ink-mute)" }}>
          {label}
        </p>
      </div>
    </div>
  );
}

export default function PilotPage() {
  return (
    <article>
      {/* ── Hero ── */}
      <header style={{ ...sec, paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Live pilot</p>
          <h1
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(32px,4.5vw,68px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            University of Edinburgh
            <br />
            boosted di-boson resonance search
          </h1>
          <p
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(16px,1.8vw,22px)",
              color: "var(--ink-mute)",
              maxWidth: 580,
              lineHeight: 1.5,
              marginBottom: 32,
            }}
          >
            First real-world deployment. Real Geant4 data. Real benchmark.
          </p>

          {/* Status badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid var(--rule)",
              padding: "8px 16px",
              ...monoSm,
              fontSize: 12,
              color: "var(--ink-mute)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#C2461F",
                display: "inline-block",
                animation: "none",
              }}
            />
            In progress — results expected Q1 2026
          </div>
        </div>
      </header>

      {/* ── The analysis ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>The analysis</p>
          <h2 style={h2}>Boosted di-boson resonance search with mass-decorrelated jet tagging</h2>
          <p style={prose}>
            The search targets a heavy resonance X decaying to a pair of electroweak bosons
            (H → ZV, W&#x2032; → WZ, Z&#x2032; → ZH) in the boosted regime, where the decay products
            of each boson merge into a single large-radius fat jet. The analysis reconstructs two
            fat jets and searches for a bump in the reconstructed di-jet invariant mass m_jj above
            a smoothly-falling QCD background.
          </p>
          <p style={prose}>
            The mass sculpting problem is acute in this topology. A boosted-object tagger trained
            to separate W/Z/H jets from QCD will learn the jet mass as a discriminating feature:
            signal jets have a characteristic mass around 80–125 GeV; QCD jets have a steeply
            falling mass distribution. Any cut on the tagger score preferentially removes
            low-mass QCD background, carving a bump-shaped enhancement into the m_jj spectrum
            at the signal hypothesis. A bump-hunt that treats the tagger as mass-decorrelated
            will attribute this enhancement to a new resonance. The significance is fake.
          </p>
          <p style={prose}>
            The existing analysis pipeline uses a neural network tagger trained on eight high-level
            kinematic variables per fat jet:{" "}
            <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
              lep1_pt, lep2_pt, fatjet_pt, fatjet_eta, fatjet_D2, Zll_mass, Zll_pt, MET
            </code>
            . Vikshep replaces this tagger with constituent-level wavelet scattering features plus
            the DisCo mass-decorrelation penalty. The physics reach is measured by two numbers
            against the same Wilks Δχ² significance pipeline the analysis already uses.
          </p>
        </div>
      </section>

      {/* ── The data ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>The data</p>
          <h2 style={h2}>Geant4-simulated ATLAS samples</h2>
          <p style={prose}>
            The pilot runs on Geant4-simulated ATLAS detector response with full detector
            geometry. Signal samples cover gg → H → ZV at four resonance mass points
            (700, 1000, 1500, 2000 GeV). Background samples include diboson production (WW, WZ, ZZ),
            Z+jets (with up to four additional partons), and semi-leptonic top-quark pair production.
          </p>
          <p style={prose}>
            Each fat jet is reconstructed with the anti-k_T algorithm at R=1.0 and trimmed with
            f_cut=0.05. Constituent four-vectors are read directly from the ROOT TTree output of the
            ATLAS analysis framework. The jet image rasterisation is handled by the Vikshep ingest
            step at 64×64 bins in (η, φ) centred on the fat jet axis.
          </p>

          {/* Data table */}
          <div style={{ overflowX: "auto", marginTop: 8 }}>
            <table
              style={{
                borderCollapse: "collapse",
                ...monoSm,
                fontSize: 12,
                width: "100%",
                maxWidth: 720,
              }}
            >
              <thead>
                <tr>
                  {["sample", "process", "mass points", "N_events"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "8px 14px",
                        borderBottom: "1px solid var(--rule)",
                        color: "var(--ink-mute)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontSize: 10,
                        backgroundColor: "var(--bg-elev)",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["Signal", "gg → H → ZV", "700, 1000, 1500, 2000 GeV", "50k per point"],
                  ["Background", "Diboson (WW/WZ/ZZ)", "—", "200k"],
                  ["Background", "Z+jets (up to 4j)", "—", "500k"],
                  ["Background", "tt̄ (semi-leptonic)", "—", "300k"],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    {row.map((cell, j) => (
                      <td
                        key={j}
                        style={{
                          padding: "10px 14px",
                          color: j === 0 ? "var(--ink)" : "var(--ink-mute)",
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── The benchmark ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>The benchmark</p>
          <h2 style={h2}>Two numbers. Apples-to-apples.</h2>
          <p style={prose}>
            The benchmark is computed against the analysis&#x2019;s own Wilks Δχ² significance
            pipeline — the same code the collaboration uses to quote significance in the paper.
            No new significance metric, no cherry-picked working point. Two numbers are reported:
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              margin: "28px 0",
              maxWidth: 600,
            }}
          >
            <ResultTile
              label="Δσ — significance gain"
              value="TBD"
              note="Standard deviations above the NN baseline at the same cut efficiency"
              pending
            />
            <ResultTile
              label="ΔJSD — sculpting reduction"
              value="TBD"
              note="Jensen–Shannon divergence pre→post cut, relative to the NN baseline"
              pending
            />
          </div>

          <p style={prose}>
            <strong style={{ color: "var(--ink)" }}>Success criterion:</strong> Vikshep achieves
            equal or higher Δσ at strictly lower ΔJSD. A higher-significance result that sculpts
            more than the NN baseline is not a success — it would trade a physics guarantee for
            a statistical number. The goal is to demonstrate that the two objectives are not in
            tension: you can have both.
          </p>

          <div style={{ ...card, maxWidth: 580, marginTop: 8 }}>
            <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Benchmark protocol
            </p>
            {[
              "Fix cut efficiency to the NN baseline working point (ε_sig = 0.70)",
              "Compute m_jj spectrum before and after the Vikshep cut",
              "Measure JSD between pre- and post-cut background distributions",
              "Run Wilks Δχ² fit on the post-cut m_jj spectrum at each signal mass point",
              "Report Δσ = σ_Vikshep − σ_NN at the same ε_sig and compare ΔJSD",
            ].map((step, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "8px 0",
                  borderBottom: i < 4 ? "1px solid var(--rule)" : "none",
                }}
              >
                <span style={{ ...monoSm, fontSize: 11, color: "var(--accent)", flexShrink: 0 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ ...monoSm, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Status ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Status & results</p>
          <h2 style={h2}>Currently in progress.</h2>

          <div style={{ display: "flex", flexDirection: "column", maxWidth: 420 }}>
            <TimelineStep date="Q4 2025" label="Geant4 sample preparation and ROOT TTree export" done={true} />
            <TimelineStep date="Q4 2025" label="Ingest pipeline and jet image rasterisation validated" done={true} />
            <TimelineStep date="Q4 2025" label="Scattering feature extraction on full background sample" done={true} />
            <TimelineStep date="Q1 2026" label="DisCo classifier training and hyperparameter sweep" done={false} />
            <TimelineStep date="Q1 2026" label="Wilks Δχ² benchmark run against NN baseline" done={false} />
            <TimelineStep date="Q1 2026" label="Results published here and on GitHub" done={false} />
          </div>

          <div
            style={{
              ...card,
              maxWidth: 540,
              marginTop: 24,
              borderLeft: "3px solid var(--ink)",
            }}
          >
            <p style={{ ...monoSm, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.7 }}>
              Results expected Q1 2026. When available, the two benchmark numbers (Δσ and ΔJSD)
              will appear above, and the post-cut m_jj histograms for both taggers will be
              published as a ROOT file in the pilot directory of the GitHub repo.
            </p>
          </div>
        </div>
      </section>

      {/* ── Reproduce ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Reproduce</p>
          <h2 style={h2}>The full harness is in the repo.</h2>
          <p style={prose}>
            The pilot analysis harness — data loading, scattering configuration, DisCo training
            loop, and Wilks significance pipeline — lives in{" "}
            <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>
              Vikshep/pilot/
            </code>{" "}
            in the GitHub repository. To reproduce:
          </p>

          <ol
            style={{
              ...monoSm,
              fontSize: 13,
              color: "var(--ink-mute)",
              lineHeight: 1.9,
              paddingLeft: 20,
              maxWidth: 620,
              marginBottom: 24,
            }}
          >
            <li>
              Clone the repo:{" "}
              <code style={{ color: "var(--ink)" }}>
                git clone https://github.com/samvardhan03/Vikshep
              </code>
            </li>
            <li>
              Install dependencies:{" "}
              <code style={{ color: "var(--ink)" }}>pip install vikshep &amp;&amp; cargo install omnipulse-mcp</code>
            </li>
            <li>
              Obtain the Geant4 samples (see{" "}
              <code style={{ color: "var(--ink)" }}>pilot/README.md</code> for access instructions)
            </li>
            <li>
              Run the harness:{" "}
              <code style={{ color: "var(--ink)" }}>bun run pilot/run.ts --config pilot/uoe-diboson.yaml</code>
            </li>
            <li>
              Results are written to{" "}
              <code style={{ color: "var(--ink)" }}>pilot/results/</code> as JSON + ROOT files
            </li>
          </ol>

          <a
            href="https://github.com/samvardhan03/Vikshep/tree/main/pilot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...monoSm,
              fontSize: 13,
              color: "var(--ink)",
              textDecoration: "none",
              border: "1px solid var(--rule)",
              padding: "10px 18px",
              display: "inline-block",
            }}
          >
            View pilot/ on GitHub ↗
          </a>
        </div>
      </section>

      {/* ── Acknowledgements ── */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={eyebrow}>Acknowledgements</p>
          <h2 style={h2}>Built with.</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
              maxWidth: 780,
            }}
          >
            <div style={card}>
              <p style={{ ...monoSm, fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
                Research partner
              </p>
              <p style={{ ...monoSm, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>
                University of Edinburgh
              </p>
              <p style={{ ...monoSm, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                Nuclear physics researcher (name withheld pending permission). Provided
                the Geant4 samples, the existing analysis notebook, and the Wilks Δχ²
                significance pipeline used as the benchmark baseline.
              </p>
            </div>
            <div style={card}>
              <p style={{ ...monoSm, fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
                Simulation framework
              </p>
              <p style={{ ...monoSm, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>
                ATLAS + Geant4
              </p>
              <p style={{ ...monoSm, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                Detector simulation produced with the ATLAS detector Geant4 implementation.
                Jet reconstruction performed with the FastJet anti-k_T algorithm (R=1.0).
                ATLAS Open Data release used where applicable.
              </p>
            </div>
            <div style={card}>
              <p style={{ ...monoSm, fontSize: 11, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 10 }}>
                Theory baseline
              </p>
              <p style={{ ...monoSm, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>
                DisCo — Kasieczka &amp; Shih (2020)
              </p>
              <p style={{ ...monoSm, fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.6 }}>
                The DisCo distance-correlation penalty is the closed-form mass-decorrelation
                guarantee used in the classifier training step. See{" "}
                <a
                  href="https://arxiv.org/abs/2001.05310"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--ink)" }}
                >
                  arXiv:2001.05310
                </a>
                .
              </p>
            </div>
          </div>

          {/* Bottom CTA */}
          <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20pilot"
              style={{
                ...monoSm,
                fontSize: 13,
                color: "var(--bg)",
                textDecoration: "none",
                backgroundColor: "var(--ink)",
                padding: "10px 20px",
                display: "inline-block",
              }}
            >
              Talk to founders about your analysis →
            </a>
            <Link
              href="/recipes/hep-tagging"
              style={{
                ...monoSm,
                fontSize: 13,
                color: "var(--ink)",
                textDecoration: "none",
                border: "1px solid var(--rule)",
                padding: "10px 20px",
                display: "inline-block",
              }}
            >
              HEP Tagging recipe →
            </Link>
            <Link
              href="/math#s6"
              style={{
                ...monoSm,
                fontSize: 13,
                color: "var(--ink-mute)",
                textDecoration: "none",
                border: "1px solid var(--rule)",
                padding: "10px 20px",
                display: "inline-block",
              }}
            >
              Mass decorrelation math →
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
