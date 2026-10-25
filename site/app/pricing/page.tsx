export const metadata = { title: "Pricing — Vikshep" };

const APP_BASE = process.env.NEXT_PUBLIC_VIKSHEP_API_BASE ?? null;

const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};

const sec = (border = true): React.CSSProperties => ({
  padding: "64px 0",
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

const h2: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(20px,2.4vw,32px)",
  color: "var(--ink)",
  marginBottom: 16,
  lineHeight: 1.2,
};

const mono: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 680,
};

// Editions per master plan §2.4
const CAPABILITIES: {
  label: string;
  open: string;
  academic: string;
  pro: string;
  lab: string;
  enterprise: string;
}[] = [
  {
    label: "CLI + Python + open CPU core",
    open: "Yes",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Conformance suite + free verifier",
    open: "Yes",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Studio desktop app (UI, projects)",
    open: "—",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Metal / CUDA GPU acceleration",
    open: "—",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Embedded Geant4 runner + 3D viewer",
    open: "CLI runner (open)",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Determinism Certificates (signed)",
    open: "—",
    academic: "Yes",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes",
  },
  {
    label: "Devices per seat",
    open: "—",
    academic: "2 concurrent",
    pro: "2 concurrent",
    lab: "Pooled seats",
    enterprise: "Custom",
  },
  {
    label: "Cloud burst credits",
    open: "—",
    academic: "Small",
    pro: "Small",
    lab: "Included pool",
    enterprise: "Custom",
  },
  {
    label: "Commercial use / closed embedding",
    open: "AGPL terms",
    academic: "No (academic only)",
    pro: "Yes",
    lab: "Yes",
    enterprise: "Yes + commercial licence",
  },
  {
    label: "Premium 3-D SO(3) engine",
    open: "—",
    academic: "—",
    pro: "—",
    lab: "Add-on",
    enterprise: "Yes",
  },
  {
    label: "On-prem deployment + SLA + validation dossier",
    open: "—",
    academic: "—",
    pro: "—",
    lab: "—",
    enterprise: "Yes",
  },
];

const TIERS = [
  {
    name: "Open",
    sub: "AGPL-3.0 self-host",
    price: "$0",
    priceNote: "forever",
    highlight: false,
    cta: {
      label: "Clone on GitHub →",
      href: "https://github.com/samvardhan03/Vikshep",
      external: true,
    },
    trialCta: null as null | { label: string; href: string },
    trial: null as null | string,
    audience: "Research groups, reviewers, open-source projects, academic collaborations.",
  },
  {
    name: "Studio Academic",
    sub: "Desktop licence — academic",
    price: "Contact",
    priceNote: "per seat per year",
    highlight: false,
    cta: {
      label: "Contact for Academic →",
      href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Studio%20Academic",
      external: false,
    },
    trialCta: null,
    trial: null,
    audience: "University researchers and students with a verified academic email address.",
  },
  {
    name: "Studio Pro",
    sub: "Desktop licence — commercial",
    price: "Contact",
    priceNote: "per seat per year",
    highlight: true,
    cta: {
      label: "Contact for Pro →",
      href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Studio%20Pro",
      external: false,
    },
    trialCta: null,
    trial: null,
    audience: "Commercial use, industrial R&D, and teams that need closed-source embedding.",
  },
  {
    name: "Lab",
    sub: "Hosted metered",
    price: "Contact",
    priceNote: "per analysis run",
    highlight: false,
    cta: {
      label: APP_BASE ? "Buy Lab access →" : "Contact for Lab →",
      href: APP_BASE
        ? `${APP_BASE}/checkout`
        : "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Lab",
      external: !APP_BASE,
    },
    trialCta: {
      label: APP_BASE ? "Start free trial →" : "Request trial →",
      href: APP_BASE
        ? `${APP_BASE}/signin`
        : "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Lab%20trial",
    },
    trial: "Free trial: 7 days + 900 GPU-seconds, no card required. One per verified email.",
    audience: "Groups that want hosted compute, managed GPU access, or pooled seats across a lab.",
  },
  {
    name: "Enterprise",
    sub: "Commercial licence",
    price: "Contact",
    priceNote: "annual",
    highlight: false,
    cta: {
      label: "Contact for Enterprise →",
      href: "mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Enterprise",
      external: false,
    },
    trialCta: null,
    trial: null,
    audience: "Experiment collaborations, industrial R&D, and proprietary on-prem deployments.",
  },
];

const FAQ = [
  {
    q: "Is the engine source available?",
    a: "The control plane (ingest, DisCo, recipes, site) is AGPL-3.0 — full source in the GitHub repo. The open deterministic core (vikshep-compute) is also open source. The GPU engine ships as binaries under a separate proprietary licence. Research use of the binaries is free; commercial deployment requires a licence.",
  },
  {
    q: "What does the 2-concurrent-device limit mean?",
    a: "Each Studio Academic or Studio Pro seat allows up to 2 devices to be activated at the same time. A device holds a 24-hour offline-verifiable lease. If you need a third device, you release one of the existing two from Settings → Devices. The limit is enforced server-side; releasing a slot is immediate.",
  },
  {
    q: "What is the trial?",
    a: "The Lab trial is 7 days and 900 GPU-seconds, whichever comes first. It requires a verified email but no card. One trial per email. The AGPL CLI and the open CPU core never expire — the trial covers the hosted plane only.",
  },
  {
    q: "What does AGPL-3.0 mean for my analysis code?",
    a: "If you use Vikshep as a library and distribute your code (including over a network), your code must also be AGPL-3.0. If you only use Vikshep locally for your own analysis and do not distribute it, the copyleft does not propagate. Studio Pro and Enterprise include a commercial licence that removes this requirement.",
  },
  {
    q: "Can I publish results produced with the Open tier?",
    a: "Yes. There are no restrictions on publishing results. We ask that you cite Vikshep in any paper (BibTeX on the /pilot page). Academic editions include an optional provenance appendix with the VDS-1 certificate and free verify command for peer review.",
  },
  {
    q: "When will the desktop app be available?",
    a: "The desktop app is not yet released. Builds will be available to licensed accounts from your account page after launch. See the download page for system requirements.",
  },
];

export default function PricingPage() {
  return (
    <article>

      {/* Hero */}
      <header style={{ ...sec(), paddingTop: 96 }}>
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
          <p style={{ ...prose }}>
            The control plane is AGPL-3.0 and always will be. The GPU engine ships as
            binaries — free for research, licensed for commercial use.{" "}
            <a href="/docs" style={{ color: "var(--ink)" }}>
              See the free-vs-paid boundary →
            </a>
          </p>
        </div>
      </header>

      {/* Edition cards */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Editions</p>
          <h2 style={h2}>Five editions, one engine</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 1,
            backgroundColor: "var(--rule)",
          }}>
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  backgroundColor: tier.highlight ? "var(--bg-elev)" : "var(--bg)",
                  padding: "36px 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
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
                <div>
                  <p style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.16em", color: "var(--ink-mute)", marginBottom: 6 }}>
                    {tier.sub}
                  </p>
                  <h2 style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 26, color: "var(--ink)", marginBottom: 0 }}>
                    {tier.name}
                  </h2>
                </div>

                <div style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 16 }}>
                  <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 30, fontWeight: 700, color: "var(--ink)", lineHeight: 1 }}>
                    {tier.price}
                  </p>
                  <p style={{ ...mono, fontSize: 11, color: "var(--ink-mute)", marginTop: 4 }}>
                    {tier.priceNote}
                  </p>
                </div>

                <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink-mute)" }}>{tier.audience}</p>

                {tier.trial && (
                  <div style={{
                    border: "1px solid var(--rule)",
                    borderLeft: "2px solid var(--accent)",
                    padding: "10px 12px",
                    backgroundColor: "var(--bg)",
                  }}>
                    <p style={{ ...mono, fontSize: 11, color: "var(--ink)", lineHeight: 1.6 }}>
                      {tier.trial}
                    </p>
                  </div>
                )}

                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  <a
                    href={tier.cta.href}
                    target={tier.cta.external ? "_blank" : undefined}
                    rel={tier.cta.external ? "noopener noreferrer" : undefined}
                    style={{
                      ...mono,
                      fontSize: 12,
                      color: tier.highlight ? "var(--bg)" : "var(--ink)",
                      backgroundColor: tier.highlight ? "var(--ink)" : "transparent",
                      border: tier.highlight ? "none" : "1px solid var(--rule)",
                      padding: "10px 16px",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    {tier.cta.label}
                  </a>
                  {tier.trialCta && (
                    <a
                      href={tier.trialCta.href}
                      style={{
                        ...mono,
                        fontSize: 11,
                        color: "var(--accent)",
                        textDecoration: "none",
                        display: "inline-block",
                        paddingTop: 4,
                      }}
                    >
                      {tier.trialCta.label}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capability matrix */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Capability matrix</p>
          <h2 style={h2}>What each edition includes</h2>
          <p style={{ ...prose, marginBottom: 28 }}>
            Per the master plan §2.4. The 2-concurrent-device limit applies to Studio
            Academic and Studio Pro seats. Lab provides pooled seats across the org. Enterprise
            seats are configurable.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 12,
            }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", color: "var(--ink-mute)", fontWeight: "normal", textTransform: "uppercase", letterSpacing: "0.10em", fontSize: 10, width: "30%", backgroundColor: "var(--bg-elev)" }}>
                    Capability
                  </th>
                  {["Open", "Studio Academic", "Studio Pro", "Lab", "Enterprise"].map((col) => (
                    <th key={col} style={{ textAlign: "center", padding: "10px 12px", color: "var(--ink)", fontWeight: "normal", textTransform: "uppercase", letterSpacing: "0.10em", fontSize: 10, backgroundColor: "var(--bg-elev)" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--ink)", fontSize: 12, lineHeight: 1.5 }}>
                      {row.label}
                    </td>
                    {[row.open, row.academic, row.pro, row.lab, row.enterprise].map((val, j) => (
                      <td key={j} style={{ padding: "10px 12px", textAlign: "center", color: val === "—" ? "var(--rule)" : "var(--ink-mute)", fontSize: 12 }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={sec()}>
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
                <p style={{ ...mono, fontSize: 13, color: "var(--ink)", marginBottom: 8, lineHeight: 1.4 }}>
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

      {/* Licensing note */}
      <section style={sec(false)}>
        <div style={wrap}>
          <p style={eyebrow}>Licensing</p>
          <p style={prose}>
            The control plane (this repo) is licensed under AGPL-3.0-or-later. The open
            deterministic core (vikshep-compute) is MIT-licensed. The GPU engine ships as
            pre-compiled binaries under the Vikshep Engine Binary Terms: free for research
            and non-commercial use; commercial deployment requires a licence.
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
