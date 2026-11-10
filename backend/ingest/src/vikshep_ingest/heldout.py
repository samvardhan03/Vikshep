"""
heldout.py — held-out evaluation for the recipes and the benchmark harness.

A model scored on the events it was fitted on reports how well it memorised
them, not how well it works: with 217 scattering features, a ridge fit to pure
noise reaches R^2 1.0 on 120 events and 0.23 on 1000.  Every metric the
recipes label ``*_heldout`` therefore comes from k-fold cross-validation:

  1. Split the events into ``folds`` folds (below).
  2. For each fold, fit on the other folds and predict the fold.  Every event
     then has an out-of-fold prediction from a model that never saw it.
  3. Compute the metric on the pooled out-of-fold predictions.  Per-fold values
     are reported too, so the spread is visible.

The feature extraction (wavelet scattering, per-event aggregates) is a fixed
per-event transform with no fitted parameters, so computing it once for all
events leaks nothing; the standardization and the model are fitted inside each
training fold.

Fold assignment, scheme ``vikshep.kfold/1``
-------------------------------------------
For event index ``i`` (0-based, manifest order) and seed ``s`` (0 <= s < 2^64):

    key_i = SHA3-256(b"vikshep.kfold/1" || s as u64 LE || i as u64 LE)

Events are ordered by ``key_i`` (bytes, ascending).  With strata (the label,
for tagging), the strata are taken in ascending order of their value and the
r-th event of a stratum, in key order, goes to fold ``(offset + r) mod folds``,
where ``offset`` counts the events of the strata before it; without strata
there is one stratum.  No numpy random generator is involved, so the folds are
the same on every platform and numpy version.

Determinism: the core fits (``vc.calibrate``, ``vc.train_tag``) are
bit-identical across platforms; ``ridge_predict`` reproduces the core's
calibration predictions bit for bit (VDS-1 section 18: elementwise
standardization, then a sequential dot product); sums in the metrics use
``math.fsum`` (exactly rounded).  Same inputs and seed give the same report
bytes.
"""

from __future__ import annotations

import hashlib
import math
from collections.abc import Callable

import numpy as np

SPLIT_SCHEME = "vikshep.kfold/1"
DEFAULT_FOLDS = 5
DEFAULT_SEED = 42
# Rule of thumb for a linear model: at least this many training events per
# feature before training metrics mean much.
MIN_EVENTS_PER_FEATURE = 10


# ── Folds ─────────────────────────────────────────────────────────────────────

def fold_assignment(
    n: int,
    folds: int,
    seed: int,
    strata: np.ndarray | None = None,
) -> np.ndarray:
    """Fold index (0 .. folds-1) of each of ``n`` events, scheme vikshep.kfold/1."""
    if folds < 2:
        raise ValueError(f"folds must be at least 2, got {folds}")
    if n < 2 * folds:
        raise ValueError(f"{folds}-fold evaluation needs at least {2 * folds} events, got {n}")
    if not 0 <= seed < 2**64:
        raise ValueError(f"seed must be in [0, 2^64), got {seed}")
    prefix = SPLIT_SCHEME.encode() + seed.to_bytes(8, "little")
    keys = [hashlib.sha3_256(prefix + i.to_bytes(8, "little")).digest() for i in range(n)]
    order = sorted(range(n), key=keys.__getitem__)

    if strata is None:
        groups = [order]
    else:
        strata = np.asarray(strata)
        if strata.shape != (n,):
            raise ValueError("strata must have one value per event")
        groups = [[i for i in order if strata[i] == v] for v in np.unique(strata)]

    fold = np.empty(n, dtype=np.int64)
    offset = 0
    for group in groups:
        for r, i in enumerate(group):
            fold[i] = (offset + r) % folds
        offset += len(group)
    return fold


# ── Deterministic metrics ─────────────────────────────────────────────────────

def ridge_predict(fit: dict, X: np.ndarray) -> np.ndarray:
    """Predictions of a ``vc.calibrate`` fit for raw feature rows ``X``.

    Same arithmetic as the core's ``Calibration::predict`` (VDS-1 section 18):
    ``x'_j = (x_j - mu_j) / std_j`` per element, then ``acc = acc + x'_j * coef_j``
    for j ascending from ``acc = 0``, then ``+ bias``.  Each step is one IEEE
    operation, so the result is bit-identical to the core.
    """
    mu = np.asarray(fit["mu"], dtype=np.float64)
    std = np.asarray(fit["std"], dtype=np.float64)
    coef = np.asarray(fit["coef"], dtype=np.float64)
    xs = (np.asarray(X, dtype=np.float64) - mu) / std
    acc = np.zeros(xs.shape[0], dtype=np.float64)
    for j in range(coef.shape[0]):
        acc = acc + xs[:, j] * coef[j]
    return acc + float(fit["bias"])


def regression_metrics(t: np.ndarray, pred: np.ndarray) -> tuple[float, float]:
    """``(r2, residual_std)`` as the core defines them (VDS-1 section 18):
    ``r2 = 1 - ss_res / (ss_tot + 1e-12)``, residual std = population standard
    deviation of ``t - pred``.  Sums are exactly rounded (``math.fsum``)."""
    t = np.asarray(t, dtype=np.float64)
    res = t - np.asarray(pred, dtype=np.float64)
    n = t.shape[0]
    mean_t = math.fsum(t.tolist()) / n
    ss_tot = math.fsum(((t - mean_t) ** 2).tolist()) + 1e-12
    ss_res = math.fsum((res * res).tolist())
    mean_r = math.fsum(res.tolist()) / n
    res_std = math.sqrt(math.fsum(((res - mean_r) ** 2).tolist()) / n)
    return 1.0 - ss_res / ss_tot, res_std


def auc(labels01: np.ndarray, scores: np.ndarray) -> float | None:
    """ROC AUC (unweighted); None when only one class is present."""
    y = np.asarray(labels01).astype(int)
    if y.min() == y.max():
        return None
    from sklearn.metrics import roc_auc_score
    return float(roc_auc_score(y, np.asarray(scores, dtype=np.float64)))


def size_warnings(n_train: int, n_features: int) -> list[str]:
    """Warnings when the training folds are not well above the feature count."""
    if n_train <= n_features:
        return [
            f"{n_train} training events per fold for {n_features} features: a linear "
            f"model can fit the training events exactly, so training metrics mean "
            f"nothing here (R^2 and AUC approach 1 even on noise). The held-out "
            f"metrics are the only meaningful ones, and with so few events they are "
            f"noisy. Use more events or fewer features (--feature-set aggregates)."
        ]
    if n_train < MIN_EVENTS_PER_FEATURE * n_features:
        return [
            f"{n_train} training events per fold for {n_features} features (fewer "
            f"than {MIN_EVENTS_PER_FEATURE} per feature): training metrics overstate "
            f"performance; rely on the held-out metrics."
        ]
    return []


# ── Backends ──────────────────────────────────────────────────────────────────
# A calibration backend is (fit(X, t) -> model, predict(model, X) -> pred).
# A tag backend is (fit(X, y01, m, w) -> predict(X) -> scores, dcorr2(s, m, w)).

def _core_calibration() -> tuple[Callable, Callable]:
    import vikshep_compute as vc

    def fit(X, t):
        return vc.calibrate(np.asarray(X, dtype=np.float64), np.asarray(t, dtype=np.float64))

    return fit, ridge_predict


def _python_calibration() -> tuple[Callable, Callable]:
    from vikshep_ingest.cli._train import train_calibrate

    def fit(X, t):
        return train_calibrate(np.asarray(X, dtype=np.float32), np.asarray(t, dtype=np.float64))

    def predict(model, X):
        return np.asarray(model["predict"](X), dtype=np.float64)

    return fit, predict


def _core_tag(lam: float, seed: int) -> tuple[Callable, Callable]:
    import vikshep_compute as vc

    def fit(X, y01, m, w):
        model = vc.train_tag(
            np.asarray(X, dtype=np.float64),
            np.asarray(y01, dtype=np.float64),
            w=np.asarray(w, dtype=np.float64),
            m=np.asarray(m, dtype=np.float64),
            lam=lam,
            gradient="exact",
            seed=seed,
        )
        return lambda Xn: np.asarray(model.predict(np.asarray(Xn, dtype=np.float64)), dtype=np.float64)

    def dcorr2(s, m, w):
        return float(vc.dcorr2_w(
            np.asarray(s, dtype=np.float64),
            np.asarray(m, dtype=np.float64),
            np.asarray(w, dtype=np.float64),
        ))

    return fit, dcorr2


def _python_tag(lam: float) -> tuple[Callable, Callable]:
    from vikshep_ingest.cli._train import train_tag
    from vikshep_ingest.disco import weighted_dcorr2

    def fit(X, y01, m, w):
        model = train_tag(
            np.asarray(X, dtype=np.float32),
            np.asarray(y01, dtype=np.float32),
            np.asarray(m, dtype=np.float64),
            np.asarray(w, dtype=np.float32),
            lam=lam,
        )
        return lambda Xn: np.asarray(model["predict"](Xn), dtype=np.float64)

    return fit, weighted_dcorr2


# ── Cross-validated recipes ───────────────────────────────────────────────────

def calibrate(
    X: np.ndarray,
    t: np.ndarray,
    *,
    backend: str = "core",
    folds: int = DEFAULT_FOLDS,
    seed: int = DEFAULT_SEED,
) -> dict:
    """Ridge calibration of ``t`` on ``X``, evaluated by k-fold cross-validation.

    Returns ``heldout`` (``r2``, ``residual_std``, ``predictions`` out of fold,
    ``folds``: per-fold ``n_train``, ``n_test``, ``r2``, ``residual_std``),
    ``train`` (the same fit on all events, scored on them) and ``n_train_min``.
    ``backend``: ``"core"`` (vikshep_compute) or ``"python"`` (NumPy fallback).
    """
    fit, predict = _core_calibration() if backend == "core" else _python_calibration()
    t = np.asarray(t, dtype=np.float64)
    n = t.shape[0]
    fold = fold_assignment(n, folds, seed)

    oof = np.empty(n, dtype=np.float64)
    per_fold = []
    for f in range(folds):
        tr, te = fold != f, fold == f
        oof[te] = predict(fit(X[tr], t[tr]), X[te])
        r2_f, std_f = regression_metrics(t[te], oof[te])
        per_fold.append({"fold": f, "n_train": int(tr.sum()), "n_test": int(te.sum()),
                         "r2": r2_f, "residual_std": std_f})
    r2_h, std_h = regression_metrics(t, oof)

    full = fit(X, t)
    r2_t, std_t = regression_metrics(t, predict(full, X))

    return {
        "heldout": {"r2": r2_h, "residual_std": std_h, "predictions": oof, "folds": per_fold},
        "train": {"r2": r2_t, "residual_std": std_t},
        "n_train_min": min(p["n_train"] for p in per_fold),
    }


def tag(
    X: np.ndarray,
    labels: np.ndarray,
    protect: np.ndarray,
    weights: np.ndarray,
    *,
    lam: float,
    backend: str = "core",
    folds: int = DEFAULT_FOLDS,
    seed: int = DEFAULT_SEED,
) -> dict:
    """DisCo tagger, evaluated by k-fold cross-validation stratified by label.

    Labels are binarized (nonzero = signal).  AUC is unweighted; dCorr^2 is the
    exact weighted dCorr^2 of the background scores with ``protect`` (None when
    fewer than 4 background events).  Returns ``heldout`` (``auc``, ``dcorr2``,
    ``scores`` out of fold, ``folds``), ``train`` (the model fit on all events,
    scored on them) and ``n_train_min``.
    """
    fit, dcorr2 = _core_tag(lam, seed) if backend == "core" else _python_tag(lam)
    y01 = (np.asarray(labels) != 0).astype(np.float64)
    m = np.asarray(protect, dtype=np.float64)
    w = np.asarray(weights, dtype=np.float64)
    n = y01.shape[0]
    n_sig = int(y01.sum())
    if n_sig < 2 or n - n_sig < 2:
        raise ValueError(f"tag needs at least 2 signal and 2 background events, got {n_sig} and {n - n_sig}")
    fold = fold_assignment(n, folds, seed, strata=y01)
    bkg = y01 == 0

    def metrics(mask, s):
        b = mask & bkg
        dc2 = dcorr2(s[b], m[b], w[b]) if b.sum() >= 4 else None
        return auc(y01[mask], s[mask]), dc2

    oof = np.empty(n, dtype=np.float64)
    per_fold = []
    for f in range(folds):
        tr, te = fold != f, fold == f
        oof[te] = fit(X[tr], y01[tr], m[tr], w[tr])(X[te])
        auc_f, dc2_f = metrics(te, oof)
        per_fold.append({"fold": f, "n_train": int(tr.sum()), "n_test": int(te.sum()),
                         "auc": auc_f, "dcorr2": dc2_f})
    everyone = np.ones(n, dtype=bool)
    auc_h, dc2_h = metrics(everyone, oof)

    s_train = fit(X, y01, m, w)(X)
    auc_t, dc2_t = metrics(everyone, s_train)

    return {
        "heldout": {"auc": auc_h, "dcorr2": dc2_h, "scores": oof, "folds": per_fold},
        "train": {"auc": auc_t, "dcorr2": dc2_t, "scores": s_train},
        "n_train_min": min(p["n_train"] for p in per_fold),
    }


def evaluation_record(folds: int, seed: int, per_fold: list[dict], stratified_by: str | None) -> dict:
    """The ``evaluation`` block of a report: how the held-out metrics were made."""
    return {
        "method": "k-fold cross-validation; metrics on pooled out-of-fold predictions",
        "split": SPLIT_SCHEME,
        "folds": folds,
        "seed": seed,
        "stratified_by": stratified_by,
        "per_fold": per_fold,
    }
