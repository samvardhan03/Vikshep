/**
 * coordinator/jwtVerifier.ts
 * --------------------------
 * Verifies the short-lived job JWT minted by the private app (vikshep-engine/app).
 * Uses jose (Web Crypto) — no Node.js crypto dependency.
 * JOB_JWT_SECRET must match the private app's JOB_JWT_SECRET env var.
 */

import { jwtVerify } from "jose";

export interface VerifiedJobClaims {
  orgId: string;
  jobId: string;
  recipe: string;
  gpuSecondsBudget: number;
}

function getSecret(): Uint8Array {
  const s = process.env.JOB_JWT_SECRET;
  if (!s) throw new Error("JOB_JWT_SECRET is not set in the worker environment");
  return new TextEncoder().encode(s);
}

export async function verifyJobJwt(token: string): Promise<VerifiedJobClaims> {
  const secret = getSecret();

  const { payload } = await jwtVerify(token, secret, {
    audience: "vikshep-worker",
    algorithms: ["HS256"],
  });

  const { sub, job_id, recipe, gpu_seconds_budget } = payload as {
    sub?: string;
    job_id?: string;
    recipe?: string;
    gpu_seconds_budget?: number;
  };

  if (!sub || !job_id || !recipe || typeof gpu_seconds_budget !== "number") {
    throw new Error("JWT is missing required claims: sub, job_id, recipe, gpu_seconds_budget");
  }

  return { orgId: sub, jobId: job_id, recipe, gpuSecondsBudget: gpu_seconds_budget };
}
