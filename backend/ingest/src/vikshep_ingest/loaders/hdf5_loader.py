import numpy as np


class Hdf5Loader:
    name = "hdf5"
    extensions = (".h5", ".hdf5", ".hdf", ".npz")

    def can_handle(self, path: str) -> bool:
        return any(path.endswith(ext) for ext in self.extensions)

    def load(self, path: str, *, key: str | None = None, **opts) -> tuple[np.ndarray, dict]:
        if path.endswith(".npz"):
            return self._load_npz(path, key=key, **opts)
        return self._load_hdf5(path, key=key, **opts)

    def _load_npz(self, path: str, *, key: str | None = None, **opts) -> tuple[np.ndarray, dict]:
        data = np.load(path)
        chosen = key if key and key in data else next(iter(data.files))
        arr = np.ascontiguousarray(data[chosen], dtype=np.float32)
        return arr, self._meta(arr, opts)

    def _load_hdf5(self, path: str, *, key: str | None = None, **opts) -> tuple[np.ndarray, dict]:
        import h5py
        with h5py.File(path, "r") as f:
            chosen = key if key and key in f else next(iter(f.keys()))
            arr = np.ascontiguousarray(f[chosen][()], dtype=np.float32)
        return arr, self._meta(arr, opts)

    @staticmethod
    def _meta(arr: np.ndarray, opts: dict) -> dict:
        ndim = arr.ndim
        dim_str = str(min(ndim, 3))
        return {
            "dim": opts.get("dim", dim_str),
            "group": opts.get("group", "trivial"),
            "shape": list(arr.shape),
            "pad": [{"axis": "zero"}] * ndim,
        }
