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
          from the repo clone only.
        </p>

        <h2 style={h2Style}>Verify the install</h2>
        <pre style={codeBlock}>{`vikshep-ingest --help
vikshep-recipe --help`}</pre>
        <p style={prose}>Both commands should print usage without errors.</p>
      </section>

      {/* Path 2 — scattering features */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Path 2 — Scattering features (requires Rust)</h2>
        <p style={prose}>
          To use the wavelet scattering transform, install the open core from
          source. A Rust toolchain is required for the build step.
        </p>
        <pre style={codeBlock}>{`# Install Rust (skip if already present)
curl -sSf https://sh.rustup.rs | sh -s -- -y && source "$HOME/.cargo/env"

pip install maturin
pip install -e "backend/ingest[scattering]"`}</pre>
        <p style={note}>
          The <code style={code}>[scattering]</code> extra builds{" "}
          <code style={code}>vikshep_compute</code> from the open core (
          <a
            href="https://github.com/samvardhan03/vikshep-compute"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            samvardhan03/vikshep-compute
          </a>
          ) at a pinned commit. First build takes 2–4 minutes; subsequent builds
          use the cargo cache. Without it, the CLI falls back to per-event
          aggregates; the report states which path ran.
        </p>

        <h2 style={h2Style}>MCP data plane (<code style={{ ...code, fontSize: 18 }}>vikshep-mcp</code>)</h2>
        <p style={prose}>
          Build the MCP data plane binary from the open core and set{" "}
          <code style={code}>VIKSHEP_MCP_BIN</code>:
        </p>
        <pre style={codeBlock}>{`git clone https://github.com/samvardhan03/vikshep-compute.git
cd vikshep-compute
cargo build --release -p vikshep-mcp
export VIKSHEP_MCP_BIN=$PWD/target/release/vikshep-mcp`}</pre>
        <p style={note}>
          Add the export to your shell profile (<code style={code}>~/.zshrc</code>,{" "}
          <code style={code}>~/.bashrc</code>). The agent reads{" "}
          <code style={code}>VIKSHEP_MCP_BIN</code> on every invocation; if it is
          absent the agent fails with build instructions. GPU backends are in
          development and not yet released.
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
              q: "VIKSHEP_MCP_BIN not set — agent MCP calls will fail",
              a: "Build vikshep-mcp from the open core (cargo build --release -p vikshep-mcp in samvardhan03/vikshep-compute) and export VIKSHEP_MCP_BIN=/path/to/vikshep-mcp. The variable is read at agent startup, not at import time.",
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
