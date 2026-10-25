export const metadata = { title: "Download — Vikshep" };

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
  fontSize: "clamp(20px,2.8vw,36px)",
  lineHeight: 1.1,
  color: "var(--ink)",
  marginBottom: 16,
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

const PLATFORMS = [
  {
    name: "macOS (Apple Silicon)",
    arch: "AArch64",
    os: "macOS 13.7 or later",
    gpu: "Metal (in development)",
    note: "Requires Gatekeeper approval on first launch. Unsigned development builds are labelled accordingly.",
  },
  {
    name: "macOS (Intel)",
    arch: "x86_64",
    os: "macOS 13.7 or later",
    gpu: "CPU only",
    note: "Metal GPU path requires Apple Silicon.",
  },
  {
    name: "Linux (x86_64)",
    arch: "x86_64",
    os: "Ubuntu 22.04 or compatible (glibc 2.35+)",
    gpu: "CUDA 12+ (in development)",
    note: "Requires a supported NVIDIA driver for the CUDA engine path.",
  },
  {
    name: "Windows",
    arch: "x86_64",
    os: "Windows 10 22H2 or later",
    gpu: "CUDA 12+ (planned)",
    note: "Desktop app is planned for Windows. The CLI and Python loaders work today under WSL2.",
  },
];

export default function DownloadPage() {
  return (
    <article>

      {/* Hero */}
      <header style={{ ...sec(), paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Download</p>
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
            Desktop builds for
            <br />
            licensed accounts.
          </h1>
          <div style={{
            marginBottom: 24,
            padding: "16px 20px",
            border: "1px solid var(--rule)",
            borderLeft: "2px solid var(--accent)",
            maxWidth: 600,
          }}>
            <p style={{ ...mono, fontSize: 13, color: "var(--ink)", lineHeight: 1.6 }}>
              Vikshep Studio has not yet launched publicly. Desktop builds will be available
              to licensed accounts from your account page after launch.
              There are no public binaries.
            </p>
          </div>
          <p style={{ ...prose, marginBottom: 28 }}>
            The AGPL-3.0 control plane — loaders, recipes, CLI, site — is available
            today from GitHub and does not require an account or build. The Studio
            desktop application will be distributed as gated, signed download links
            accessible after sign-in.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="https://github.com/samvardhan03/Vikshep"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...mono, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "10px 20px", textDecoration: "none" }}
            >
              Open-source CLI on GitHub →
            </a>
            {APP_BASE ? (
              <a
                href={`${APP_BASE}/signin`}
                style={{ ...mono, color: "var(--ink)", border: "1px solid var(--rule)", padding: "10px 20px", textDecoration: "none" }}
              >
                Sign in to your account →
              </a>
            ) : (
              <a
                href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Desktop%20access"
                style={{ ...mono, color: "var(--ink)", border: "1px solid var(--rule)", padding: "10px 20px", textDecoration: "none" }}
              >
                Contact for early access →
              </a>
            )}
          </div>
        </div>
      </header>

      {/* How download will work */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>How it works</p>
          <h2 style={h2}>From account to running binary</h2>
          <p style={{ ...prose, marginBottom: 32 }}>
            Desktop builds are not hosted as public GitHub Releases. After launch,
            the process will be:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 680 }}>
            {[
              {
                step: "01",
                label: "Sign in",
                body: "Sign in to your account. Your org must have an active licence or an unexpired trial.",
              },
              {
                step: "02",
                label: "Go to Account → Downloads",
                body: "The downloads page shows per-platform signed download links (valid for 1 hour). Each link shows the platform, architecture, file size, sha256 checksum, version, and release notes.",
              },
              {
                step: "03",
                label: "Download and verify",
                body: "Download the installer for your platform. Verify the sha256 checksum before running. Initial builds are labelled as unsigned development builds — full signing and notarisation will be added before the public launch.",
              },
              {
                step: "04",
                label: "Activate your licence",
                body: "On first launch, Studio prompts for your licence key. Enter the key from Account → Licences. Activation claims one of your 2 concurrent device slots (Studio Academic and Studio Pro) or a pooled slot (Lab). The lease is renewed automatically while you are online.",
              },
              {
                step: "05",
                label: "Updates",
                body: "The auto-updater checks for new releases on startup. Signed releases install automatically; unsigned development builds prompt a manual install notification.",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 0",
                  borderBottom: "1px solid var(--rule)",
                  display: "grid",
                  gridTemplateColumns: "48px 1fr",
                  gap: 20,
                  alignItems: "start",
                }}
              >
                <span style={{ ...mono, fontSize: 14, color: "var(--ink-mute)", paddingTop: 2 }}>{item.step}</span>
                <div>
                  <p style={{ ...mono, fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>{item.label}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* System requirements */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>System requirements</p>
          <h2 style={h2}>Supported platforms</h2>
          <p style={{ ...prose, marginBottom: 28 }}>
            The loaders and CLI work on all four platforms today. The Studio desktop
            application targets macOS first; Linux and Windows builds follow.
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
                  {["Platform", "Architecture", "Minimum OS", "GPU engine", "Notes"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: "var(--ink-mute)", fontWeight: "normal", textTransform: "uppercase", letterSpacing: "0.10em", fontSize: 10, backgroundColor: "var(--bg-elev)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLATFORMS.map((p, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--ink)" }}>{p.name}</td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-mute)" }}>{p.arch}</td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-mute)" }}>{p.os}</td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-mute)" }}>{p.gpu}</td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-mute)", fontSize: 11, lineHeight: 1.5 }}>{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ ...mono, fontSize: 11, color: "var(--ink-mute)", marginTop: 12, lineHeight: 1.6 }}>
            CPU minimum: 4-core, 8 GB RAM. No GPU required for the CPU reference backend.
            GPU acceleration requires a discrete GPU; integrated graphics are not supported.
          </p>
        </div>
      </section>

      {/* Open-source CLI */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Available now</p>
          <h2 style={h2}>CLI and loaders — no account required</h2>
          <p style={{ ...prose, marginBottom: 24 }}>
            The open-source CLI (<code style={mono}>vikshep-ingest</code>,{" "}
            <code style={mono}>vikshep-recipe</code>) and the open deterministic core
            (vikshep-compute) are available today from GitHub under AGPL-3.0 and MIT
            respectively. No GPU required. No account needed.
          </p>
          <div style={{
            padding: "20px 24px",
            backgroundColor: "var(--bg-elev)",
            border: "1px solid var(--rule)",
            maxWidth: 580,
            marginBottom: 24,
          }}>
            <pre style={{ ...mono, lineHeight: 1.7, color: "var(--ink)", margin: 0 }}>{`git clone https://github.com/samvardhan03/Vikshep.git
cd Vikshep
pip install -e backend/ingest`}</pre>
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://github.com/samvardhan03/Vikshep"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...mono, fontSize: 13, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "10px 20px", textDecoration: "none" }}
            >
              GitHub →
            </a>
            <a
              href="/docs/install"
              style={{ ...mono, fontSize: 13, color: "var(--ink)", border: "1px solid var(--rule)", padding: "10px 20px", textDecoration: "none" }}
            >
              Install docs →
            </a>
          </div>
        </div>
      </section>

      {/* Pre-launch CTA */}
      <section style={sec(false)}>
        <div style={wrap}>
          <div style={{
            padding: "40px 32px",
            border: "1px solid var(--rule)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            maxWidth: 760,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={eyebrow}>Get notified at launch</p>
              <p style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 22, color: "var(--ink)", lineHeight: 1.2 }}>
                Be the first to get desktop access.
              </p>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-mute)", maxWidth: 400 }}>
                Contact us to be added to the pre-launch list. Licensed accounts receive
                download access the day builds are available.
              </p>
            </div>
            <a
              href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20Desktop%20launch%20notification"
              style={{ ...mono, fontSize: 13, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "12px 24px", textDecoration: "none", flexShrink: 0 }}
            >
              Contact for early access →
            </a>
          </div>
        </div>
      </section>

    </article>
  );
}
