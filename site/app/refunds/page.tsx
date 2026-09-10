export const metadata = { title: "Refund Policy — Vikshep" };

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

export default function RefundsPage() {
  return (
    <article>
      <header style={{ ...sec, paddingTop: 96, borderBottom: "1px solid var(--rule)" }}>
        <div style={wrap}>
          <p style={eyebrow}>Legal</p>
          <h1 style={h1Style}>Refund Policy</h1>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink-mute)" }}>
            Effective date: 2026-09-10 (pending legal review)
          </p>
        </div>
      </header>

      <section style={sec}>
        <div style={wrap}>
          <p style={draft}>Draft — under legal review. Do not rely on this document for legal advice.</p>
          <div style={prose}>

            <h2 style={h2Style}>Refund eligibility</h2>
            <p>
              Vikshep offers refunds on paid Lab entitlements within <strong>14 days</strong> of
              purchase, provided that no more than 10% of the purchased GPU-seconds have been
              consumed. Contact us at{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Refund" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>{" "}
              with your payment reference to request a refund.
            </p>

            <h2 style={h2Style}>Non-refundable items</h2>
            <p>
              Trial access is free — there is nothing to refund. GPU-seconds consumed prior to a
              refund request are deducted from the refundable quota. Entitlements purchased more
              than 14 days ago, or where more than 10% of quota has been used, are not eligible
              for refund unless required by applicable consumer-protection law.
            </p>

            <h2 style={h2Style}>How refunds are processed</h2>
            <p>
              Approved refunds are issued to the original payment method via Razorpay within
              5–10 business days. For international payments, settlement timelines may vary
              depending on your bank. Note: currently operating in TEST MODE — no real charges
              or refunds are processed until live mode is activated.
            </p>

            <h2 style={h2Style}>Contact for refunds</h2>
            <p>
              Email{" "}
              <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Refund%20Request" style={{ color: "var(--ink)" }}>
                shekhawatsamvardhan@gmail.com
              </a>{" "}
              with subject "Vikshep Refund Request" and include your payment reference ID
              (available in your{" "}
              <a href="/account" style={{ color: "var(--ink)" }}>account page</a>
              ).
            </p>

            <h2 style={h2Style}>Note on pricing</h2>
            <p>
              Exact pricing amounts are set in the Razorpay dashboard and communicated at checkout.
              Prices may change; the price at the time of purchase applies.
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
