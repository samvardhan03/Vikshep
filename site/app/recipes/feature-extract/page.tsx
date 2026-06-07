import RecipeLayout from "@/components/RecipeLayout";

export const metadata = { title: "General Feature Extraction" };

export default function FeatureExtractPage() {
  return (
    <RecipeLayout
      number="03"
      title="General Feature Extraction"
      tagline="Cosmology, plasma, GW, hydrodynamics."
      whenToUse={
        <>
          <p style={{ marginBottom: 14 }}>
            Use this recipe when you need translation- and rotation-invariant, multiscale,
            deformation-stable features for any tensor-valued scientific data — and you do not
            want to train a model to produce them. The scattering transform is a fixed, analytic
            feature extractor: no training, no data-hungry fitting, no hyperparameter search
            beyond the wavelet bank geometry.
          </p>
          <p style={{ marginBottom: 14 }}>
            First-order coefficients S₁ recover power-spectrum-like information (second-order
            statistics). Second-order coefficients S₂ recover bispectrum-like structure — the
            non-Gaussian information that the power spectrum is blind to and that distinguishes
            physically different fields with identical two-point functions. This has been validated
            in weak-lensing cosmology (Cheng &amp; Ménard, 2021), molecule property prediction
            (Eickenberg et al., 2018), and plasma turbulence.
          </p>
          <p>
            The engine is runtime-configurable: pass (dim, group, J, Q, L) as flags and the same
            binary handles 1-D gravitational-wave strain, 2-D CMB patches, and 3-D density fields.
            No recompilation, no model retraining, no rebuild per domain.
          </p>
        </>
      }
      whatItNeeds={{
        description: (
          <>
            <p style={{ marginBottom: 12 }}>
              Any tensor data. The engine accepts 1-D arrays, 2-D images, and 3-D volumes from
              ROOT, HDF5, NumPy, VTK, and FITS sources. Provide the path, the dataset name (for
              HDF5/ROOT), and the (dim, group) config; the engine handles the rest.
            </p>
          </>
        ),
        code: `# 1-D: gravitational-wave strain / time series
strain.h5        # dataset "strain", shape (N_segments, T)

# 2-D: weak-lensing convergence maps / CMB patches
kappa_maps.fits  # shape (N_patches, 512, 512)

# 2-D: jet images (use hep-tagging recipe for mass decorrelation)
jet_images.h5    # shape (N_events, 64, 64)

# 3-D: density field / plasma simulation / nuclear structure
density.h5       # shape (N_snapshots, 128, 128, 128)
field.vtk        # VTK UnstructuredGrid or ImageData

# NumPy arrays — any shape matching dim
data.npy         # shape (..., *spatial_dims)`,
      }}
      howItWorks={[
        {
          method: "vikshep/ingest",
          description: (
            <>
              Loader reads the tensor from the source format, applies any requested pre-processing
              (normalisation, patching, mean subtraction), writes the result to POSIX shared
              memory, and returns a 28-char OID with an attached shape metadata record. The
              ingest step handles format detection automatically based on the file extension.
            </>
          ),
          inputShape: "file path + dataset name + pre-processing config",
          outputShape: "28-hex OID + shape tuple + dtype",
        },
        {
          method: "vikshep/compute_scattering",
          description: (
            <>
              Runs the scattering engine with caller-supplied (dim, group, J, Q, L). The engine
              selects the appropriate filter bank at runtime:
              <ul style={{ margin: "8px 0 0 16px", lineHeight: 1.8, fontSize: 13 }}>
                <li>dim=1, group=trivial → 1-D Morlet wavelets</li>
                <li>dim=2, group=so2 → oriented 2-D Morlet bank (SE(2))</li>
                <li>dim=3, group=so3 → solid-harmonic wavelets (SO(3))</li>
              </ul>
              The C++/CUDA kernel is compiled once; the (dim, group) selection is a dispatch
              over a templated engine class — no runtime branching in the hot path.
            </>
          ),
          inputShape: "data OID + (dim, group, J, Q, L)",
          outputShape: "coefficient OID · shape depends on (dim, J, L, order)",
        },
        {
          method: "vikshep/reduce_scattering",
          description: (
            <>
              Reduces the full coefficient tensor to a fixed-length feature vector per sample.
              Reduction methods: <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>mean</code> (spatial average),{" "}
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>std</code> (spatial standard deviation, captures texture scale),{" "}
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>log_mean</code> (log-space averaging, recommended for scale-spanning data),{" "}
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>ratio</code> (S₂/S₁, for dimensionless comparison).
              Multiple methods can be concatenated by passing a comma-separated list.
            </>
          ),
          inputShape: "coefficient OID + method(s)",
          outputShape: "feature OID · shape (N_samples, D_features)",
        },
        {
          method: "(export)",
          description: (
            <>
              Exports the feature matrix to HDF5 or NumPy. Includes provenance metadata: the
              (dim, group, J, Q, L) configuration, the reduction method, the source OID, and
              a SHA3-256 hash of the engine version used to produce the features. Features
              exported with the same config and engine version are bit-reproducible across
              runs and machines with the same CUDA version.
            </>
          ),
          inputShape: "feature OID + output format",
          outputShape: "features.h5 (or .npy) + provenance.json",
        },
      ]}
      whatYouGet={[
        "features.h5 — feature matrix, shape (N_samples, D_features), with provenance metadata",
        "provenance.json — { dim, group, J, Q, L, reduction, engine_version, source_oid_hash }",
        "feature_oids.txt — SHA3-256 OIDs of intermediate tensors (reusable without recompute)",
        "coefficient_shapes.json — shape and dtype of each intermediate coefficient tensor",
      ]}
      configure={[
        { param: "dim", value: "2", description: "Spatial dimensionality of the input tensor" },
        { param: "group", value: "so2", description: "so2 for 2-D roto-translation; so3 for 3-D rotation; trivial for 1-D" },
        { param: "J", value: "4–8", description: "Scales. GW strain: J=8. Lensing maps: J=6. Density fields: J=4" },
        { param: "Q", value: "1–8", description: "Voices per octave. Q=8 for fine-grained spectral resolution (GW, audio)" },
        { param: "L", value: "8", description: "Orientations (ignored for dim=1 and group=trivial)" },
        { param: "L_max", value: "3", description: "Max spherical-harmonic order ℓ for SO(3). L_max=2 captures most non-Gaussianity" },
        { param: "reduction", value: "log_mean", description: "Feature reduction method" },
        { param: "order", value: "2", description: "Maximum scattering order. order=2 for most applications" },
        { param: "normalise", value: "true", description: "Normalise input to unit variance before scattering" },
        { param: "output_format", value: "hdf5", description: "Output format: hdf5, numpy, or oid_only" },
      ]}
      cli={`# Weak-lensing maps
bun run main.ts process \\
  --input kappa_maps.fits \\
  --recipe feature-extract \\
  --dim 2 --group so2 --J 6 --L 8 \\
  --output results/lensing-features/

# 3-D density field
bun run main.ts process \\
  --input density.h5 --dataset density \\
  --recipe feature-extract \\
  --dim 3 --group so3 --J 4 --L-max 3 \\
  --output results/density-features/

# Gravitational-wave strain
bun run main.ts process \\
  --input strain.h5 --dataset strain \\
  --recipe feature-extract \\
  --dim 1 --group trivial --J 8 --Q 8 \\
  --output results/gw-features/`}
      dashboardNote="The dashboard shows per-scale energy profiles (S₁ per j) and cross-scale correlation
        heatmaps (S₂ as a j₁×j₂ grid) for a sample of the input data. Useful for inspecting
        which scales carry the most discriminating information before running a downstream
        classifier or clustering pipeline. Available in the Pilot release."
      related={[
        { label: "1-D scattering math", href: "/math#s1" },
        { label: "Solid harmonics and SO(3)", href: "/math#s3" },
        { label: "Steerable wavelets — GPU register economy", href: "/math#s5" },
        { label: "HEP Tagging (DisCo)", href: "/recipes/hep-tagging" },
        { label: "BSM Anomaly Detection", href: "/recipes/bsm-anomaly" },
        { label: "Cheng & Ménard — scattering for cosmology", href: "https://arxiv.org/abs/2112.01288", external: true },
        { label: "GitHub", href: "https://github.com/samvardhan03/Vikshep", external: true },
      ]}
    />
  );
}
