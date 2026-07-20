"""
cli/_train.py — lightweight training routines used by the recipe CLI.

These are pure-Python/NumPy implementations that run without a GPU.
The weighted dCorr^2 metric comes from vikshep_ingest.disco.
"""

from __future__ import annotations

import numpy as np


def _sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))


def _pearson_dcorr2_grad(
    scores: np.ndarray,
    masses: np.ndarray,
    weights: np.ndarray,
) -> np.ndarray:
    """Fast O(N) Pearson-correlation gradient proxy for the DisCo penalty.

    Used as the training gradient; the exact dCorr^2 is evaluated only at
    the end (via disco.weighted_dcorr2) for reporting.
    """
    w  = weights / (weights.sum() + 1e-12)
    mu_s = float((scores * w).sum())
    mu_m = float((masses * w).sum())
    ds = scores - mu_s
    dm = masses - mu_m
    cov   = float((ds * dm * w).sum())
    var_s = float((ds ** 2 * w).sum()) + 1e-12
    var_m = float((dm ** 2 * w).sum()) + 1e-12
    r     = cov / np.sqrt(var_s * var_m)
    return (2.0 * r * w * (dm / np.sqrt(var_s * var_m) - r * ds / var_s)).astype(np.float64)


def train_tag(
    X: np.ndarray,
    labels: np.ndarray,
    protect: np.ndarray,
    weights: np.ndarray,
    lam: float = 1.0,
    lr: float = 0.05,
    n_iter: int = 400,
) -> dict:
    """Train logistic regression with weighted DisCo penalty.

    Loss: wBCE + lambda * dCorr_w^2(score, protect | background)
    Gradient of the DisCo term uses the Pearson approximation for speed
    (the pilot's approach, adequate for the lambda sweep).
    """
    from vikshep_ingest.disco import weighted_dcorr2

    N, d = X.shape
    w = np.asarray(weights, dtype=np.float64)
    Xd = np.asarray(X, dtype=np.float64)
    y  = np.asarray(labels, dtype=np.float64)
    m  = np.asarray(protect, dtype=np.float64)

    mu  = Xd.mean(axis=0, keepdims=True)
    std = Xd.std(axis=0, keepdims=True) + 1e-8
    Xd  = (Xd - mu) / std
    m_n = (m - m.mean()) / (m.std() + 1e-8)

    theta = np.zeros(d + 1, dtype=np.float64)
    bkg   = y == 0
    w_norm = w / (w.sum() + 1e-12)

    for _ in range(n_iter):
        p   = _sigmoid(Xd @ theta[1:] + theta[0])
        err = p - y

        grad = np.zeros(d + 1, dtype=np.float64)
        grad[0]  = (err * w_norm).sum()
        grad[1:] = (Xd * (err * w_norm)[:, None]).sum(axis=0)

        if lam > 0.0 and bkg.sum() >= 4:
            p_bkg  = p[bkg]
            m_bkg  = m_n[bkg]
            w_bkg  = w[bkg]
            dg_bkg = _pearson_dcorr2_grad(p_bkg, m_bkg, w_bkg)
            dg_full = np.zeros(N, dtype=np.float64)
            dg_full[bkg] = dg_bkg * p_bkg * (1.0 - p_bkg)
            grad[0]  += lam * (dg_full * w_norm).sum()
            grad[1:] += lam * (Xd * (dg_full * w_norm)[:, None]).sum(axis=0)

        theta -= lr * grad

    p_final = _sigmoid(Xd @ theta[1:] + theta[0])

    dc2_final = 0.0
    if bkg.sum() >= 4:
        dc2_final = weighted_dcorr2(p_final[bkg], m[bkg], w[bkg])

    try:
        from sklearn.metrics import roc_auc_score
        auc = float(roc_auc_score(y.astype(int), p_final))
    except Exception:
        auc = float("nan")

    return {
        "theta":        theta,
        "mu":           mu,
        "std":          std,
        "auc":          auc,
        "dcorr2_final": dc2_final,
        "predict":      lambda Xnew: _sigmoid(
            ((np.asarray(Xnew, dtype=np.float64) - mu) / std)
            @ theta[1:] + theta[0]
        ).astype(np.float32),
    }


def train_calibrate(
    X: np.ndarray,
    target: np.ndarray,
    n_iter: int = 500,
    lr: float = 0.01,
) -> dict:
    """Least-squares regression for detector calibration.

    Returns r2_score, residual_std, and a predict callable.
    """
    Xd = np.asarray(X, dtype=np.float64)
    t  = np.asarray(target, dtype=np.float64)
    N, d = Xd.shape

    mu  = Xd.mean(axis=0, keepdims=True)
    std = Xd.std(axis=0, keepdims=True) + 1e-8
    Xd  = (Xd - mu) / std

    # Closed-form ridge regression (lambda=1e-4 for stability)
    reg = 1e-4
    A   = Xd.T @ Xd + reg * np.eye(d)
    b   = Xd.T @ t
    try:
        w = np.linalg.solve(A, b)
    except np.linalg.LinAlgError:
        w = np.zeros(d)

    bias   = t.mean() - (Xd @ w).mean()
    pred   = Xd @ w + bias
    resid  = t - pred
    ss_res = float((resid ** 2).sum())
    ss_tot = float(((t - t.mean()) ** 2).sum()) + 1e-12
    r2     = 1.0 - ss_res / ss_tot
    res_std = float(np.std(resid))

    return {
        "w":           w,
        "bias":        bias,
        "mu":          mu,
        "std":         std,
        "r2_score":    r2,
        "residual_std": res_std,
        "predict":     lambda Xnew: (
            ((np.asarray(Xnew, dtype=np.float64) - mu) / std) @ w + bias
        ).astype(np.float32),
    }
