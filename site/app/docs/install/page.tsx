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
            "Git, only to build from source",
            "No GPU required for the Geant4 Direct Interface or any loader",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Path 1 — pip */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={{ ...h2Style }}>Path 1 — pip (no account, no build)</h2>
        <p style={prose}>
          Installs the Geant4 Direct Interface, the loaders, the calibrate and DisCo tag
          recipes and, on Linux (x86_64, aarch64), macOS and Windows (x86_64), the open
          deterministic core <code style={code}>vikshep-compute</code> as a prebuilt wheel.
          On other platforms the recipes fall back to per-event aggregates and say so.
        </p>
        <pre style={codeBlock}>{`pip install vikshep-ingest

# reading vikshep-sim run folders (hits.arrow) as well
pip install "vikshep-ingest[sim]"`}</pre>

        <h2 style={h2Style}>Verify the install</h2>
        <pre style={codeBlock}>{`vikshep-ingest --help
vikshep-recipe --help
python -c "import vikshep_compute as vc; print(vc.conformance_selftest('quick')['failed'])"   # 0`}</pre>
        <p style={prose}>
          The sample used by the quickstart is in the repository:{" "}
          <code style={code}>curl -LO https://raw.githubusercontent.com/samvardhan03/Vikshep/main/examples/g4_quickstart/sample.csv</code>
        </p>
      </section>

      {/* Path 2 — from source */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Path 2 — From source (other platforms, development)</h2>
        <p style={prose}>
          Install the ingest package from a clone, and build the open core where no wheel
          exists (a Rust toolchain is required for that step).
        </p>
        <pre style={codeBlock}>{`git clone https://github.com/samvardhan03/Vikshep.git
pip install -e "Vikshep/backend/ingest[sim]"

# the open core from source (only where no wheel exists)
curl -sSf https://sh.rustup.rs | sh -s -- -y && source "$HOME/.cargo/env"
git clone https://github.com/samvardhan03/vikshep-compute.git
pip install maturin && pip install ./vikshep-compute/crates/vikshep-py`}</pre>

        <h2 style={h2Style}>Rust, C and C++</h2>
        <p style={prose}>
          The same core is on crates.io (<code style={code}>cargo add vikshep</code>) and,
          for C and C++, as prebuilt archives on the{" "}
          <a
            href="https://github.com/samvardhan03/vikshep-compute/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            vikshep-compute releases page
          </a>
          : headers, the static and shared C API library, the conformance runner and
          certificate verifier, and the conformance vectors.
        </p>

        <h2 style={h2Style}>MCP data plane (<code style={{ ...code, fontSize: 18 }}>vikshep-mcp</code>)</h2>
        <p style={prose}>
          The agent talks to the data plane binary named by{" "}
          <code style={code}>VIKSHEP_MCP_BIN</code>. It is in the release archive for your
          platform (<code style={code}>bin/vikshep-mcp</code>):
        </p>
        <pre style={codeBlock}>{`tar -xzf vikshep-compute-0.1.0-<platform>.tar.gz
export VIKSHEP_MCP_BIN=$PWD/vikshep-compute-0.1.0-<platform>/bin/vikshep-mcp`}</pre>
        <p style={note}>
          Add the export to your shell profile (<code style={code}>~/.zshrc</code>,{" "}
          <code style={code}>~/.bashrc</code>). The agent reads{" "}
          <code style={code}>VIKSHEP_MCP_BIN</code> on every invocation; if it is
          absent the agent fails with instructions. GPU backends are in
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
                {["Platform", "Loaders", "Open core wheel", "Engine (GPU)"].map((h) => (
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
                ["macOS 13+ (Apple Silicon)", "Yes", "Yes", "Planned (Metal)"],
                ["macOS 13+ (Intel)", "Yes", "Yes", "No"],
                ["Linux x86_64 (CUDA 12+)", "Yes", "Yes", "Yes (pilot)"],
                ["Linux aarch64", "Yes", "Yes", "No"],
                ["Windows x86_64", "Untested", "Yes", "No"],
              ].map(([platform, loaders, wheel, gpu], i) => (
                <tr key={i} style={{ borderBottom: "1px solid var(--rule)" }}>
                  <td style={{ padding: "8px 12px", color: "var(--ink)" }}>{platform}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{loaders}</td>
                  <td style={{ padding: "8px 12px", color: "var(--ink-mute)" }}>{wheel}</td>
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
              a: "Run pip install vikshep-ingest in the active Python environment (check which pip and which python3 point to the same one).",
            },
            {
              q: "VIKSHEP_MCP_BIN not set — agent MCP calls will fail",
              a: "Take bin/vikshep-mcp from the vikshep-compute release archive for your platform (or build it with cargo build --release -p vikshep-mcp in a vikshep-compute clone) and export VIKSHEP_MCP_BIN=/path/to/vikshep-mcp. The variable is read at agent startup, not at import time.",
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
