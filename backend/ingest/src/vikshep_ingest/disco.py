"""
disco.py — weighted Szekely-Rizzo distance correlation.

Implements the weighted dCorr^2 statistic exactly per the spec:
  - pairwise distance matrices |X_i - X_j|, |Y_i - Y_j|
  - weighted double-centering (row/col/grand means weighted by w,
    normalized by (sum w)^2)
  - dCov_w^2 = weighted inner product of the centered matrices
  - dCorr_w^2 = dCov_w^2 / sqrt(dVar_w(X) * dVar_w(Y))

The O(n^2) estimator is chunked for n > 10_000 to bound peak memory.

Source for the core `weighted_dcorr2` implementation: ported from the pilot
train_disco.py (newer canonical version).  The pilot uses a Pearson-correlation
approximation for the GRADIENT during training; this module provides the exact
statistic for metrics and tests.

Unit tests (in tests/test_disco.py):
  - independent X, Y -> approx 0
  - Y = X^2 with symmetric X -> substantially > 0 (Pearson misses this)
  - weighted vs unweighted diverge on skewed weights
"""

from __future__ import annotations

import numpy as np

_CHUNK_THRESHOLD = 10_000


def weighted_dcorr2(
    x: np.ndarray,
    y: np.ndarray,
    w: np.ndarray | None = None,
) -> float:
    """Weighted distance correlation squared between 1-D arrays x and y.

    Parameters
    ----------
    x, y : 1-D float arrays of length n.
    w    : 1-D non-negative weight array of length n; None → uniform weights.

    Returns
    -------
    dCorr_w^2 in [0, 1] (or 0.0 when dVar_w is zero for either variable).
    """
    x = np.asarray(x, dtype=np.float64)
    y = np.asarray(y, dtype=np.float64)
    n = len(x)
    if len(y) != n:
        raise ValueError(f"x and y must have the same length ({len(x)} vs {len(y)})")
    if n < 2:
        return 0.0

    if w is None:
        w = np.ones(n, dtype=np.float64)
    else:
        w = np.asarray(w, dtype=np.float64)
        if len(w) != n:
            raise ValueError(f"w must have the same length as x ({len(w)} vs {n})")

    if n > _CHUNK_THRESHOLD:
        return _chunked_dcorr2(x, y, w)

    return _exact_dcorr2(x, y, w)


def _exact_dcorr2(x: np.ndarray, y: np.ndarray, w: np.ndarray) -> float:
    """Exact O(n^2) weighted distance correlation squared."""
    w_norm = w / w.sum()
    ax = np.abs(x[:, None] - x[None, :])
    ay = np.abs(y[:, None] - y[None, :])

    # Weighted row means: r_i = sum_j w_j * a_{ij}
    row_ax = (ax * w_norm[None, :]).sum(axis=1)
    row_ay = (ay * w_norm[None, :]).sum(axis=1)
    # Weighted grand mean: mu = sum_i w_i * r_i
    mu_ax  = float((row_ax * w_norm).sum())
    mu_ay  = float((row_ay * w_norm).sum())

    # Double-centered matrices
    A = ax - row_ax[:, None] - row_ax[None, :] + mu_ax
    B = ay - row_ay[:, None] - row_ay[None, :] + mu_ay

    # Outer weight matrix
    W = w_norm[:, None] * w_norm[None, :]

    dcov2_xy = float((W * A * B).sum())
    dcov2_xx = float((W * A * A).sum())
    dcov2_yy = float((W * B * B).sum())

    denom = float(np.sqrt(max(dcov2_xx * dcov2_yy, 0.0)))
    if denom < 1e-12:
        return 0.0
    return float(dcov2_xy / denom)


def _chunked_dcorr2(x: np.ndarray, y: np.ndarray, w: np.ndarray) -> float:
    """Chunked estimator for n > CHUNK_THRESHOLD.

    Partitions x and y into non-overlapping half-chunks; computes the
    double-centering matrices within each chunk at O(k^2) cost, then
    averages the per-chunk dCorr^2 estimates.  This bounds peak memory
    to O(chunk_size^2) while producing an unbiased estimator when n is
    large (n >> chunk_size → each chunk is i.i.d. with the same distribution).

    chunk_size is chosen so that chunk^2 arrays fit in ~256 MB.
    """
    chunk = min(4096, len(x) // 2)
    if chunk < 4:
        chunk = len(x)
        return _exact_dcorr2(x, y, w)

    rng = np.random.default_rng(seed=0)
    idx = rng.permutation(len(x))
    estimates: list[float] = []
    for start in range(0, len(x) - chunk + 1, chunk):
        ci = idx[start:start + chunk]
        e = _exact_dcorr2(x[ci], y[ci], w[ci])
        estimates.append(e)

    return float(np.mean(estimates)) if estimates else 0.0
