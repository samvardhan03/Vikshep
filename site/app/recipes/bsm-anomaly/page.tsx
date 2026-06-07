import RecipeLayout from "@/components/RecipeLayout";

export const metadata = { title: "BSM Anomaly Detection" };

export default function BsmAnomalyPage() {
  return (
    <RecipeLayout
      number="02"
      title="BSM Anomaly Detection"
      tagline="Template-free new-physics search."
      whenToUse={
        <>
          <p style={{ marginBottom: 14 }}>
            Use this recipe when you are running a model-independent search for new physics. You
            know the Standard Model well — you have large background samples — but you do not know
            what the BSM signal looks like. Every model-specific search you run is a hypothesis you
            had to propose in advance; this recipe finds the hypotheses you did not think of.
          </p>
          <p style={{ marginBottom: 14 }}>
            The approach: embed every event in the scattering feature space, build an HNSW
            vector index over the Standard Model background manifold using Sliced-Wasserstein
            distance as the metric, and flag events that are far from any known SM event. No
            signal model, no retraining, no per-hypothesis tuning. The threshold is calibrated
            from a held-out background sample so the false-positive rate is controlled.
          </p>
          <p>
            Applicable to any event-level observable that can be converted to a scattering
            feature vector: jet substructure, MET + lepton topologies, photon clusters, displaced
            vertices. The same recipe runs at 1-D (time series), 2-D (detector images), and 3-D
            (full event volumetrics) without modification.
          </p>
        </>
      }
      whatItNeeds={{
        description: (
          <>
            <p style={{ marginBottom: 12 }}>
              Any event-level data that can be converted to scattering features. ROOT TTrees,
              HDF5 arrays, or pre-extracted feature vectors are all accepted. The background
              sample must be significantly larger than the signal sample (recommend ≥ 10× ratio).
            </p>
          </>
        ),
        code: `# Option A: ROOT TTree
events.root
  └── tree "Events"
      ├── jet_image      float[64][64]   # or constituent four-vectors
      ├── FullEventWeight float
      └── (no isSignal branch needed — background only for index build)

# Option B: pre-extracted HDF5
background_features.h5
  └── "features"   float32 (N_bkg, D)   # D-dimensional feature vectors
search_features.h5
  └── "features"   float32 (N_search, D)

# Option C: numpy arrays
background.npy   # shape (N_bkg, D)
search.npy       # shape (N_search, D)`,
      }}
      howItWorks={[
        {
          method: "vikshep/ingest",
          description: (
            <>
              Loads background-only events from the data source and writes them to a POSIX
              shared-memory segment. Returns a 28-char OID. For the search phase, the same
              call is used for the events you want to scan — the recipe engine handles the
              distinction between index-build events and query events.
            </>
          ),
          inputShape: "ROOT / HDF5 / numpy file path",
          outputShape: "28-hex OID (shm://...)",
        },
        {
          method: "vikshep/compute_scattering + vikshep/reduce_scattering",
          description: (
            <>
              Computes scattering coefficients for all events and reduces them to a fixed-length
              feature vector. For anomaly detection, the default reduction is{" "}
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>method=&quot;log_mean&quot;</code>{" "}
              rather than ratio, which preserves more information about the overall energy scale
              (since anomalies may be unusual in absolute amplitude, not just shape). The resulting
              feature space is the metric space in which distances are computed.
            </>
          ),
          inputShape: "data OID",
          outputShape: "feature OID · shape (N, D)",
        },
        {
          method: "vikshep/build_hnsw_index",
          description: (
            <>
              Builds an HNSW (Hierarchical Navigable Small World) vector index over the
              background feature vectors using Sliced-Wasserstein distance as the metric.
              SW₁ is chosen because it is a proper metric on the space of probability distributions,
              it is computable in O(N log N) via random projections, and it captures the
              distributional structure of scattering features better than Euclidean distance.
              Index parameters M and efConstruction control the quality/speed tradeoff.
            </>
          ),
          inputShape: "background feature OID · M=16, efConstruction=200",
          outputShape: "HNSW index OID (persisted to disk)",
        },
        {
          method: "vikshep/detect_anomaly",
          description: (
            <>
              For each query event, computes the SW₁ distance to its k nearest neighbours in
              the HNSW index. Events are ranked by exceedance over a calibrated threshold τ.
              The threshold is set so that the false-positive rate on a held-out background
              sample equals the requested quantile (default: 1% FPR at{" "}
              <code style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 12 }}>--threshold-quantile 0.99</code>).
            </>
          ),
          inputShape: "query feature OID + HNSW index OID + τ threshold",
          outputShape: "ranked anomaly list + per-event distances + FPR calibration",
        },
        {
          method: "(export)",
          description: (
            <>
              Writes the ranked event list, per-event distances, the calibrated threshold, and
              the false-positive calibration curve to disk. The HNSW index is persisted as a
              binary file and can be reloaded for future searches without recomputing scattering
              features on the background — the index is reusable across analyses.
            </>
          ),
          inputShape: "anomaly scores OID",
          outputShape: "anomalies.h5 + distances.npy + calibration.json + index.hnsw",
        },
      ]}
      whatYouGet={[
        "anomalies.h5 — ranked event list with per-event SW₁ distance and anomaly score",
        "distances.npy — raw distance array for all query events, shape (N_search,)",
        "calibration.json — { threshold_tau, fpr_curve, n_background, n_flagged }",
        "index.hnsw — persistent HNSW index; reload for future searches at zero recompute cost",
        "feature_oids.txt — SHA3-256 OIDs of background and query feature tensors",
      ]}
      configure={[
        { param: "dim", value: "2", description: "Input dimensionality (change to 1 or 3 for other data types)" },
        { param: "group", value: "so2", description: "Symmetry group for the scattering transform" },
        { param: "J", value: "4", description: "Number of scales" },
        { param: "Q", value: "1", description: "Voices per octave" },
        { param: "L", value: "8", description: "Orientations. Fewer orientations → faster index build" },
        { param: "reduction", value: "log_mean", description: "Feature reduction method. log_mean preserves absolute scale information" },
        { param: "metric", value: "sliced_wasserstein", description: "Distance metric for the HNSW index" },
        { param: "hnsw_M", value: "16", description: "HNSW connectivity parameter. Higher M → better recall, larger index" },
        { param: "hnsw_ef", value: "200", description: "HNSW construction-time search factor. Higher → slower build, better index quality" },
        { param: "threshold_quantile", value: "0.99", description: "FPR target: flag events above this quantile of background distances" },
        { param: "k_neighbors", value: "5", description: "k-NN lookups per query event during anomaly scoring" },
      ]}
      cli={`bun run main.ts process \\
  --input events.root \\
  --recipe bsm-anomaly \\
  --threshold-quantile 0.99 \\
  --background-input background.root \\
  --hnsw-M 16 \\
  --output results/bsm-anomaly/`}
      dashboardNote="The dashboard shows the 2-D UMAP projection of the scattering embedding — background
        events as a dense cloud, flagged events as highlighted outliers. The threshold ring is
        draggable and the flagged set updates live. Available in the Pilot release."
      related={[
        { label: "Anomaly embedding math", href: "/math#s6" },
        { label: "Solid harmonics for 3-D", href: "/math#s3" },
        { label: "HEP Tagging (DisCo)", href: "/recipes/hep-tagging" },
        { label: "General Feature Extraction", href: "/recipes/feature-extract" },
        { label: "Mallat group invariant scattering", href: "https://arxiv.org/abs/1101.2286", external: true },
        { label: "GitHub", href: "https://github.com/samvardhan03/Vikshep", external: true },
      ]}
    />
  );
}
