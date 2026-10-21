/**
 * Agent integration test: spawns vikshep-mcp and runs a scattering request.
 *
 * Prerequisites (set in CI via the python-scattering job):
 *   VIKSHEP_MCP_BIN=/path/to/vikshep-mcp
 *
 * Skipped when VIKSHEP_MCP_BIN is unset and vikshep-mcp is not on PATH.
 * The fixture helper (tests/fixtures/scatter_fixture.py) writes a 64×64
 * float32 grid into a named POSIX shm segment and prints its OID, then
 * waits for stdin close before unlinking.
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawn, type Subprocess } from "bun";
import { McpBridge } from "../src/mcp/McpClient";

// ── Availability check ────────────────────────────────────────────────────────

function which(cmd: string): string | null {
  try {
    const r = Bun.spawnSync(["which", cmd], { stdout: "pipe", stderr: "pipe" });
    const out = new TextDecoder().decode(r.stdout).trim();
    return out || null;
  } catch {
    return null;
  }
}

const MCP_BIN =
  process.env.VIKSHEP_MCP_BIN ||
  which("vikshep-mcp");

const SKIP = MCP_BIN === null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOid(s: unknown): boolean {
  return typeof s === "string" && /^[0-9a-f]{28}$/.test(s);
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe("vikshep-mcp integration", () => {
  let bridge: McpBridge;
  let fixture: Subprocess<"pipe", "pipe", "pipe"> | null = null;
  let fixtureOid = "";

  beforeAll(async () => {
    if (SKIP) return;

    // Spawn the fixture helper: writes a 64×64 grid to shm, prints OID
    const fixtureDir = new URL("./fixtures", import.meta.url).pathname;
    fixture = spawn(
      ["python3", `${fixtureDir}/scatter_fixture.py`],
      { stdin: "pipe", stdout: "pipe", stderr: "pipe" },
    );
    const reader = fixture.stdout.getReader();
    const { value } = await reader.read();
    fixtureOid = new TextDecoder().decode(value).trim();
    reader.releaseLock();
    if (!isOid(fixtureOid)) {
      throw new Error(`scatter_fixture.py returned bad OID: ${fixtureOid}`);
    }

    // Connect McpBridge to vikshep-mcp
    bridge = new McpBridge({
      pythonCommand: MCP_BIN!,
      serverArgs: [],
    });
    await bridge.connect();
  });

  afterAll(async () => {
    if (bridge?.connected) {
      await bridge.disconnect();
    }
    if (fixture) {
      // Signal fixture to unlink shm and exit
      try {
        fixture.stdin.getWriter().write(new TextEncoder().encode("\n"));
      } catch {
        // best-effort
      }
      fixture.kill();
    }
  });

  test("vikshep-mcp exposes compute_scattering tool", async () => {
    if (SKIP) {
      console.log("skip: vikshep-mcp not found (set VIKSHEP_MCP_BIN)");
      return;
    }
    const tools = await bridge.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain("compute_scattering");
  });

  test("compute_scattering on 64×64 fixture returns OID response", async () => {
    if (SKIP) return;

    const result = await bridge.callTool("compute_scattering", {
      input_oid: fixtureOid,
      signal_len: 64 * 64,
      cfg: {
        J: 3,
        Q: 1,
        L: 8,
        dim: "2",
        dim_shape: [64, 64],
        group: "trivial",
      },
    });

    expect(result.isError).toBe(false);
    const body = JSON.parse(result.content) as Record<string, unknown>;
    expect(isOid(body["output_oid"] ?? body["oid"])).toBe(true);
    expect(typeof body["numerics_version"]).toBe("number");
  });
});
