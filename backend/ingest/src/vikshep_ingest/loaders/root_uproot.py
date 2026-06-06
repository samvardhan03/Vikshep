import uproot
import awkward as ak
import numpy as np


class RootUprootLoader:
    name = "root-uproot"
    extensions = (".root",)

    def can_handle(self, path: str) -> bool:
        return path.endswith(".root")

    def load(
        self,
        path: str,
        *,
        tree: str = "Events",
        cell_e: str = "cell_e",
        cell_eta: str = "cell_eta",
        cell_phi: str = "cell_phi",
        eta_bins: int = 64,
        phi_bins: int = 64,
        eta_range: tuple[float, float] = (-2.5, 2.5),
        **opts,
    ) -> tuple[np.ndarray, dict]:
        t = uproot.open(path)[tree]
        e = ak.to_numpy(ak.flatten(t[cell_e].array()))
        eta = ak.to_numpy(ak.flatten(t[cell_eta].array()))
        phi = ak.to_numpy(ak.flatten(t[cell_phi].array()))  # [-pi, pi], periodic

        ei = np.clip(
            ((eta - eta_range[0]) / (eta_range[1] - eta_range[0]) * eta_bins).astype(int),
            0,
            eta_bins - 1,
        )
        pi = (((phi + np.pi) / (2 * np.pi)) * phi_bins).astype(int) % phi_bins

        img = np.zeros((eta_bins, phi_bins), dtype=np.float32)
        np.add.at(img, (ei, pi), e.astype(np.float32))  # eta zero-pad edges, phi wraps

        return img, {
            "dim": opts.get("dim", 2),
            "group": opts.get("group", "so2"),
            "shape": list(img.shape),
            "pad": [{"axis": "zero"}, {"axis": "circular"}],
        }
