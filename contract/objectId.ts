import { z } from "zod";

/** POSIX shm object id: sha3_256(buf)[:14] → 28 lowercase hex. Fits macOS PSHMNAMLEN=31. */
export const OID = z.string().regex(/^[0-9a-f]{28}$/, "oid must be exactly 28 hex chars");
export type Oid = z.infer<typeof OID>;
