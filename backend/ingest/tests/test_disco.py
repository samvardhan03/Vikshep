"""
Tests for the weighted Szekely-Rizzo distance correlation.

Three required cases per spec:
1. Independent X, Y -> approx 0
2. Y = X^2 with symmetric X -> substantially > 0 (Pearson misses nonlinearity)
3. Weighted vs unweighted diverge on skewed weights
"""

from __future__ import annotations

import numpy as np
import pytest

from vikshep_ingest.disco import weighted_dcorr2


def _rng(seed: int = 42) -> np.random.Generator:
    return np.random.default_rng(seed)


# ---------------------------------------------------------------------------
# Case 1: independent X, Y → approx 0
# ---------------------------------------------------------------------------

def test_independent_variables_approx_zero():
    rng = _rng(0)
    x   = rng.normal(0, 1, 500)
    y   = rng.normal(0, 1, 500)
    dc2 = weighted_dcorr2(x, y)
    assert dc2 < 0.1, f"Expected ~0 for independent, got {dc2:.4f}"


def test_independent_uniform():
    rng = _rng(1)
    x   = rng.uniform(0, 1, 1000)
    y   = rng.uniform(0, 1, 1000)
    dc2 = weighted_dcorr2(x, y)
    assert dc2 < 0.1, f"Expected ~0 for independent uniform, got {dc2:.4f}"


# ---------------------------------------------------------------------------
# Case 2: Y = X^2 with symmetric X → substantially > 0
# (Pearson r^2 ≈ 0 here because it misses nonlinear dependence)
# ---------------------------------------------------------------------------

def test_nonlinear_dependence_detected():
    rng = _rng(2)
    x   = rng.normal(0, 1, 500)
    y   = x ** 2
    dc2 = weighted_dcorr2(x, y)
    assert dc2 > 0.2, f"Expected dCorr^2 > 0.2 for Y=X^2, got {dc2:.4f}"

    # Verify Pearson misses it (as claimed)
    r_pearson = float(np.corrcoef(x, y)[0, 1])
    assert abs(r_pearson) < 0.15, \
        f"Pearson should be ~0 for Y=X^2 with symmetric X, got {r_pearson:.4f}"


def test_perfect_linear_gives_one():
    x   = np.linspace(0, 1, 200)
    y   = 2.0 * x + 0.5
    dc2 = weighted_dcorr2(x, y)
    assert dc2 > 0.95, f"Expected dCorr^2 ≈ 1 for perfect linear, got {dc2:.4f}"


# ---------------------------------------------------------------------------
# Case 3: weighted vs unweighted diverge on skewed weights
# ---------------------------------------------------------------------------

def test_weighted_vs_unweighted_diverge_on_skewed_weights():
    rng   = _rng(3)
    n     = 400
    x_ind = rng.normal(0, 1, n)
    y_ind = rng.normal(0, 1, n)

    # Uniform weights
    w_uniform  = np.ones(n)
    dc2_unw    = weighted_dcorr2(x_ind, y_ind, w_uniform)

    # Skewed weights: put 90% weight on the first 20 points, which have
    # a strong constructed correlation (x=y in that subgroup).
    x_mixed = x_ind.copy()
    y_mixed = y_ind.copy()
    x_mixed[:20] = np.linspace(-2, 2, 20)
    y_mixed[:20] = x_mixed[:20]   # perfectly correlated subgroup

    w_skewed     = np.ones(n) * 0.01
    w_skewed[:20] = 5.0            # dominant weight on correlated subgroup

    dc2_weighted = weighted_dcorr2(x_mixed, y_mixed, w_skewed)
    dc2_unweighted = weighted_dcorr2(x_mixed, y_mixed, np.ones(n))

    # The weighted version should detect more correlation than unweighted
    assert dc2_weighted > dc2_unweighted + 0.05, (
        f"Weighted ({dc2_weighted:.4f}) should exceed unweighted ({dc2_unweighted:.4f}) "
        "on skewed-weight data with a correlated subgroup."
    )


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_identical_arrays_returns_one():
    x = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
    dc2 = weighted_dcorr2(x, x.copy())
    assert dc2 > 0.99


def test_single_element_returns_zero():
    x = np.array([1.0])
    assert weighted_dcorr2(x, x.copy()) == 0.0


def test_mismatched_lengths_raises():
    with pytest.raises(ValueError, match="same length"):
        weighted_dcorr2(np.array([1.0, 2.0]), np.array([1.0]))


def test_weight_normalization_invariant():
    rng = _rng(5)
    x   = rng.normal(0, 1, 100)
    y   = x + rng.normal(0, 0.3, 100)
    w1  = np.ones(100)
    w2  = np.ones(100) * 7.0   # uniform but scaled
    dc2_1 = weighted_dcorr2(x, y, w1)
    dc2_2 = weighted_dcorr2(x, y, w2)
    assert abs(dc2_1 - dc2_2) < 1e-8, \
        f"dCorr^2 should be scale-invariant in weights ({dc2_1} vs {dc2_2})"
