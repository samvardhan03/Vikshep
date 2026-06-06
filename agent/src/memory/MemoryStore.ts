import type { McpBridge } from "@mcp/McpClient";

export class MemoryStore {
  private map = new Map<string, { oid: string; expiresAt?: number }>();

  constructor(private bridge: McpBridge) {}

  set(key: string, oid: string, ttlMs?: number): void {
    const entry: { oid: string; expiresAt?: number } = { oid };
    if (ttlMs !== undefined) entry.expiresAt = Date.now() + ttlMs;
    this.map.set(key, entry);
  }

  get(key: string): string | undefined {
    return this.map.get(key)?.oid;
  }

  async delete(key: string): Promise<void> {
    const e = this.map.get(key);
    this.map.delete(key);
    if (e?.oid) {
      try {
        await this.bridge.callTool("release", { oid: e.oid });
      } catch {
        // soft failure — release is best-effort until Phase H
      }
    }
  }

  async sweep(): Promise<void> {
    const now = Date.now();
    for (const [k, e] of this.map) {
      if (e.expiresAt !== undefined && e.expiresAt < now) {
        await this.delete(k);
      }
    }
  }
}
