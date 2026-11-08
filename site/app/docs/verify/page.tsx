import Link from "next/link";

export const metadata = { title: "Verify — Docs" };

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

const mono: React.CSSProperties = {
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
  marginBottom: 4,
};

const note: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

export default function VerifyDocsPage() {
  return (
    <article>
      <div style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <p style={eyebrow}>Verify</p>
        <h1 style={h1Style}>Verifying a determinism certificate</h1>
        <p style={{ ...prose, marginBottom: 24 }}>
          Every Studio result carries a Determinism Certificate — a JSON document that
          records the provenance manifest, the VDS-1 conformance evidence, and an optional
          Ed25519 signature. Any reviewer can re-run the recorded computation with the free
          open-source verifier and confirm that the output OIDs match. The verifier works
          fully offline and requires no account.
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: "Determinism", href: "/determinism" },
            { label: "Studio", href: "/docs/studio" },
            { label: "Simulate", href: "/docs/simulate" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                ...mono,
                fontSize: 12,
                textTransform: "uppercase" as const,
                letterSpacing: "0.12em",
                color: "var(--ink)",
                border: "1px solid var(--rule)",
                padding: "8px 16px",
                textDecoration: "none",
              }}
            >
              {link.label} →
            </Link>
          ))}
        </div>
      </div>

      {/* Certificate structure */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={{ ...h2Style, marginTop: 0 }}>Certificate structure</h2>
        <p style={prose}>
          A Determinism Certificate is a JSON document with three top-level sections:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 10, maxWidth: 680 }}>
          {[
            {
              key: "provenance",
              desc: "The full ProvenanceManifest: engine_version, engine_build_hash, executor, platform, op, config_digest, seed, input_oids, output_oids, wall_clock_ms, created_at, manifest_hash.",
            },
            {
              key: "conformance",
              desc: "The evidence block: suite_version, numerics_version, backend (cpu-rust / cuda / metal), local_self_test (pass/fail). Suite version and numerics version identify which conformance vectors were checked.",
            },
            {
              key: "signature",
              desc: "Optional. Algorithm: Ed25519. Public key ID: identifies the installation. The signature covers the serialised provenance + conformance sections. Verifying the signature proves which installation produced the certificate; it is not required to verify the output OIDs.",
            },
          ].map((item) => (
            <li key={item.key} style={{ borderLeft: "2px solid var(--rule)", paddingLeft: 16 }}>
              <p style={{ ...mono, fontSize: 12, color: "var(--ink)", marginBottom: 4 }}>{item.key}</p>
              <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--ink-mute)" }}>{item.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Export a certificate */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Exporting a certificate from Studio</h2>
        <p style={prose}>
          In Studio, open the Provenance screen for any completed run. The Export button
          produces two files:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 6, maxWidth: 600 }}>
          {[
            "result.certificate.json — the machine-readable certificate for the verifier",
            "result.certificate.html — a printable summary for inclusion in a paper appendix",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.5 }}>
              <span style={{ color: "var(--accent)", flexShrink: 0 }}>+</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ ...note }}>
          The certificate is also written automatically to the run output directory as
          <code style={mono}> result.certificate.json</code> alongside{" "}
          <code style={mono}>provenance.json</code> and any report files.
        </p>
      </section>

      {/* Install the verifier */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Installing the free verifier</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          The verifier is part of the open vikshep-compute core. Each release ships it
          prebuilt in the archive for your platform, with the conformance vectors:
        </p>
        <pre style={codeBlock}>{`# from https://github.com/samvardhan03/vikshep-compute/releases
tar -xzf vikshep-compute-0.1.0-<platform>.tar.gz
cd vikshep-compute-0.1.0-<platform>
bin/vikshep-conformance run --vectors conformance/vectors/v3   # self-test: 434 cases

# or from source, with a Rust toolchain
git clone https://github.com/samvardhan03/vikshep-compute.git
cd vikshep-compute && cargo build --release -p vikshep-conformance`}</pre>
        <p style={note}>
          The binary is <code style={mono}>bin/vikshep-conformance</code> in the archive, or{" "}
          <code style={mono}>target/release/vikshep-conformance</code> after a source build.
          Add it to your PATH or use it with a full path. No account or internet connection
          is required after build.
        </p>
        <h2 style={h2Style}>Python package</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          The verifier is also exposed in the Python package for use in analysis pipelines:
        </p>
        <pre style={codeBlock}>{`pip install vikshep-compute

from pathlib import Path
from vikshep_compute import verify_certificate
report = verify_certificate(Path("result.certificate.json").read_text(), "./inputs/")
print(report["verified"])   # True when every output OID and the manifest hash match`}</pre>
      </section>

      {/* Run the verifier */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Running the verifier</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          Pass the certificate file and the directory containing the original input files:
        </p>
        <pre style={codeBlock}>{`vikshep-conformance verify result.certificate.json --inputs ./inputs/`}</pre>
        <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 20, marginBottom: 4 }}>
          Successful output
        </p>
        <pre style={codeBlock}>{`  output coefficients: f4fa73ec81863e857a287b8e00e9 OK
  manifest_hash: OK
VERIFIED`}</pre>
        <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginTop: 20, marginBottom: 4 }}>
          Mismatch output (tampered or different version)
        </p>
        <pre style={codeBlock}>{`  output coefficients: expected f4fa73ec81863e857a287b8e00e9 got <28 hex>  MISMATCH
  manifest_hash: OK
MISMATCH`}</pre>
        <p style={note}>
          The exit code is 0 for VERIFIED and 1 for MISMATCH. An input file whose content
          does not have the OID the certificate records is reported before any comparison
          (<code style={mono}>verify: input OID mismatch: ...</code>, exit 1).
        </p>
        <p style={note}>
          A MISMATCH does not necessarily mean fraud — it may indicate a different engine
          version or a different numerics version. Check the{" "}
          <code style={mono}>numerics_version</code> field in the certificate against the
          verifier&apos;s (<code style={mono}>vikshep_compute.NUMERICS_VERSION</code>, or the
          vikshep-compute release it came from). If the versions match and you still get a
          MISMATCH, contact the result author.
        </p>
      </section>

      {/* Conformance self-test */}
      <section style={{ borderBottom: "1px solid var(--rule)", paddingBottom: 32 }}>
        <h2 style={h2Style}>Conformance self-test</h2>
        <p style={{ ...prose, marginBottom: 8 }}>
          To verify that your build of the engine produces the expected conformance hashes:
        </p>
        <pre style={codeBlock}>{`cargo run -p vikshep-conformance -- hashes`}</pre>
        <p style={note}>
          This command prints the expected hash report for the current numerics version.
          The CI at{" "}
          <a
            href="https://github.com/samvardhan03/vikshep-compute/actions"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--ink)" }}
          >
            github.com/samvardhan03/vikshep-compute/actions
          </a>{" "}
          runs this on every commit across Linux x86_64 and macOS AArch64.
        </p>
      </section>

      {/* Peer review */}
      <section>
        <h2 style={h2Style}>Including a certificate in a paper</h2>
        <p style={prose}>
          The recommended citation for a Vikshep result in a paper is:
        </p>
        <ul style={{ listStyle: "none", padding: 0, marginTop: 12, display: "flex", flexDirection: "column", gap: 8, maxWidth: 680 }}>
          {[
            "Export the certificate as HTML from Studio → Provenance → Export.",
            "Include the certificate HTML as a supplementary appendix or in the data availability statement.",
            "Provide the free verifier command so reviewers can re-run the computation.",
            "Optional: include the certificate JSON in your data archive (Zenodo, CDS, etc.).",
          ].map((item, i) => (
            <li key={i} style={{ display: "flex", gap: 8, fontSize: 14, color: "var(--ink-mute)", lineHeight: 1.55 }}>
              <span style={{ ...mono, fontSize: 11, color: "var(--accent)", flexShrink: 0, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ul>
        <p style={{ ...note, marginTop: 20 }}>
          The free verifier is open source, requires no account, and works offline.
          A reviewer does not need to install Vikshep Studio to verify a result — only the
          verifier and the original input files.
        </p>
      </section>
    </article>
  );
}
