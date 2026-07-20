"""
well/invariants.py — rank reduction to scalar channels.

Converts Well t1/t2 vector and tensor fields to rotation-invariant scalar
channels before the scattering engine.  Components-as-channels is FORBIDDEN
by default (breaks SO(3) exactness) and is only allowed behind an explicit
`--covariance-unsafe` flag (proposed, not yet implemented as a CLI flag).

t0 fields: passthrough (already scalar).
t1 fields: |v|, divergence, vorticity magnitude, kinetic-energy density;
           magnetic invariants when field names suggest B.
t2 fields: trace, Frobenius norm, determinant; honor symmetric/antisymmetric.

All outputs are float32 numpy arrays; each gets a physical name in the manifest.
"""

from __future__ import annotations

import numpy as np


def reduce_t0(field: np.ndarray, name: str) -> list[tuple[str, np.ndarray]]:
    """t0 fields are scalar — passthrough."""
    return [(name, field.astype(np.float32))]


def reduce_t1(
    field: np.ndarray,
    name: str,
    attrs: dict,
    covariance_unsafe: bool = False,
) -> list[tuple[str, np.ndarray]]:
    """Reduce a t1 (vector) field to scalar invariants.

    Parameters
    ----------
    field : float array of shape (..., n_components).
    name  : field name (used to detect magnetic fields: 'B', 'mag_*', '*_B').
    attrs : field attribute dict from the Well HDF5.
    covariance_unsafe : if True, also return individual components (breaks SO(3)).

    Returns
    -------
    List of (channel_name, float32_array) pairs with the trailing component
    dimension collapsed to a scalar.
    """
    out: list[tuple[str, np.ndarray]] = []

    # |v| — magnitude (L2 norm over component axis)
    mag = np.linalg.norm(field, axis=-1).astype(np.float32)
    out.append((f"{name}_magnitude", mag))

    # Kinetic-energy density: 0.5 * |v|^2 (dimensionless but physically meaningful)
    out.append((f"{name}_ke_density", (0.5 * mag ** 2).astype(np.float32)))

    n_components = field.shape[-1]
    spatial_shape = field.shape[:-1]
    n_spatial = len(spatial_shape)

    # Divergence (central finite differences; requires >=2 spatial dims)
    if n_spatial >= 1 and n_components <= n_spatial:
        try:
            div = np.zeros(spatial_shape, dtype=np.float32)
            for c in range(min(n_components, n_spatial)):
                div += np.gradient(field[..., c], axis=c).astype(np.float32)
            out.append((f"{name}_divergence", div))
        except Exception:
            pass

    # Vorticity magnitude (requires 2-D or 3-D vector field)
    if n_spatial == 2 and n_components == 2:
        try:
            dvx_dy = np.gradient(field[..., 0], axis=1).astype(np.float32)
            dvy_dx = np.gradient(field[..., 1], axis=0).astype(np.float32)
            vorticity = np.abs(dvx_dy - dvy_dx)
            out.append((f"{name}_vorticity_mag", vorticity))
        except Exception:
            pass
    elif n_spatial == 3 and n_components == 3:
        try:
            # curl = (dFz/dy - dFy/dz, dFx/dz - dFz/dx, dFy/dx - dFx/dy)
            curlx = (np.gradient(field[..., 2], axis=1)
                     - np.gradient(field[..., 1], axis=2)).astype(np.float32)
            curly = (np.gradient(field[..., 0], axis=2)
                     - np.gradient(field[..., 2], axis=0)).astype(np.float32)
            curlz = (np.gradient(field[..., 1], axis=0)
                     - np.gradient(field[..., 0], axis=1)).astype(np.float32)
            vort_mag = np.sqrt(curlx**2 + curly**2 + curlz**2)
            out.append((f"{name}_vorticity_mag", vort_mag))
        except Exception:
            pass

    # Magnetic invariants when field name suggests a magnetic field
    is_mag = any(tok in name.lower() for tok in ("_b", "mag", "magnetic", "bfield"))
    if is_mag:
        out.append((f"{name}_mag_energy_density", (0.5 * mag ** 2).astype(np.float32)))

    return out


def reduce_t2(
    field: np.ndarray,
    name: str,
    attrs: dict,
    covariance_unsafe: bool = False,
) -> list[tuple[str, np.ndarray]]:
    """Reduce a t2 (rank-2 tensor) field to scalar invariants.

    Parameters
    ----------
    field : float array of shape (..., n, m).
    attrs : field attribute dict; checked for 'symmetric' and 'antisymmetric'.
    """
    out: list[tuple[str, np.ndarray]] = []
    is_sym  = bool(attrs.get("symmetric",    False))
    is_anti = bool(attrs.get("antisymmetric", False))

    n, m = field.shape[-2], field.shape[-1]

    # Trace (only for square tensors)
    if n == m:
        try:
            # np.trace operates on the last two axes
            tr = np.trace(field, axis1=-2, axis2=-1).astype(np.float32)
            out.append((f"{name}_trace", tr))
        except Exception:
            pass

    # Frobenius norm
    try:
        frob = np.linalg.norm(field, ord="fro", axis=(-2, -1)).astype(np.float32)
        out.append((f"{name}_frobenius", frob))
    except Exception:
        pass

    # Determinant (square tensors, ≤4x4 for numerical stability)
    if n == m and n <= 4:
        try:
            det = np.linalg.det(field).astype(np.float32)
            out.append((f"{name}_determinant", det))
        except Exception:
            pass

    return out


def reduce_field(
    field: np.ndarray,
    name: str,
    rank: int,
    attrs: dict,
    covariance_unsafe: bool = False,
) -> list[tuple[str, np.ndarray]]:
    """Dispatch to the appropriate rank-reduction function."""
    if rank == 0:
        return reduce_t0(field, name)
    elif rank == 1:
        return reduce_t1(field, name, attrs, covariance_unsafe)
    elif rank == 2:
        return reduce_t2(field, name, attrs, covariance_unsafe)
    else:
        raise ValueError(f"Unsupported tensor rank {rank} for field '{name}'.")
