import type { EffectHandler, EffectRegistry } from "./types";

export class DefaultEffectRegistry implements EffectRegistry {
  private handlers = new Map<string, EffectHandler>();

  register(name: string, handler: EffectHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): EffectHandler {
    return this.handlers.get(name) as EffectHandler;
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }
}
