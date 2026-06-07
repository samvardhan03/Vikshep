import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";

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
  fontSize: "clamp(20px,2.4vw,30px)",
  color: "var(--ink)",
  marginBottom: 20,
  lineHeight: 1.2,
};
const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 680,
};
const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};
const sec: React.CSSProperties = {
  padding: "56px 0",
  borderBottom: "1px solid var(--rule)",
};
const monoSm: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
};

export interface StepItem {
  method: string;
  description: React.ReactNode;
  inputShape?: string;
  outputShape?: string;
}

export interface ConfigRow {
  param: string;
  value: string;
  description: string;
}

export interface RelatedLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface RecipeLayoutProps {
  number: string;
  title: string;
  tagline: string;
  whenToUse: React.ReactNode;
  whatItNeeds: {
    description: React.ReactNode;
    code: string;
    lang?: string;
  };
  howItWorks: StepItem[];
  whatYouGet: string[];
  configure: ConfigRow[];
  cli: string;
  dashboardNote: string;
  related: RelatedLink[];
}

export default function RecipeLayout({
  number,
  title,
  tagline,
  whenToUse,
  whatItNeeds,
  howItWorks,
  whatYouGet,
  configure,
  cli,
  dashboardNote,
  related,
}: RecipeLayoutProps) {
  return (
    <article>
      {/* ── Hero ── */}
      <header style={{ ...sec, paddingTop: 96 }}>
        <div style={wrap}>
          <Link
            href="/#recipes"
            style={{
              ...monoSm,
              color: "var(--ink-mute)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            ← Back to recipes
          </Link>
          <p style={eyebrow}>Recipe {number}</p>
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
            {title}
          </h1>
          <p
            style={{
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 16,
              color: "var(--ink-mute)",
              maxWidth: 560,
            }}
          >
            {tagline}
          </p>
        </div>
      </header>

      {/* ── When to use ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>When to use this</p>
          <div style={prose}>{whenToUse}</div>
        </div>
      </section>

      {/* ── What it needs ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>What it needs</p>
          <div style={{ ...prose, marginBottom: 20 }}>{whatItNeeds.description}</div>
          <CodeBlock>{whatItNeeds.code}</CodeBlock>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>How it works</p>
          <h2 style={h2}>MCP tool call sequence</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 780 }}>
            {howItWorks.map((step, i) => (
              <div
                key={i}
                style={{
                  border: "1px solid var(--rule)",
                  padding: "20px 24px",
                  display: "grid",
                  gridTemplateColumns: "36px 1fr",
                  gap: "0 20px",
                }}
              >
                {/* Step number */}
                <div
                  style={{
                    ...monoSm,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--ink)",
                    paddingTop: 2,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  {/* Method name */}
                  <p
                    style={{
                      ...monoSm,
                      fontSize: 13,
                      color: "var(--accent)",
                      marginBottom: 8,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {step.method}
                  </p>
                  {/* Description */}
                  <div style={{ ...prose, fontSize: 14, maxWidth: "none" }}>
                    {step.description}
                  </div>
                  {/* I/O shapes */}
                  {(step.inputShape || step.outputShape) && (
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      {step.inputShape && (
                        <span
                          style={{
                            ...monoSm,
                            fontSize: 11,
                            color: "var(--ink-mute)",
                            border: "1px solid var(--rule)",
                            padding: "3px 8px",
                          }}
                        >
                          in: {step.inputShape}
                        </span>
                      )}
                      {step.outputShape && (
                        <span
                          style={{
                            ...monoSm,
                            fontSize: 11,
                            color: "var(--accent)",
                            border: "1px solid var(--rule)",
                            padding: "3px 8px",
                          }}
                        >
                          out: {step.outputShape}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What you get ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>What you get</p>
          <ul style={{ listStyle: "none", padding: 0, maxWidth: 640 }}>
            {whatYouGet.map((item, i) => (
              <li
                key={i}
                style={{
                  ...monoSm,
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--rule)",
                  display: "flex",
                  gap: 12,
                }}
              >
                <span style={{ color: "var(--accent)" }}>→</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Configure it ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Configure it</p>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                maxWidth: 780,
                ...monoSm,
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  {["param", "default", "description"].map((col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        padding: "8px 16px",
                        borderBottom: "1px solid var(--rule)",
                        color: "var(--ink-mute)",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
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
                {configure.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "10px 16px", color: "var(--accent)" }}>{row.param}</td>
                    <td style={{ padding: "10px 16px", color: "var(--ink)" }}>{row.value}</td>
                    <td style={{ padding: "10px 16px", color: "var(--ink-mute)" }}>{row.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Run it (CLI) ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Run it — CLI</p>
          <CodeBlock>{cli}</CodeBlock>
        </div>
      </section>

      {/* ── Run it (Dashboard) ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Run it — Dashboard</p>
          <div
            style={{
              border: "1px solid var(--rule)",
              backgroundColor: "var(--bg-elev)",
              padding: "48px 32px",
              maxWidth: 640,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <p style={{ ...monoSm, fontSize: 28, color: "var(--ink-mute)", opacity: 0.3 }}>⬜</p>
            <p style={{ ...monoSm, fontSize: 11, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Dashboard screenshot — coming in Pilot
            </p>
            <p style={{ ...prose, fontSize: 13, textAlign: "center", maxWidth: 420 }}>
              {dashboardNote}
            </p>
          </div>
        </div>
      </section>

      {/* ── Related ── */}
      <section style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>Related</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {related.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                style={{
                  ...monoSm,
                  fontSize: 13,
                  color: "var(--ink)",
                  textDecoration: "none",
                  border: "1px solid var(--rule)",
                  padding: "8px 16px",
                  display: "inline-block",
                }}
              >
                {link.label}{link.external ? " ↗" : " →"}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={eyebrow}>Get started</p>
          <h2 style={h2}>Ready to run this recipe?</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20inquiry"
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
              Talk to founders →
            </a>
            <a
              href="https://github.com/samvardhan03/Vikshep/issues/new?template=feature.md"
              target="_blank"
              rel="noopener noreferrer"
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
              Request a feature ↗
            </a>
            <a
              href="https://github.com/samvardhan03/Vikshep"
              target="_blank"
              rel="noopener noreferrer"
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
              View on GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </article>
  );
}
