export class EventBus<T extends Record<string, any>> {
  private listeners = new Map<keyof T, Set<(payload: any) => void>>();

  on<K extends keyof T>(event: K, handler: (payload: T[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off<K extends keyof T>(event: K, handler: (payload: T[K]) => void): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit<K extends keyof T>(event: K, payload: T[K]): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(payload);
      }
    }
  }

  once<K extends keyof T>(event: K, handler: (payload: T[K]) => void): () => void {
    const wrappedHandler = (payload: T[K]) => {
      this.off(event, wrappedHandler);
      handler(payload);
    };
    return this.on(event, wrappedHandler);
  }

  clear(): void {
    this.listeners.clear();
  }
}
