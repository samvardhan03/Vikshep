export const metadata = { title: "Privacy Policy — Vikshep" };

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
  fontSize: 22,
  color: "var(--ink)",
  marginTop: 40,
  marginBottom: 12,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 720,
};

const draft: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
  color: "var(--signal-warm)",
  border: "1px solid var(--signal-warm)",
  padding: "8px 16px",
  display: "inline-block",
  marginBottom: 32,
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", padding: "0 24px" };
const sec: React.CSSProperties = { padding: "64px 0" };

export default function PrivacyPage() {
  return (
    <article>
      <header style={{ ...sec, paddingTop: 96, borderBottom: "1px solid var(--rule)" }}>
        <div style={wrap}>
          <p style={eyebrow}>Legal</p>
          <h1 style={h1Style}>Privacy Policy</h1>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink-mute)" }}>
            Effective date: 2026-09-10 (pending legal review)
          </p>
        </div>
      </header>

      <section style={sec}>
        <div style={wrap}>
          <p style={draft}>Draft — under legal review. Do not rely on this document for legal advice.</p>
          <div style={prose}>

            <h2 style={h2Style}>1. Who we are</h2>
            <p>
              Vikshep (operator: Samvardhan Shekhawat,{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>
              ) is responsible for the personal data described in this policy.
            </p>

            <h2 style={h2Style}>2. What data we collect</h2>
            <p>
              <strong>Account data:</strong> email address and name from your GitHub OAuth sign-in.
              We do not store your GitHub password or private repository data.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Usage data:</strong> job submission timestamps, compute seconds consumed,
              API key activity (prefix and last-used date only — keys are stored as one-way hashes
              and cannot be retrieved).
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Payment data:</strong> payment status and reference IDs from Razorpay.
              We do not store card numbers or bank details — those remain with Razorpay.
            </p>
            <p style={{ marginTop: 12 }}>
              <strong>Input data (physics files):</strong> CSV, HDF5, and ROOT files submitted for
              analysis are processed in memory and written to temporary storage for the duration
              of the job only. They are deleted when the job finishes and are not retained,
              analysed for other purposes, or shared.
            </p>

            <h2 style={h2Style}>3. How we use your data</h2>
            <p>
              Account data is used to authenticate you and enforce per-organisation trial and
              entitlement limits. Usage data is used to enforce quota and display your usage
              dashboard. We do not sell, share, or use your data for advertising.
            </p>

            <h2 style={h2Style}>4. Data storage</h2>
            <p>
              Account and usage data are stored in a Neon Postgres database hosted in the EU
              (Frankfurt). Redis cache (Upstash) holds ephemeral entitlement state with a 10-minute
              TTL. Both providers are GDPR-compliant.
            </p>

            <h2 style={h2Style}>5. Your rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by emailing{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Data%20Request" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>
              . Account deletion removes your user record, API keys, and usage history. Payment
              records may be retained for legal and accounting purposes.
            </p>

            <h2 style={h2Style}>6. Cookies and tracking</h2>
            <p>
              We use one session cookie (httpOnly, secure) issued by the Auth.js authentication
              library. We do not use analytics cookies, advertising trackers, or third-party
              scripts on the private application.
            </p>

            <h2 style={h2Style}>7. Changes to this policy</h2>
            <p>
              We will notify you by email of material changes to this policy. The current version
              is always available at this URL.
            </p>

            <h2 style={h2Style}>8. Contact</h2>
            <p>
              Privacy questions:{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Privacy" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
