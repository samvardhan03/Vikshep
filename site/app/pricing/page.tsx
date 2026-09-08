export const metadata = { title: "Pricing" };

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
  fontSize: "clamp(20px,2.4vw,30px)",
  color: "var(--ink)",
  marginBottom: 16,
  lineHeight: 1.2,
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
const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 640,
};

const TIERS = [
  {
    name: "Free",
    sub: "AGPL-3.0 self-host",
    price: "$0",
    priceNote: "forever",
    audience: "Research groups, open-source projects, academic collaborations.",
    features: [
      "Full ingest pipeline: Geant4 CSV, Well HDF5, ROOT TTrees",
      "Wavelet-scattering feature extraction (CPU)",
      "DisCo mass-decorrelation training and calibration CLIs",
      "Benchmark harness (Asimov proxy, JSD)",
      "21-test Well adapter suite + G4 adapter suite",
      "AGPL-3.0 — source available, modifications must be open",
      "Community support via GitHub Issues",
    ],
    cta: { label: "Clone on GitHub →", href: "https://github.com/samvardhan03/Vikshep", external: true },
    highlight: false,
  },
  {
    name: "Lab",
    sub: "Hosted metered",
    price: "Contact",
    priceNote: "per analysis run",
    audience: "Research groups that want hosted compute, managed GPU access, or SLA support.",
    trial: "Free trial: 7 days + 900 GPU-seconds, no card required. One per verified email.",
    features: [
      "Everything in Free",
      "GPU-accelerated engine binaries (no build required)",
      "Hosted ingest and scattering endpoint",
      "Metered billing per dataset-shard processed",
      "Priority email support",
      "Results validated by the Vikshep team before delivery",
      "Private pilot: cite Vikshep in your paper (optional)",
    ],
    cta: { label: "Contact for Lab access →", href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Lab%20tier", external: false },
    trialCta: { label: "Request trial →", href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Lab%20trial" },
    highlight: true,
  },
  {
    name: "Enterprise",
    sub: "Commercial license",
    price: "Contact",
    priceNote: "annual",
    audience: "Experiment collaborations, industrial R&D, and proprietary deployments.",
    features: [
      "Everything in Lab",
      "Commercial license — no AGPL copyleft requirements",
      "On-premise deployment with SLA",
      "Custom loader development (ROOT schema, VTK, detector formats)",
      "Dedicated integration engineering",
      "Signed NDA; data never leaves your facility",
      "Priority feature roadmap input",
    ],
    cta: { label: "Contact for Enterprise →", href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Enterprise", external: false },
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Is the engine source available?",
    a: "The control plane (ingest, DisCo, recipes, site) is AGPL-3.0 — full source in the GitHub repo. The GPU engine ships as binaries under a separate proprietary license. Research use of the binaries is free; commercial deployment requires a license.",
  },
  {
    q: "What does AGPL-3.0 mean for my analysis code?",
    a: "If you use Vikshep as a library in your own code and distribute that code (including over a network), your code must also be AGPL-3.0. If you only use Vikshep locally for your own analysis and do not distribute it, the copyleft does not propagate. For any doubt, use the Enterprise tier.",
  },
  {
    q: "Can I publish results produced with the Free tier?",
    a: "Yes. There are no restrictions on publishing results. We ask that you cite Vikshep in any paper (BibTeX on the /pilot page).",
  },
  {
    q: "How is Lab metered billing calculated?",
    a: "Billing is per dataset-shard ingested and per scattering run. Contact us for current rates and volume discounts.",
  },
  {
    q: "Does the Free tier include GPU acceleration?",
    a: "CPU inference is available in the Free tier. GPU-accelerated engine binaries require the Lab or Enterprise tier.",
  },
];

export default function PricingPage() {
  return (
    <article>
      {/* ── Hero ── */}
      <header style={{ ...sec, paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Pricing</p>
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
            Free for research.
            <br />
            Commercial when it ships.
          </h1>
          <p
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 15,
              color: "var(--ink-mute)",
              maxWidth: 520,
              lineHeight: 1.55,
            }}
          >
            The control plane is AGPL-3.0 and always will be. The GPU engine ships as
            binaries — free for research, licensed for commercial use.{" "}
            <a href="/docs" style={{ color: "var(--ink)" }}>
              See the free-vs-paid boundary →
            </a>
          </p>
        </div>
      </header>

      {/* ── Tier cards ── */}
      <section style={sec}>
        <div style={wrap}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 1, backgroundColor: "var(--rule)" }}>
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  backgroundColor: tier.highlight ? "var(--bg-elev)" : "var(--bg)",
                  padding: "40px 32px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  position: "relative",
                }}
              >
                {tier.highlight && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: "var(--ink)",
                  }} />
                )}

                {/* Tier name */}
                <div>
                  <p style={{ ...monoSm, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-mute)", marginBottom: 6 }}>
                    {tier.sub}
                  </p>
                  <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 32, color: "var(--ink)", marginBottom: 0 }}>
                    {tier.name}
                  </h2>
                </div>

                {/* Price */}
                <div style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 20 }}>
                  <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 36, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
                    {tier.price}
                  </p>
                  <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", marginTop: 4 }}>
                    {tier.priceNote}
                  </p>
                </div>

                {/* Audience */}
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-mute)" }}>{tier.audience}</p>

                {/* Trial strip — Lab only */}
                {"trial" in tier && (
                  <div style={{
                    border: "1px solid var(--rule)",
                    borderLeft: "2px solid var(--accent)",
                    padding: "10px 14px",
                    backgroundColor: "var(--bg)",
                  }}>
                    <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12, color: "var(--ink)", lineHeight: 1.6 }}>
                      {(tier as { trial: string }).trial}
                    </p>
                  </div>
                )}

                {/* Feature list */}
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                  {tier.features.map((f, i) => (
                    <li key={i} style={{ display: "flex", gap: 10, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                      <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  <a
                    href={tier.cta.href}
                    target={tier.cta.external ? "_blank" : undefined}
                    rel={tier.cta.external ? "noopener noreferrer" : undefined}
                    style={{
                      fontFamily: "var(--font-jetbrains), monospace",
                      fontSize: 13,
                      color: tier.highlight ? "var(--bg)" : "var(--ink)",
                      backgroundColor: tier.highlight ? "var(--ink)" : "transparent",
                      border: tier.highlight ? "none" : "1px solid var(--rule)",
                      padding: "10px 20px",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {tier.cta.label}
                  </a>
                  {"trialCta" in tier && (
                    <a
                      href={(tier as { trialCta: { label: string; href: string } }).trialCta.href}
                      style={{
                        fontFamily: "var(--font-jetbrains), monospace",
                        fontSize: 12,
                        color: "var(--accent)",
                        textDecoration: "none",
                        display: "inline-block",
                        paddingTop: 4,
                      }}
                    >
                      {(tier as { trialCta: { label: string; href: string } }).trialCta.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>FAQ</p>
          <h2 style={h2}>Common questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 760 }}>
            {FAQ.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 0",
                  borderBottom: "1px solid var(--rule)",
                }}
              >
                <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink)", marginBottom: 8, lineHeight: 1.4 }}>
                  {item.q}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Licensing note ── */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={eyebrow}>Licensing</p>
          <p style={prose}>
            The control plane (this repo) is licensed under AGPL-3.0-or-later. The GPU engine
            ships as pre-compiled binaries under the Vikshep Engine Binary Terms: free for
            research and non-commercial use; commercial deployment requires a license.
            See{" "}
            <a href="https://github.com/samvardhan03/Vikshep/blob/main/LICENSING.md" style={{ color: "var(--ink)" }}>
              LICENSING.md
            </a>{" "}
            for the full terms.
          </p>
          <p style={{ ...prose, marginTop: 16 }}>
            All pricing questions:{" "}
            <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20licensing" style={{ color: "var(--ink)" }}>
              shekhawatsamvardhan@gmail.com
            </a>
          </p>
        </div>
      </section>
    </article>
  );
}
