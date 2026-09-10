export const metadata = { title: "Install — Docs" };

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
  marginBottom: 16,
};

const h2Style: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: 22,
  color: "var(--ink)",
  lineHeight: 1.2,
  marginBottom: 10,
  marginTop: 40,
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

const codeBlock: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 13,
  backgroundColor: "var(--bg-elev)",
  border: "1px solid var(--rule)",
  padding: "16px 20px",
  lineHeight: 1.6,
  whiteSpace: "pre",
  overflowX: "auto",
  color: "var(--ink)",
  marginTop: 12,
  marginBottom: 12,
};

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

export default function InstallPage() {
  return (
    <article>
      <p style={eyebrow}>Install</p>
      <h1 style={h1Style}>Setting up Vikshep</h1>
      <p style={{ ...prose, marginBottom: 32 }}>
        Vikshep has two independent install paths. Start with the loaders — they
        need no GPU, no build step, and no account.
      </p>

      {/* Prerequisites */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32, marginBottom: 0 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Prerequisites</h2>
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Python 3.10 or later",
            "Git",
            "No GPU required for the Geant4 Direct Interface or any loader",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Path 1 — loaders */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={{ ...h2Style }}>Path 1 — Loaders (repo-local, no account)</h2>
        <p style={prose}>
          Clone the public repo and install the ingest package in editable mode.
          This gives you all data loaders, the DisCo recipes, and the benchmark
          harness. No engine binary is required.
        </p>
        <pre style={codeBlock}>{`git clone https://github.com/samvardhan03/Vikshep.git
cd Vikshep
pip install -e backend/ingest`}</pre>
        <p style={note}>
          <code style={code}>vikshep-ingest</code> is not yet on PyPI — install
          from the repo clone only. Do not{" "}
          <code style={code}>cargo install omnipulse-mcp</code>; that path does
          not exist on crates.io.
        </p>

        <h2 style={h2Style}>Verify the install</h2>
        <pre style={codeBlock}>{`vikshep-ingest --help
vikshep-recipe --help`}</pre>
        <p style={prose}>Both commands should print usage without errors.</p>
      </section>

      {/* Path 2 — engine wheel */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Path 2 — Engine wheel (GPU acceleration)</h2>
        <p style={prose}>
          The <code style={code}>vikshep</code> wheel bundles the compiled engine
          and enables GPU-accelerated scattering. Install it alongside the loaders.
        </p>
        <pre style={codeBlock}>{`pip install vikshep`}</pre>
        <p style={note}>
          The first tagged engine binary release is pending. Until it ships, pilot
          access is available via{" "}
          <a href="mailto:shekhawatsamvardhan@gmail.com?subject=Vikshep%20pilot" style={{ color: "var(--ink)" }}>
            shekhawatsamvardhan@gmail.com
          </a>
          . The PyPI wheel (0.2.0) is available but carries stale metadata; a
          corrected release will follow the first GitHub Release.
        </p>

        <h2 style={h2Style}>Engine binary (<code style={{ ...code, fontSize: 18 }}>omnipulse-mcp</code>)</h2>
        <p style={prose}>
          Download the <code style={code}>omnipulse-mcp</code> binary from the{" "}
          <a
            href="https://github.com/samvardhan03/Vikshep/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            Releases page
          </a>{" "}
          and point the environment variable at it:
        </p>
        <pre style={codeBlock}>{`export OMNIPULSE_MCP_BIN=/path/to/omnipulse-mcp`}</pre>
        <p style={note}>
          Add this to your shell profile (<code style={code}>~/.zshrc</code>,{" "}
          <code style={code}>~/.bashrc</code>) or place it in a{" "}
          <code style={code}>.env</code> file loaded by your analysis script. The
          agent reads this variable on every invocation; if it is absent the
          agent fails loudly with install instructions.
        </p>
      </section>

      {/* Supported platforms */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Supported platforms</h2>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontFamily: "var(--font-jetbrains), monospace",
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--rule)" }}>
                {["Platform", "Loaders", "Engine (GPU)"].map((h) => (
                  <th
                    key={h}
                    style={{ textAlign: "left", padding: "8px 12px", color: "var(--ink)", fontWeight: "normal" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["macOS 13+ (Apple Silicon)", "Yes", "Planned (Metal)"],
                ["macOS 13+ (Intel)", "Yes", "No"],
                ["Linux x86_64 (CUDA 12+)", "Yes", "Yes (pilot)"],
                ["Windows", "Untested", "No"],
              ].map(([platform, loaders, gpu], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{platform}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{loaders}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{gpu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Troubleshooting */}
      <section>
        <h2 style={h2Style}>Troubleshooting</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              q: "vikshep-ingest: command not found",
              a: "Run pip install -e backend/ingest from the repo root. Ensure the active Python environment is the same one you installed into (check which pip).",
            },
            {
              q: "OMNIPULSE_MCP_BIN not set — engine calls will fail",
              a: "Download omnipulse-mcp from the Releases page and export OMNIPULSE_MCP_BIN=/path/to/omnipulse-mcp. The variable is read at agent startup, not at import time.",
            },
            {
              q: "ImportError: No module named 'vikshep_ingest'",
              a: "You are running Python from a different environment than where you installed the package. Confirm with which python3 and pip show vikshep-ingest.",
            },
            {
              q: "vikshep-recipe tag hangs",
              a: "The first call downloads sklearn dependencies. It should complete within 20 seconds on a fresh install. If it hangs beyond 60 seconds, check pip install scikit-learn.",
            },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 20 }}>
              <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13, color: "var(--ink)", marginBottom: 6 }}>
                {item.q}
              </p>
              <p style={{ fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.65 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
