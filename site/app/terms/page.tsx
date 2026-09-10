export const metadata = { title: "Terms of Service — Vikshep" };

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

export default function TermsPage() {
  return (
    <article>
      <header style={{ ...sec, paddingTop: 96, borderBottom: "1px solid var(--rule)" }}>
        <div style={wrap}>
          <p style={eyebrow}>Legal</p>
          <h1 style={h1Style}>Terms of Service</h1>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink-mute)" }}>
            Effective date: 2026-09-10 (pending legal review)
          </p>
        </div>
      </header>

      <section style={sec}>
        <div style={wrap}>
          <p style={draft}>Draft — under legal review. Do not rely on this document for legal advice.</p>
          <div style={prose}>

            <h2 style={h2Style}>1. Operator identity</h2>
            <p>
              Vikshep is operated by Samvardhan Shekhawat ("we", "us", "our"). Contact:{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>
              . Company registration details to be added before go-live.
            </p>

            <h2 style={h2Style}>2. Services</h2>
            <p>
              Vikshep provides hosted wavelet-scattering feature extraction and physics analysis
              compute ("the Service"). The open-source control plane is licensed under AGPL-3.0;
              hosted compute services are offered under separate commercial terms.
            </p>

            <h2 style={h2Style}>3. AGPL-3.0 open-source software</h2>
            <p>
              The Vikshep control plane source code (ingest pipeline, DisCo, recipes, MCP agent,
              and this site) is released under the GNU Affero General Public License v3.0. If you
              use or distribute this software, or make it available over a network, you must
              release your modifications under the same licence. The GPU engine binaries are
              subject to separate licensing terms; see LICENSING.md in the public repository.
            </p>

            <h2 style={h2Style}>4. Accounts and access</h2>
            <p>
              You must provide accurate information at sign-up. You are responsible for all
              activity under your account and must not share API keys. Vikshep reserves the right
              to suspend accounts that violate these terms or are used for unlawful purposes.
            </p>

            <h2 style={h2Style}>5. Trial access</h2>
            <p>
              One free trial per verified email: 7 days + 900 GPU-seconds, no payment card
              required. Trials are non-transferable. Vikshep may modify or discontinue the trial
              program at any time.
            </p>

            <h2 style={h2Style}>6. Paid entitlements</h2>
            <p>
              Paid Lab entitlements are one-time purchases (not subscriptions). Entitlements are
              granted for a fixed duration or quota as specified at checkout. Payments are
              processed by Razorpay in TEST MODE at this time; no real charges are processed until
              live mode is activated by Vikshep.
            </p>

            <h2 style={h2Style}>7. Acceptable use</h2>
            <p>
              You may not use the Service for unlawful purposes, to interfere with other users
              or the infrastructure, or to attempt to extract or reverse-engineer the proprietary
              GPU engine binaries. Use is limited to the physics-analysis purposes described in
              the documentation.
            </p>

            <h2 style={h2Style}>8. Data and privacy</h2>
            <p>
              Input data submitted for analysis is processed to produce results and is not retained
              beyond the job lifetime. See the{" "}
              <a href="/privacy" style={{ color: "var(--ink)" }}>Privacy Policy</a> for details.
            </p>

            <h2 style={h2Style}>9. Warranty disclaimer</h2>
            <p>
              The Service is provided "as is" without warranty of any kind. Vikshep does not
              warrant that the Service will be uninterrupted, error-free, or that results will
              meet your requirements.
            </p>

            <h2 style={h2Style}>10. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Vikshep's total liability to you for any
              claim arising from these terms shall not exceed the amount you paid for the Service
              in the 12 months preceding the claim.
            </p>

            <h2 style={h2Style}>11. Changes to these terms</h2>
            <p>
              We may update these terms at any time. Continued use of the Service after changes
              constitutes acceptance of the updated terms. Material changes will be announced via
              the email on your account.
            </p>

            <h2 style={h2Style}>12. Contact</h2>
            <p>
              Questions about these terms:{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Terms" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
