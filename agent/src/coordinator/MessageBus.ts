type Handler = (payload: unknown) => void;

export class MessageBus {
  private listeners = new Map<string, Handler[]>();

  on(event: string, handler: Handler): void {
    const existing = this.listeners.get(event) ?? [];
    this.listeners.set(event, [...existing, handler]);
  }

  emit(event: string, payload: unknown): void {
    for (const handler of this.listeners.get(event) ?? []) {
      handler(payload);
    }
  }
}
