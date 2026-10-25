export const metadata = { title: "Determinism — Vikshep" };

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

const h1: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(30px,4.5vw,64px)",
  lineHeight: 1.05,
  letterSpacing: "-0.02em",
  color: "var(--ink)",
  marginBottom: 20,
};

const h2: React.CSSProperties = {
  fontFamily: "var(--font-source-serif), Georgia, serif",
  fontWeight: 300,
  fontSize: "clamp(20px,2.8vw,36px)",
  lineHeight: 1.1,
  color: "var(--ink)",
  marginBottom: 14,
};

const prose: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.8,
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

const aside: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.65,
  color: "var(--ink-mute)",
  borderLeft: "2px solid var(--rule)",
  paddingLeft: 16,
  marginTop: 12,
};

const VDS_TIERS = [
  {
    id: "Tier 1",
    headline: "Bit-exact on every conforming backend",
    detail: [
      "All S₀, S₁, S₂ and r₂ = S₂/S₁ tensor computations",
      "All values are IEEE-754 binary32",
      "Explicit flush-to-zero (FTZ) applied after every multiply and add",
      "No FMA (fused multiply-add) unless this specification explicitly permits it",
      "No libm — all transcendental functions banned from Tier-1 kernels",
      "No compiler auto-vectorisation that would change the result order",
      "Verified identical on CPU (Rust reference), CUDA, and Metal for VDS-1.2 + numerics_version=3",
    ],
  },
  {
    id: "Tier 2",
    headline: "Bit-exact on every platform — always runs in the Rust CPU reference",
    detail: [
      "Filter construction (Morlet wavelets) and twiddle tables",
      "DisCo statistics: dCorr_w (weighted distance correlation), JSD",
      "SW1 / HNSW anomaly search",
      "Report generation",
      "GPU backends must not re-implement Tier-2 code — they receive the pre-built tables as inputs",
      "Uses IEEE-754 binary64 internally; where a Tier-2 result becomes a Tier-1 input, it is rounded to binary32 before crossing",
    ],
  },
  {
    id: "Tier 3",
    headline: "Provenance recorded — reproducibility not certified",
    detail: [
      "Geant4 simulation output",
      "Loader pre-processing from non-deterministic sources",
      "External model inference (if used)",
      "Studio records Tier-3 provenance: tool, version, build, platform, seed",
      "VDS-1 does not define conformance for Tier-3 operations",
    ],
  },
];

export default function DeterminismPage() {
  return (
    <article>

      {/* Hero */}
      <header style={{ ...sec(), paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>Determinism</p>
          <h1 style={h1}>
            Why floating point is usually not reproducible,
            <br />
            and how VDS-1 makes it so.
          </h1>
          <p style={{ ...prose, marginBottom: 0 }}>
            Vikshep guarantees that the same input produces the same output
            bytes across every conforming backend. This page explains what that
            guarantee costs, what it covers, and how you can verify it yourself
            with the free open-source tool.
          </p>
        </div>
      </header>

      {/* Why floating point is not reproducible */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>The problem</p>
          <h2 style={h2}>Why two runs of the same code can produce different numbers</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 760 }}>

            <div>
              <p style={{ ...mono, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 8 }}>
                1. Compiler reordering
              </p>
              <p style={prose}>
                Floating point addition is not associative: (a + b) + c may not equal a + (b + c) in binary32.
                An optimising compiler is permitted to reorder floating point operations unless you tell it
                not to (<code style={mono}>-fno-unsafe-math-optimizations</code>, Rust{" "}
                <code style={mono}>#[deny(clippy::float_arithmetic_round_trip)]</code>). Different
                optimisation levels, different pass orders, different compilers — different results.
              </p>
            </div>

            <div>
              <p style={{ ...mono, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 8 }}>
                2. Fused multiply-add (FMA)
              </p>
              <p style={prose}>
                A hardware FMA instruction computes a × b + c with one rounding, instead of two.
                Whether the compiler emits FMA depends on the CPU model, the compiler version, and
                the optimisation flags — not on the source code. A single FMA in the inner loop
                produces different low-order bits than the two-step version, and those bits
                accumulate through the computation.
              </p>
            </div>

            <div>
              <p style={{ ...mono, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 8 }}>
                3. Subnormal (denormal) numbers
              </p>
              <p style={prose}>
                Very small floating point values near zero are represented as subnormals, with
                reduced precision. Different hardware and compiler settings flush subnormals to zero
                at different points. A value that is 2.3 × 10⁻⁴⁵ on one machine becomes 0 on
                another. The difference is a handful of ULPs per operation, but in a cascade of
                several hundred wavelet convolutions it becomes measurable.
              </p>
            </div>

            <div>
              <p style={{ ...mono, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 8 }}>
                4. GPU non-determinism
              </p>
              <p style={prose}>
                GPU kernels launch thousands of threads; which threads execute in which order
                depends on the scheduler, the occupancy, and the driver version. Reductions and
                dot products are especially sensitive: summing 4096 values in a different order
                can change the last few bits. NVIDIA and Apple do not guarantee identical results
                across driver versions by default.
              </p>
            </div>

            <div>
              <p style={{ ...mono, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink)", marginBottom: 8 }}>
                5. libm functions
              </p>
              <p style={prose}>
                Transcendental functions (<code style={mono}>exp</code>,{" "}
                <code style={mono}>log</code>, <code style={mono}>sin</code>,{" "}
                <code style={mono}>cos</code>, <code style={mono}>sqrt</code>) vary by
                platform. glibc on x86_64 uses different hardware paths than macOS libm;
                CUDA uses its own polynomial approximations. Even for a correctly-rounded
                implementation, the last ULP may differ between platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How VDS-1 solves it */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>The solution</p>
          <h2 style={h2}>How VDS-1 eliminates each source of divergence</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 760 }}>
            <p style={prose}>
              VDS-1 (Vikshep Determinism Specification) is a written, versioned specification
              published in the open{" "}
              <a
                href="https://github.com/samvardhan03/vikshep-compute"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--ink)" }}
              >
                vikshep-compute
              </a>{" "}
              repository under CC-BY-4.0. It defines, for each computation, what "the same bytes"
              means and provides test vectors that any implementation can verify against.
            </p>

            {[
              {
                label: "No FMA in Tier-1 kernels",
                body: "VDS-1 §2.4 bans FMA from Tier-1 code unless the specification explicitly permits it. The reference Rust implementation uses explicit split operations. The CUDA and Metal backends set the appropriate compiler flags to disable FMA contraction.",
              },
              {
                label: "Explicit flush-to-zero at every operation",
                body: "VDS-1 §8.1 defines flush-to-zero semantics: after every multiply and every add in a Tier-1 kernel, any subnormal result is flushed to +0 or -0 preserving sign. This is emulated in software by the CPU reference and enforced by hardware flags on CUDA and Metal. The specification records that Metal 2 on GCN 4th-gen sets DENORM_FLZ_IN and DENORM_FLZ_OUT by default for compute shaders.",
              },
              {
                label: "No libm — portable exp/log/sin/cos implemented in crates/vikshep-detmath",
                body: "All transcendental functions used anywhere in the specification — currently exp, ln, sin, cos (for Morlet wavelet construction) — are implemented in crates/vikshep-detmath using exact polynomial approximations that produce the same bits on x86_64 and AArch64. CI verifies that cargo tree -e features -i libm prints no output.",
              },
              {
                label: "Stockham FFT with fixed butterfly order",
                body: "The wavelet convolutions use a Stockham auto-sort FFT, which has a predictable butterfly structure with no data-dependent branching. The butterfly order within each level is fixed; all backends execute it identically.",
              },
              {
                label: "Tier-2 computations run only in the Rust CPU reference",
                body: "Filter table construction and statistical computations (dCorr_w, JSD) always run in the single Rust reference implementation, regardless of which backend is active. GPU backends receive the pre-built tables as inputs. This eliminates the GPU non-determinism problem for Tier-2 code.",
              },
            ].map((item) => (
              <div key={item.label} style={{ borderLeft: "2px solid var(--rule)", paddingLeft: 20 }}>
                <p style={{ ...mono, fontSize: 13, color: "var(--ink)", marginBottom: 8 }}>{item.label}</p>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-mute)" }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VDS-1 tiers */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>VDS-1 tiers</p>
          <h2 style={h2}>Three tiers — one certificate per result</h2>
          <p style={{ ...prose, marginBottom: 32 }}>
            Every computation in Vikshep belongs to exactly one tier. The Determinism
            Certificate records the tier alongside the output OIDs, so a reviewer knows
            exactly what kind of reproducibility claim the certificate makes.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 800 }}>
            {VDS_TIERS.map((tier, i) => (
              <div
                key={tier.id}
                style={{
                  padding: "28px 0",
                  borderBottom: i < VDS_TIERS.length - 1 ? "1px solid var(--rule)" : "none",
                }}
              >
                <div style={{ display: "flex", gap: 16, alignItems: "baseline", marginBottom: 10 }}>
                  <span style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--accent)", flexShrink: 0 }}>
                    {tier.id}
                  </span>
                  <p style={{ fontFamily: "var(--font-source-serif), Georgia, serif", fontWeight: 300, fontSize: 18, color: "var(--ink)", lineHeight: 1.2 }}>
                    {tier.headline}
                  </p>
                </div>
                <ul style={{ listStyle: "none", padding: 0, paddingLeft: 80, display: "flex", flexDirection: "column", gap: 5 }}>
                  {tier.detail.map((d) => (
                    <li key={d} style={{ display: "flex", gap: 8, fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.55 }}>
                      <span style={{ color: "var(--rule)", flexShrink: 0 }}>—</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conformance CI */}
      <section style={sec()}>
        <div style={wrap}>
          <p style={eyebrow}>Conformance CI</p>
          <h2 style={h2}>Live status</h2>
          <p style={{ ...prose, marginBottom: 20 }}>
            The vikshep-compute repository runs a conformance suite on every commit
            across Linux x86_64 and macOS AArch64. The suite checks that every
            conformance vector in{" "}
            <code style={mono}>conformance/vectors/v3/</code> is reproduced
            bit-exactly. A backend may only claim conformance against one
            numerics version if it passes 100% of that version's vectors.
          </p>
          <a
            href="https://github.com/samvardhan03/vikshep-compute/actions"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...mono,
              fontSize: 13,
              color: "var(--ink)",
              border: "1px solid var(--rule)",
              padding: "10px 20px",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            Conformance CI — GitHub Actions →
          </a>
          <p style={aside}>
            The CI badge reflects the current state of the{" "}
            <code style={mono}>main</code> branch of samvardhan03/vikshep-compute.
            Conformance vectors are versioned; a new numerics version increments the
            vector directory and regenerates all hashes.
          </p>
        </div>
      </section>

      {/* Free verifier */}
      <section style={sec(false)}>
        <div style={wrap}>
          <p style={eyebrow}>Free verifier</p>
          <h2 style={h2}>Verify any result yourself</h2>
          <p style={{ ...prose, marginBottom: 24 }}>
            The free verifier re-runs the recorded computation with the open CPU
            reference and compares every output OID. It requires only the certificate
            file and the original input directory. It works fully offline. It is also
            exposed in the Python package for use in analysis pipelines.
          </p>

          <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginBottom: 4 }}>
            Install the verifier
          </p>
          <pre style={codeBlock}>{`git clone https://github.com/samvardhan03/vikshep-compute.git
cd vikshep-compute
cargo build --release -p vikshep-conformance`}</pre>

          <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginBottom: 4, marginTop: 20 }}>
            Verify a certificate
          </p>
          <pre style={codeBlock}>{`vikshep-conformance verify result.certificate.json --inputs ./inputs/

# Output:
# VERIFIED  output OIDs match (12 / 12)
# Tier-1 computations: 12  backend: cpu-rust  numerics_version: 3
# Certificate signed by: vsk_key_<id>  (Ed25519 — key not in trust store; signature valid)`}</pre>
          <p style={aside}>
            The verifier prints VERIFIED if every output OID in the certificate
            matches the OID produced by re-running the computation, or MISMATCH
            with a per-OID diff table if any output differs. A valid signature
            identifies the installation; the reviewer need not trust the
            installation to trust the OID match.
          </p>

          <p style={{ ...mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-mute)", marginBottom: 4, marginTop: 20 }}>
            Check the conformance hash report
          </p>
          <pre style={codeBlock}>{`cargo run -p vikshep-conformance -- hashes`}</pre>
          <p style={aside}>
            Prints the expected hash report for the current numerics version.
            CI runs this on every commit across platforms and compares the output
            byte-for-byte.
          </p>

          <div style={{ marginTop: 32, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="https://github.com/samvardhan03/vikshep-compute"
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...mono, fontSize: 13, color: "var(--bg)", backgroundColor: "var(--ink)", padding: "10px 20px", textDecoration: "none" }}
            >
              vikshep-compute on GitHub →
            </a>
            <a
              href="/studio"
              style={{ ...mono, fontSize: 13, color: "var(--ink)", border: "1px solid var(--rule)", padding: "10px 20px", textDecoration: "none" }}
            >
              Studio — Prove pillar →
            </a>
          </div>
        </div>
      </section>

    </article>
  );
}
