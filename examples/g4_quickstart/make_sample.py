"""
make_sample.py — writes sample.csv for the quickstart.

SYNTHETIC DATA, not Geant4 output: a toy three-layer tracker export in the
komal_v1 shape (event_id, layer, phi, theta, momentum, energy) with three
per-event truth columns, built so that the quickstart has real structure to
find:

  is_signal    1 for electron-like events: a compact shower that widens and
               gains hits with depth and deposits most of the incident energy.
               0 for pion-like events: a few hits per layer and little energy,
               except that almost half shower early, so the classes overlap.
  true_energy  incident energy in GeV, uniform in [2, 20].  Deposits scale
               with it, which makes it the calibration target.
  weight       Monte Carlo event weight: 1 for signal, log-normal for
               background, as in a weighted sample.

Pion hit multiplicity grows with true_energy, so a tagger trained without
decorrelation leans on energy-dependent features and its background score
tracks true_energy: the sculpting that the DisCo penalty (--lambda) removes.

    python examples/g4_quickstart/make_sample.py

Deterministic for a given numpy version (seed 7).  NumPy may change its
distribution algorithms between versions, so the committed sample.csv, not
a re-run, is the reference for the golden hashes.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

N_EVENTS = 1000
SEED = 7
LAYERS = (1, 2, 3)
OUT = Path(__file__).with_name("sample.csv")


def _wrap(phi: np.ndarray) -> np.ndarray:
    return (phi + np.pi) % (2 * np.pi) - np.pi


def _electron_like(rng: np.random.Generator, energy: float):
    """Compact shower: hits and width grow with depth, most energy deposited."""
    rows = []
    fractions = (0.25, 0.40, 0.35)
    for layer, frac in zip(LAYERS, fractions):
        n = 2 + rng.poisson(1.5 * layer + 0.15 * energy)
        width = 0.015 + 0.012 * layer
        deposit = 0.8 * energy * frac * rng.normal(1.0, 0.15)
        shares = rng.gamma(2.0, 1.0, size=n)
        shares /= shares.sum()
        for k in range(n):
            rows.append((layer, width, deposit * shares[k], energy * np.exp(-0.5 * (layer - 1)) * rng.uniform(0.6, 1.0)))
    return rows


def _pion_like(rng: np.random.Generator, energy: float):
    """Mostly a minimum-ionising track; almost half shower early (overlap with signal)."""
    if rng.random() < 0.45:
        rows = []
        start = int(rng.integers(1, 3))
        for layer in LAYERS:
            if layer < start:
                n, width, deposit = 1, 0.03, 0.03 * rng.lognormal(0.0, 0.3)
            else:
                n = 1 + rng.poisson(1.0 * layer + 0.12 * energy)
                width = 0.04 + 0.02 * layer
                deposit = 0.45 * energy * rng.uniform(0.3, 0.7)
            shares = rng.gamma(1.5, 1.0, size=n)
            shares /= shares.sum()
            for k in range(n):
                rows.append((layer, width, deposit * shares[k], energy * rng.uniform(0.5, 1.0)))
        return rows
    rows = []
    for layer in LAYERS:
        n = 1 + rng.poisson(0.2 + 0.06 * energy)
        width = 0.03 + 0.015 * layer
        for _ in range(n):
            rows.append((layer, width, 0.03 * rng.lognormal(0.0, 0.35), energy * rng.uniform(0.85, 1.0)))
    return rows


def main() -> None:
    rng = np.random.default_rng(SEED)
    lines = ["event_id,layer,phi,theta,momentum,energy,is_signal,true_energy,weight"]
    for event_id in range(1, N_EVENTS + 1):
        is_signal = int(rng.random() < 0.5)
        energy = float(rng.uniform(2.0, 20.0))
        weight = 1.0 if is_signal else float(rng.lognormal(0.0, 0.5))
        phi0 = rng.uniform(-np.pi, np.pi)
        theta0 = rng.uniform(0.8, 2.3)
        hits = _electron_like(rng, energy) if is_signal else _pion_like(rng, energy)
        for layer, width, deposit, momentum in hits:
            phi = float(_wrap(np.array(phi0 + rng.normal(0.0, width)))[()])
            theta = float(np.clip(theta0 + rng.normal(0.0, width), 0.01, np.pi - 0.01))
            lines.append(
                f"{event_id},{layer},{phi:.6f},{theta:.6f},{momentum:.6f},{deposit:.6f},"
                f"{is_signal},{energy:.6f},{weight:.6f}"
            )
    OUT.write_text("\n".join(lines) + "\n")
    print(f"wrote {OUT} ({N_EVENTS} events, {len(lines) - 1} hits)")


if __name__ == "__main__":
    main()
