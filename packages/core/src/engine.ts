import type { Flow, EffectHandler, ExecutionContext } from "./types";
import { DefaultEffectRegistry } from "./registry";
import { executeSteps } from "./kernel/executor";
import { validateFlow, type ValidationResult } from "./validator";
import { ObserverBus, type Observer } from "./observer";
import { normalizeFlow } from "./normalizer/normalize";
import type { DSLFlow } from "./normalizer/dsl-types";

export class ConduktEngine {
  protected registry = new DefaultEffectRegistry();
  protected flows = new Map<string, Flow>();
  protected observers = new ObserverBus();

  registerFlow(dsl: DSLFlow): void {
    const flow = normalizeFlow(dsl);
    const result: ValidationResult = validateFlow(flow, this.registry);
    if (!result.valid) {
      throw new Error(
        `Flow "${flow.trigger}" failed validation:\n` +
        result.errors.map((e) => `  [${e.code}] ${e.message}`).join("\n"),
      );
    }
    this.flows.set(flow.trigger, flow);
  }

  registerEffect(name: string, handler: EffectHandler): void {
    this.registry.register(name, handler);
  }

  addObserver(observer: Observer): void {
    this.observers.add(observer);
  }

  async dispatch(event: string, payload?: unknown): Promise<void> {
    const flow = this.flows.get(event);
    if (!flow) return;

    const ctx: ExecutionContext = {
      event: payload ?? {},
      state: {},
      dispatch: (e, p) => this.dispatch(e, p),
    };

    this.observers.notifyFlowStart(flow, ctx);
    await executeSteps(flow.steps, ctx, this.registry, this.observers);
    this.observers.notifyFlowEnd(flow, ctx);
  }
}
