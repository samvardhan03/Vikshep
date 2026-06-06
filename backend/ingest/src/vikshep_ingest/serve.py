from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np

from shared_memory_manager import SharedMemoryManager
from .registry import select

app = FastAPI(title="vikshep-ingest")
_shm = SharedMemoryManager()


class IngestRequest(BaseModel):
    path: str
    opts: dict = {}


class IngestResponse(BaseModel):
    oid: str
    signal_len: int
    dim: str | int
    group: str
    shape: list[int]
    pad: list[dict]


@app.post("/ingest", response_model=IngestResponse)
def ingest_endpoint(req: IngestRequest) -> IngestResponse:
    try:
        loader = select(req.path)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    arr, meta = loader.load(req.path, **req.opts)
    arr = np.ascontiguousarray(arr, dtype=np.float32)
    oid = _shm.ingest_media_tensor(arr)  # 28-hex
    return IngestResponse(
        oid=oid,
        signal_len=int(arr.size),
        dim=meta.get("dim", "1"),
        group=meta.get("group", "trivial"),
        shape=meta.get("shape", list(arr.shape)),
        pad=meta.get("pad", []),
    )


def ingest(path: str, **opts) -> dict:
    arr, meta = select(path).load(path, **opts)
    arr = np.ascontiguousarray(arr, dtype=np.float32)
    oid = _shm.ingest_media_tensor(arr)  # 28-hex
    return {"oid": oid, "signal_len": int(arr.size), **meta}
