import RecipeLayout from "@/components/RecipeLayout";

export const metadata = { title: "HEP Tagging (DisCo)" };

export default function HepTaggingPage() {
  return (
    <RecipeLayout
      number="01"
      title="HEP Tagging (DisCo)"
      tagline="Mass-decorrelated boosted-object tagging."
      whenToUse={
        <>
          <p style={{ marginBottom: 14 }}>
            Use this recipe when you are running a resonance search with boosted objects — heavy
            Higgs → ZV, W&#x2032;/Z&#x2032;, X → tt&#x0304;, and similar — and you need a jet tagger
            that does not deform the background mass spectrum. Any standard neural tagger trained
            on jet features will implicitly learn the jet mass, making cuts on its score sculpt the
            background and create fake bumps in your bump-hunt.
          </p>
          <p style={{ marginBottom: 14 }}>
            This recipe replaces the learned feature extractor with the wavelet scattering transform,
            producing dimensionless r₂ = S₂/S₁ features that are scale-invariant by construction.
            A DisCo penalty in the classifier training then drives the residual statistical dependence
            between the tagger score and the resonance mass to zero on background events.
          </p>
          <p>
            The result is validated by two numbers: the significance gain Δσ over the NN baseline,
            and the Jensen–Shannon divergence ΔJSD measuring background mass-shape distortion before
            and after the cut. Both are computed against your existing Wilks Δχ² pipeline — no
            re-optimisation of the analysis required.
          </p>
        </>
      }
      whatItNeeds={{
        description: (
          <>
            <p style={{ marginBottom: 12 }}>
              Jet constituent four-vectors (ROOT TTree or HDF5) or pre-rasterised 64×64 η×φ jet
              images. The following branch names are expected by default and can be overridden via
              config:
            </p>
          </>
        ),
        code: `# ROOT TTree expected branches
fatjet_constituent_pt    # float[N] — per-constituent pT in GeV
fatjet_constituent_eta   # float[N] — pseudorapidity
fatjet_constituent_phi   # float[N] — azimuthal angle (radians)
fatjet_constituent_e     # float[N] — energy in GeV
reco_zv_mass             # float    — reconstructed resonance mass (GeV)
FullEventWeight          # float    — MC event weight
isSignal                 # int      — 1 for signal, 0 for background

# Alternatively: pre-rasterised jet image
# shape: (N_events, 64, 64, 1) — float32, HDF5 dataset "jet_image"`,
      }}
      howItWorks={[
        {
          method: "vikshep/ingest",
          description: (
            <>
              Loader reads constituent four-vectors from the ROOT TTree (or HDF5), writes them
              to a POSIX shared-memory segment, and returns a 28-char SHA3-256 hex OID. No
              serialisation crossing the Python–Rust boundary — the Rust data plane maps the
              same shared memory page directly.
            </>
          ),
          inputShape: "ROOT TTree / HDF5 file path",
          outputShape: "28-hex OID (shm://...)",
        },
        {
          method: "vikshep/compute_scattering",
          description: (
            <>
              Calls the C++/CUDA scattering engine via the Rust FFI bridge. Runs 2-D oriented
              SE(2) scattering with J=4 scales, Q=1 voice per octave, and L=8 orientations.
              Each jet image is convolved with the full oriented Morlet filter bank; the cascade
              modulus produces first- and second-order coefficients. Output is a coefficient
              tensor OID in shared memory.
            </>
          ),
          inputShape: "jet image OID",
          outputShape: "scattering coefficients OID · shape (N, J·L, J·L)",
        },
        {
          method: "vikshep/reduce_scattering",
          description: (
            <>
              Reduction with <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>method=&quot;ratio&quot;</code>.
              Computes r₂[λ₁, λ₂] = S₂[λ₁, λ₂] / S₁[λ₁] for all valid (λ₁, λ₂) pairs
              (j₂ {">"} j₁). Drops S₀ and the lowest-j S₁ entries (they carry the pT scale).
              The result is a dimensionless feature vector invariant to overall energy scale.
            </>
          ),
          inputShape: "scattering coefficients OID",
          outputShape: "r₂ feature OID · shape (N, n_pairs)",
        },
        {
          method: "vikshep/train_classifier_disco",
          description: (
            <>
              Fits a lightweight MLP on the r₂ features under the weighted DisCo training
              objective: wBCE(ŷ, y) + λ · dCorr²_w(ŷ, m | bkg). The distance correlation term
              is computed over background events only and penalises any statistical dependence
              between the tagger output and the reconstructed resonance mass. λ is a hyperparameter
              swept over a grid; the optimal value maximises signal efficiency at fixed JSD budget.
            </>
          ),
          inputShape: "r₂ feature OID + mass branch + isSignal branch + FullEventWeight",
          outputShape: "classifier model OID + AUC + mass-JSD pre/post cut",
        },
        {
          method: "(export)",
          description: (
            <>
              Writes the classifier model and benchmark numbers to disk. Output format: HDF5
              containing the model weights and the two benchmark numbers (Δσ and ΔJSD) computed
              against the analysis&#x2019;s existing Wilks Δχ² significance pipeline. A ROOT
              TFile with the post-cut mass histogram is also produced for visual inspection.
            </>
          ),
          inputShape: "classifier OID",
          outputShape: "classifier.h5 + benchmark.json + mass_hist.root",
        },
      ]}
      whatYouGet={[
        "classifier.h5 — trained MLP weights (portable, no runtime dependency on Vikshep)",
        "benchmark.json — { auc, jsd_precut, jsd_postcut, delta_sigma, lambda_optimal }",
        "mass_hist.root — background mass histograms pre/post cut, for visual inspection",
        "feature_oids.txt — SHA3-256 OIDs of intermediate scattering tensors (reusable)",
        "r2_features.h5 — exported r₂ feature matrix, shape (N_events, n_pairs)",
      ]}
      configure={[
        { param: "dim", value: "2", description: "Input dimensionality (jet images are 2-D)" },
        { param: "group", value: "so2", description: "Symmetry group — SE(2) roto-translation for 2-D images" },
        { param: "J", value: "4", description: "Number of octaves (scales). Higher J = longer range correlations" },
        { param: "Q", value: "1", description: "Voices per octave. Q=1 is sufficient for jet substructure" },
        { param: "L", value: "8", description: "Orientations in [0, π). L=8 gives 22.5° resolution" },
        { param: "order", value: "2", description: "Maximum scattering order. order=2 captures >99% of jet energy" },
        { param: "pad_phi", value: "Circular", description: "Azimuthal axis is periodic — use circular convolution" },
        { param: "pad_eta", value: "ZeroPad", description: "η axis is non-periodic — zero-pad to next power of two" },
        { param: "lambda_grid", value: "0,0.1,0.5,1,2,5,10", description: "DisCo penalty strengths swept during training" },
        { param: "mass_branch", value: "reco_zv_mass", description: "Branch name for the resonance mass (override as needed)" },
      ]}
      cli={`bun run main.ts process \\
  --input data/jets.root \\
  --recipe hep-tagging-disco \\
  --mass-branch reco_zv_mass \\
  --lambda-grid "0,0.1,0.5,1,2,5,10" \\
  --output results/hep-tagging/`}
      dashboardNote="The Vikshep dashboard shows the mass histogram before and after the cut, the JSD
        live readout as λ is swept, and a side-by-side significance comparison against the
        existing NN baseline. Available in the Pilot release."
      related={[
        { label: "The math behind r₂", href: "/math#s6" },
        { label: "Deformation stability", href: "/math#s1" },
        { label: "BSM Anomaly Detection", href: "/recipes/bsm-anomaly" },
        { label: "General Feature Extraction", href: "/recipes/feature-extract" },
        { label: "Pilot — UoE deployment", href: "/pilot" },
        { label: "DisCo paper", href: "https://arxiv.org/abs/2001.05310", external: true },
        { label: "GitHub", href: "https://github.com/samvardhan03/Vikshep", external: true },
      ]}
    />
  );
}
