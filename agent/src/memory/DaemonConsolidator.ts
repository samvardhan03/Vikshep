import type { MemoryStore } from "./MemoryStore";

export class DaemonConsolidator {
  constructor(private store: MemoryStore) {}

  async consolidate(): Promise<void> {
    await this.store.sweep();
  }
}
