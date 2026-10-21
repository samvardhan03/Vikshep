"""
Creates a synthetic 64×64 float32 grid in a named POSIX shared-memory
segment (name = OID) and prints the OID to stdout.

Called by the MCP integration test.  Exits 0 on success, 1 on error.

Usage:
    python scatter_fixture.py [--keep]

--keep: do not unlink the segment on exit (the test process manages cleanup).
"""

import hashlib
import multiprocessing.shared_memory as shm_module
import sys
import time

import numpy as np


def main() -> int:
    keep = "--keep" in sys.argv

    rng = np.random.default_rng(0)
    grid = rng.standard_normal((64, 64)).astype(np.float32)
    buf = grid.tobytes()
    oid = hashlib.sha3_256(buf).digest()[:14].hex()

    try:
        sm = shm_module.SharedMemory(name=oid, create=True, size=len(buf))
    except FileExistsError:
        sm = shm_module.SharedMemory(name=oid, create=False)

    sm.buf[:len(buf)] = buf
    sys.stdout.write(oid + "\n")
    sys.stdout.flush()

    if not keep:
        # Signal file — parent reads oid, then signals us to exit via stdin
        sys.stdin.readline()
        sm.close()
        try:
            sm.unlink()
        except Exception:
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
