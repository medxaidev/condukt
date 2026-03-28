import type { Flow, EffectHandler, ExecutionContext } from "./types";
import { DefaultEffectRegistry } from "./registry";
import { executeSteps } from "./kernel/executor";
import { normalizeFlow } from "./normalizer/normalize";
import type { DSLFlow } from "./normalizer/dsl-types";

export class ConduktEngine {
  protected registry = new DefaultEffectRegistry();
  protected flows = new Map<string, Flow>();

  // FlowRegistry concern: one flow per trigger (last-write-wins)
  registerFlow(dsl: DSLFlow): void {
    const flow = normalizeFlow(dsl);
    this.flows.set(flow.trigger, flow);
  }

  // EffectRegistry concern: delegates to DefaultEffectRegistry
  registerEffect(name: string, handler: EffectHandler): void {
    this.registry.register(name, handler);
  }

  // EventDispatcher concern: maps event → flow, creates context, drives execution
  async dispatch(event: string, payload?: unknown): Promise<void> {
    const flow = this.flows.get(event);
    if (!flow) return;

    const ctx: ExecutionContext = {
      event: payload ?? {},
      state: {}, // execution-scoped scratchpad; not application state
      dispatch: (e, p) => this.dispatch(e, p),
    };

    await executeSteps(flow.steps, ctx, this.registry);
  }
}
