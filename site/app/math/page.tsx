import MathBlock from "@/components/MathBlock";
import ScatteringCascade from "@/components/visualizations/ScatteringCascade";
import WaveletFilterBank from "@/components/visualizations/WaveletFilterBank";
import DeformationStability from "@/components/visualizations/DeformationStability";
import R2Invariance from "@/components/visualizations/R2Invariance";
import AnomalyEmbedding from "@/components/visualizations/AnomalyEmbedding";
import Link from "next/link";

export const metadata = { title: "Math" };

// ── shared styles ─────────────────────────────────────────────────
const sec: React.CSSProperties = {
  padding: "72px 0",
  borderBottom: "1px solid var(--rule)",
};
const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "0 24px",
};
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
  fontSize: "clamp(22px,2.8vw,36px)",
  color: "var(--ink)",
  marginBottom: 28,
  lineHeight: 1.15,
};
const prose: React.CSSProperties = {
  fontSize: 16,
  lineHeight: 1.75,
  color: "var(--ink-mute)",
  maxWidth: 700,
  marginBottom: 18,
};
const eqGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 16,
  margin: "28px 0",
};
const vizWrap: React.CSSProperties = {
  margin: "36px 0",
  padding: "32px",
  border: "1px solid var(--rule)",
  backgroundColor: "var(--bg-elev)",
};
const refItem: React.CSSProperties = {
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 12,
  lineHeight: 1.7,
  color: "var(--ink-mute)",
  paddingBottom: 10,
  borderBottom: "1px solid var(--rule)",
  marginBottom: 10,
};
const tag: React.CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--font-jetbrains), monospace",
  fontSize: 10,
  padding: "2px 6px",
  border: "1px solid var(--rule)",
  marginRight: 6,
  color: "var(--accent)",
};

export default function MathPage() {
  return (
    <article>
      {/* ── Header ── */}
      <header style={{ ...sec, paddingTop: 96 }}>
        <div style={wrap}>
          <p style={eyebrow}>The substrate</p>
          <h1
            style={{
              fontFamily: "var(--font-source-serif), Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(40px,5vw,80px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 20,
            }}
          >
            The math, end to end.
          </h1>
          <p style={{ ...prose, fontSize: 19, maxWidth: 620 }}>
            Every guarantee Vikshep makes is derived from one of six pieces of mathematics.
            Here they are.
          </p>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {[
              ["§1", "1-D scattering", "#s1"],
              ["§2", "n-D orientation", "#s2"],
              ["§3", "Solid harmonics", "#s3"],
              ["§4", "Lie group convolution", "#s4"],
              ["§5", "Steerable wavelets", "#s5"],
              ["§6", "Mass decorrelation", "#s6"],
            ].map(([num, label, href]) => (
              <a
                key={href}
                href={href}
                style={{
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  textDecoration: "none",
                  border: "1px solid var(--rule)",
                  padding: "4px 10px",
                }}
              >
                <span style={{ color: "var(--accent)", marginRight: 6 }}>{num}</span>
                {label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ── §1 — 1-D Scattering Transform ── */}
      <section id="s1" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 1 — The 1-D scattering transform</p>
          <h2 style={h2}>The cascade and its three guarantees.</h2>

          <p style={prose}>
            The wavelet scattering transform is built from one mother wavelet — the analytic Morlet,
            a complex sinusoid windowed by a Gaussian and corrected to have zero mean. The correction
            term κ removes the DC component so that the filter is truly band-pass and the cascade
            remains energy-preserving.
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="1.1 — Morlet wavelet"
              latex={String.raw`\psi(t) = \big(e^{i\xi t} - \kappa\big)\,e^{-t^2/(2\sigma^2)}, \qquad \kappa = e^{-\xi^2\sigma^2/2}`}
              caption="ξ is the carrier frequency; σ controls the Gaussian envelope. Analytic: no negative-frequency content, so the modulus is a well-defined instantaneous amplitude."
            />
          </div>

          <p style={prose}>
            The family is generated by dilation, giving J · Q band-pass filters logarithmically spaced
            in frequency plus a low-pass averaging kernel φ_J at scale 2^J. The scattering coefficients
            of orders 0, 1, and 2 are produced by a cascade of convolutions and moduli:
          </p>

          <MathBlock
            title="1.2 — Scattering coefficients S₀, S₁, S₂"
            latex={String.raw`S_0\,x = x \star \phi_J \qquad S_1[\lambda_1]\,x = |x \star \psi_{\lambda_1}| \star \phi_J \qquad S_2[\lambda_1,\lambda_2]\,x = \big|\,|x \star \psi_{\lambda_1}| \star \psi_{\lambda_2}\big| \star \phi_J`}
            caption="The modulus |·| is the key non-linearity. It is 1-Lipschitz and breaks translation invariance of the intermediate representation in a controlled way — allowing finer-scale structure to propagate to S₂."
          />

          <p style={prose}>
            Energy decays geometrically with order, so we truncate at m = 2 and capture {">"}99% of
            the signal energy. Three structural properties follow immediately from the architecture.
            Translation invariance holds at the scale of φ_J. Non-expansiveness follows because the
            cascade is built from a frame and the 1-Lipschitz modulus: ‖Sx − Sy‖ ≤ ‖x − y‖. The
            most important property is deformation stability — the Mallat bound:
          </p>

          <MathBlock
            title="1.3 — Mallat deformation stability bound"
            latex={String.raw`\|S(\mathcal{L}_\tau x) - Sx\| \;\le\; C\!\left(\|\nabla\tau\|_\infty + \tfrac{\|\tau\|_\infty}{2^J} + \|H\tau\|_\infty\right)\|x\|`}
            caption="𝓛_τ is a diffeomorphic deformation of displacement field τ. ∇τ controls local stretching; ‖τ‖/2^J bounds large translations relative to the averaging scale; Hτ (Hessian) bounds bending. All three must be small — which they are for detector smearing and pile-up."
          />

          <p style={prose}>
            This is the property a physicist needs. Detector noise and small geometric warps produce
            only bounded changes in the representation. A learned feature extractor has no such
            guarantee — it may amplify or suppress any particular deformation pattern depending on
            what it saw during training.
          </p>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 20 }}>Interactive — the cascade in action</p>
            <ScatteringCascade />
          </div>
        </div>
      </section>

      {/* ── §2 — n-D Orientation ── */}
      <section id="s2" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 2 — From 1-D to n-D: orientation is not optional</p>
          <h2 style={h2}>Why a tensor product fails, and what to use instead.</h2>

          <p style={prose}>
            The naive n-D extension is a separable wavelet ψ(u) = ∏_k ψ(u_k). It has no orientation
            selectivity. In a calorimeter image, orientation is the signal — a 30° energy streak must
            be distinguished from a 60° one. Separable wavelets treat both identically because they
            decompose along coordinate axes only.
          </p>

          <p style={prose}>
            The correct generalisation is the oriented Morlet wavelet bank. A mother wavelet is
            dilated and rotated to produce filters at J · Q · L orientations:
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="2.1 — Oriented Morlet family"
              latex={String.raw`\psi_{j,\theta}(u) = 2^{-2j}\,\psi\!\big(2^{-j} R_{-\theta}\,u\big), \qquad \theta \in \{0, \pi/L, \dots, (L-1)\pi/L\}`}
              caption="R_{-θ} rotates u by angle −θ before passing it to ψ. The bank now has J·Q·L filters. The cascade and all three structural properties of §1 carry over verbatim with u replacing t."
            />
            <MathBlock
              title="2.2 — Parseval frame condition"
              latex={String.raw`|\hat\phi_J(\omega)|^2 + \sum_{j,\theta} |\hat\psi_{j,\theta}(\omega)|^2 = 1`}
              caption="The filters tile frequency space completely. No energy leaks out of the frame. This is what makes the scattering representation energy-preserving — a property that learned convolutional networks do not have in general."
            />
          </div>

          <p style={prose}>
            Calorimeter geometry adds one subtlety. The azimuthal angle φ is genuinely periodic;
            the pseudorapidity η is not. FFT-based convolution is circular by default. The engine
            carries a per-axis pad policy: <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>Circular</code> for
            φ, <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 13 }}>ZeroPad</code> (next power-of-two, halo discarded)
            for η. Using circular convolution on η contaminates the edge bins — a silent error that
            would not appear in unit tests checking only the bulk of the distribution.
          </p>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 20 }}>Interactive — oriented Morlet filter bank</p>
            <WaveletFilterBank />
          </div>
        </div>
      </section>

      {/* ── §3 — Solid Harmonics ── */}
      <section id="s3" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 3 — Solid-harmonic wavelets and SO(3) covariance</p>
          <h2 style={h2}>Rotation invariance for 3-D fields, by construction.</h2>

          <p style={prose}>
            For volumetric data — 3-D energy deposits, cosmological density fields, voxelised point
            clouds — oriented Morlet wavelets are insufficient because they are defined for 2-D images
            under SE(2). Three-dimensional rotation has a richer structure: SO(3). The natural basis
            for functions on the sphere is the spherical harmonics Y_ℓ^m, and solid-harmonic wavelets
            are built directly from them:
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="3.1 — Solid-harmonic wavelet family"
              latex={String.raw`\psi_\ell^m(u) = |u|^\ell\, Y_\ell^m(\hat u)\, e^{-|u|^2/(2\sigma^2)}, \qquad \psi_{j,\ell}^m(u) = 2^{-3j}\,\psi_\ell^m\!\big(2^{-j} u\big)`}
              caption="ℓ is the angular frequency (order of spherical harmonic); m ∈ [−ℓ, ℓ] is the orientation. The |u|^ℓ factor makes the wavelet exactly harmonic. Dilation by 2^j produces a log-spaced scale family with J · (L_max + 1)² filters."
            />
          </div>

          <p style={prose}>
            Under rotation g ∈ SO(3), spherical harmonics of fixed ℓ transform among themselves
            by the unitary Wigner-D matrix. This is the algebraic fact that makes solid-harmonic
            scattering covariant:
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="3.2 — Wigner-D rotation law"
              latex={String.raw`Y_\ell^m\!\big(g^{-1}\hat u\big) = \sum_{m'=-\ell}^{\ell} D^\ell_{m'm}(g)\, Y_\ell^{m'}(\hat u)`}
              caption="D^ℓ is the (2ℓ+1)×(2ℓ+1) Wigner-D representation matrix of g. The key property: D^ℓ is unitary, so the Frobenius norm — equivalently, the sum of |m|² — is rotation-invariant."
            />
            <MathBlock
              title="3.3 — SO(3)-invariant propagator"
              latex={String.raw`U[j,\ell]\,x(u) = \!\left( \sum_{m=-\ell}^{\ell} \big| x \star \psi_{j,\ell}^m \big|^2(u) \right)^{1/2}`}
              caption="Because D^ℓ is unitary, the sum-of-squares over m is invariant to rotation of x. Spatial averaging φ_J then gives full SO(3)-invariance. Second-order coefficients capture bispectrum-like structure invisible to the power spectrum."
            />
          </div>

          <p style={prose}>
            First-order invariants S[j, ℓ] encode power-spectrum-like information. Second-order
            invariants S[j₁, ℓ₁, j₂, ℓ₂] encode bispectrum-like, non-Gaussian structure — the regime
            where scattering measurably outperforms the power spectrum in cosmology (Cheng &amp; Ménard,
            arXiv:2112.01288) and where boosted-jet substructure carries its discriminating power.
          </p>
        </div>
      </section>

      {/* ── §4 — Lie Group Convolution ── */}
      <section id="s4" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 4 — Lie group convolution</p>
          <h2 style={h2}>Invariance to a group = convolve over the group, then average over the orbit.</h2>

          <p style={prose}>
            The unifying view of every invariance Vikshep provides: lift the signal to the group,
            convolve along the group, take a modulus, and average over the group orbit. The three
            cases — translation, roto-translation, and 3-D rotation — are instances of the same
            abstract construction over different groups G:
          </p>
          <ul style={{ ...prose, paddingLeft: 20, marginBottom: 24 }}>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--ink)" }}>G = ℝⁿ</strong> — translation only. The 1-D and 2-D separable cases.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--ink)" }}>G = SE(2) = ℝ² ⋊ SO(2)</strong> — roto-translation. The oriented 2-D case.
            </li>
            <li style={{ marginBottom: 6 }}>
              <strong style={{ color: "var(--ink)" }}>G = SO(3)</strong> — full 3-D rotation. The solid-harmonic case.
            </li>
          </ul>

          <p style={prose}>
            For SE(2): the first oriented layer already produces a field on the group. The second
            layer convolves jointly over space and orientation with a wavelet that has a θ-component,
            producing a representation on SE(2) × SE(2):
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="4.1 — First-layer output lives on SE(2)"
              latex={String.raw`U_1[j_1,\theta_1](u) \;\in\; \text{functions on } SE(2)`}
              caption="The signal has been lifted from ℝ² to the group. This lifting is what allows the second layer to capture interactions between orientations at different scales — the cross-scale, cross-orientation structure that separable wavelets miss."
            />
            <MathBlock
              title="4.2 — SE(2) second-layer convolution"
              latex={String.raw`U_2[\,j_1,\theta_1,\,j_2,\theta_2,k\,](u) = \!\left|\, U_1[j_1,\theta_1] \;\ast_{SE(2)}\; \Psi_{j_2,\theta_2,k}\,\right|(u)`}
              caption="∗_{SE(2)} is convolution over the group (space × orientation jointly). Final low-pass averaging over space and orientation gives coefficients invariant to global roto-translation and stable to deformation."
            />
          </div>

          <p style={prose}>
            <strong style={{ color: "var(--ink)" }}>A design decision:</strong> Standard jet-image preprocessing
            pre-centres the jet, rotates its principal axis to vertical, and flips it to canonical
            parity. If you also run roto-translation scattering, you are being invariant to a symmetry
            you already removed — wasted compute, and the redundant averaging can wash out discriminating
            information. Pick one: either skip the pre-rotation and let SE(2) scattering own the
            invariance (preferred — exact rather than heuristic), or keep the pre-rotation and use
            G = ℝ². Do not do both.
          </p>
        </div>
      </section>

      {/* ── §5 — Steerable Wavelets ── */}
      <section id="s5" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 5 — Steerable wavelets and GPU register economy</p>
          <h2 style={h2}>Why the SO(3) engine fits in a register file.</h2>

          <p style={prose}>
            A filter is steerable if its rotation to any angle is a fixed linear combination of a
            small basis of K basis filters — independent of L, the total number of discrete orientations
            in the bank:
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="5.1 — Steerability definition"
              latex={String.raw`\psi_\theta(u) = \sum_{k=1}^{K} b_k(\theta)\,\varphi_k(u), \qquad K \ll L`}
              caption="b_k(θ) are steering coefficients that depend only on the target angle; φ_k are fixed basis filters. For SO(3), the steering coefficients are Wigner-D matrix entries and the basis filters are the solid-harmonic wavelets of §3."
            />
            <MathBlock
              title="5.2 — Convolution via steerability"
              latex={String.raw`(x \star \psi_\theta)(u) = \sum_{k=1}^{K} b_k(\theta)\,(x \star \varphi_k)(u)`}
              caption="By linearity of convolution: compute K basis convolutions once; synthesize any orientation by a K-wide linear combination. No per-orientation FFT. The orientation axis becomes a K-wide GEMM fused into the modulus kernel."
            />
          </div>

          <p style={prose}>
            This is a correctness-of-performance requirement, not an optimization. Brute force computes
            one convolution per orientation: O(L) separate FFT passes. At Dim=3, the per-thread working
            set blows the register file and spills to local memory, collapsing throughput by 4–8×.
            Steering turns the orientation axis into a K-wide GEMM fused into the modulus kernel —
            kept in registers within the tile policy (64×64 on Ampere, 128×128 on Hopper). It is the
            difference between a kernel that fits and a kernel that spills. The GPU performance
            characteristics of the two approaches are not competitive at Dim=3, L_max ≥ 2.
          </p>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 20 }}>Interactive — deformation stability</p>
            <DeformationStability />
          </div>
        </div>
      </section>

      {/* ── §6 — Mass Decorrelation ── */}
      <section id="s6" style={sec}>
        <div style={wrap}>
          <p style={eyebrow}>§ 6 — Eliminating mass sculpting</p>
          <h2 style={h2}>Ratios + a closed-form penalty.</h2>

          <p style={prose}>
            Let ŷ be the tagger score and M the resonance mass. A selection ŷ {">"} c keeps background
            events with mass-dependent efficiency ε(m):
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="6.1 — Mass-dependent efficiency"
              latex={String.raw`\epsilon(m) = \Pr(\hat y > c \mid M = m,\, \text{bkg})`}
              caption="If ŷ is mass-independent, ε(m) = ε is a constant and the post-cut spectrum is proportional to the pre-cut spectrum — no sculpting. If ŷ depends on M, ε(m) varies with mass and reshapes the background."
            />
            <MathBlock
              title="6.2 — Post-cut background density"
              latex={String.raw`f^{\text{cut}}_{\text{bkg}}(m) \;\propto\; \epsilon(m)\, f_{\text{bkg}}(m)`}
              caption="Sculpting = ε(m) non-constant. Any bump-hunt that assumes f^{cut}_{bkg} is smooth and ε-independent will attribute the sculpted feature to a signal peak. This is the failure mode."
            />
          </div>

          <p style={prose}>
            <strong style={{ color: "var(--ink)" }}>Stage one — remove the mass scale.</strong> Drop
            S₀ and the lowest-j S₁ coefficients (they carry the energy/mass scale directly). Use the
            dimensionless ratio r₂ instead:
          </p>

          <MathBlock
            title="6.3 — The r₂ ratio"
            latex={String.raw`r_2[\lambda_1,\lambda_2] = \frac{S_2[\lambda_1,\lambda_2]}{S_1[\lambda_1]}`}
            caption="The scattering analogue of D₂ and τ₂₁. Scale-invariant by construction — it cannot carry an energy scale because both numerator and denominator scale identically with jet pT. Residual correlation through non-linear structure is handled by stage two."
          />

          <p style={prose}>
            <strong style={{ color: "var(--ink)" }}>Stage two — kill the residual with DisCo.</strong>{" "}
            For samples {"{"}X_i{"}"}, {"{"}Y_i{"}"} with weights w_i, the weighted distance covariance is:
          </p>

          <div style={eqGrid}>
            <MathBlock
              title="6.4 — Weighted distance covariance"
              latex={String.raw`\mathrm{dCov}^2_w(X,Y) = \frac{\sum_{i,j} w_i w_j\, A_{ij} B_{ij}}{(\sum_i w_i)^2}`}
              caption="A, B are weighted-double-centred distance matrices. dCov²_w(X,Y) = 0 if and only if X and Y are statistically independent. No distributional assumptions. No kernel choice. Valid for arbitrary non-linear dependence."
            />
            <MathBlock
              title="6.5 — Training objective with DisCo"
              latex={String.raw`\mathcal{L} = \mathrm{wBCE}(\hat y, y) + \lambda\,\mathrm{dCorr}^2_w(\hat y, m \mid \text{bkg})`}
              caption="The penalty drives ŷ ⊥ M on background events. Once dCorr² = 0, ε(m) is constant and the spectrum is preserved exactly. λ controls the AUC–decorrelation tradeoff. The demo below shows this tradeoff live."
            />
          </div>

          <p style={prose}>
            This is the closed-form guarantee. The penalty is not a heuristic post-processing step,
            not an adversarial training trick that might or might not converge, and not a planing
            procedure that requires re-optimisation of the cut. It is a single differentiable term
            in the loss function that provably drives the score distribution to be independent of mass
            on background — hence ε(m) constant — hence the background shape preserved by construction.
          </p>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 8 }}>See it live on the home page</p>
            <p style={{ ...prose, marginBottom: 16, fontSize: 14 }}>
              The Mass-Sculpting Killer interactive on the home page shows this tradeoff directly:
              toggle between the standard NN tagger and the Vikshep r₂ tagger, drag the DisCo
              penalty λ and the cut threshold c, and watch the background mass histogram respond.
            </p>
            <Link
              href="/#mass-sculpting"
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 13,
                color: "var(--ink)",
                textDecoration: "none",
                border: "1px solid var(--rule)",
                padding: "8px 16px",
                display: "inline-block",
              }}
            >
              Go to the interactive demo →
            </Link>
          </div>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 20 }}>Interactive — r₂ mass invariance</p>
            <R2Invariance />
          </div>

          <div style={vizWrap}>
            <p style={{ ...eyebrow, marginBottom: 20 }}>Interactive — BSM anomaly embedding</p>
            <AnomalyEmbedding />
          </div>
        </div>
      </section>

      {/* ── References ── */}
      <section style={{ ...sec, borderBottom: "none" }}>
        <div style={wrap}>
          <p style={eyebrow}>References</p>
          <h2 style={h2}>Canonical sources.</h2>

          <div style={{ maxWidth: 800 }}>
            {[
              {
                authors: "Mallat, S.",
                title: "Group Invariant Scattering",
                venue: "Communications on Pure and Applied Mathematics, 65(10), 2012",
                arxiv: "1101.2286",
              },
              {
                authors: "Bruna, J. & Mallat, S.",
                title: "Invariant Scattering Convolution Networks",
                venue: "IEEE TPAMI 35(8), 2013",
                arxiv: "1203.1513",
              },
              {
                authors: "Sifre, L. & Mallat, S.",
                title: "Rotation, Scaling and Deformation Invariant Scattering for Texture Discrimination",
                venue: "CVPR 2013",
                arxiv: null,
              },
              {
                authors: "Eickenberg, M. et al.",
                title: "Solid Harmonic Wavelet Scattering for Predictions of Molecule Properties",
                venue: "J. Chem. Phys. 148(24), 2018",
                arxiv: "1805.00571",
              },
              {
                authors: "Kasieczka, G. & Shih, D.",
                title: "DisCo Fever: Robust Networks Through Distance Correlation",
                venue: "Physical Review Letters 125(12), 2020",
                arxiv: "2001.05310",
              },
              {
                authors: "Cheng, S. & Ménard, B.",
                title: "How to Quantify Fields or Textures? A Guide to the Scattering Transform",
                venue: "arXiv preprint, 2021",
                arxiv: "2112.01288",
              },
            ].map((r) => (
              <div key={r.arxiv ?? r.title} style={refItem}>
                <span style={{ color: "var(--ink)", fontWeight: 600 }}>{r.authors}</span>
                {" — "}
                <span>{r.title}</span>
                {". "}
                <span style={{ color: "var(--ink-mute)", fontSize: 11 }}>{r.venue}.</span>
                {r.arxiv && (
                  <span style={{ ...tag, marginLeft: 8 }}>arXiv:{r.arxiv}</span>
                )}
              </div>
            ))}
          </div>

          {/* Cite Vikshep */}
          <div style={{ marginTop: 48 }}>
            <p style={eyebrow}>Cite Vikshep</p>
            <pre
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 12,
                lineHeight: 1.7,
                color: "var(--ink-mute)",
                backgroundColor: "var(--bg-elev)",
                border: "1px solid var(--rule)",
                padding: "20px 24px",
                overflowX: "auto",
                maxWidth: 700,
                marginTop: 16,
              }}
            >
{`@software{vikshep_2026,
  author  = {Singh, Samvardhan and Mishra, Yash},
  title   = {Vikshep: A deterministic, deformation-stable
             feature-extraction plane for scientific compute},
  year    = {2026},
  url     = {https://github.com/samvardhan03/Vikshep},
  license = {Apache-2.0}
}`}
            </pre>
          </div>
        </div>
      </section>
    </article>
  );
}
