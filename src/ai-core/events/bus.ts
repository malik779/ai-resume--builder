import type { AIEvent, EventListener, Unsubscribe } from "./types";

export class EventBus {
  private readonly listeners = new Map<string, Set<EventListener>>();
  private readonly wildcard = new Set<EventListener>();

  on(type: string, listener: EventListener): Unsubscribe {
    if (type === "*") {
      this.wildcard.add(listener);
      return () => this.wildcard.delete(listener);
    }
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener);
    return () => set!.delete(listener);
  }

  emit(event: AIEvent): void {
    const enriched: AIEvent = { timestamp: Date.now(), ...event };
    this.listeners.get(event.type)?.forEach((l) => {
      void l(enriched);
    });
    this.wildcard.forEach((l) => {
      void l(enriched);
    });
  }
}
