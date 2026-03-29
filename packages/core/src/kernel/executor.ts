import type {
  Step,
  EffectStep,
  ConditionStep,
  ExecutionContext,
  EffectRegistry,
} from "../types";
import type { ObserverBus } from "../observer";
import { resolveParams } from "./resolver";
import { evaluateCondition } from "./evaluator";

/**
 * Core execution loop.
 * Executes an array of steps sequentially against a shared context.
 * This is the stable inner kernel — no engine, no event bus, no validation.
 */
export async function executeSteps(
  steps: Step[],
  ctx: ExecutionContext,
  registry: EffectRegistry,
  observers?: ObserverBus,
): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    observers?.notifyStepStart(step, i, ctx);
    try {
      await executeStep(step, ctx, registry, observers);
      observers?.notifyStepEnd(step, i, ctx);
    } catch (err) {
      observers?.notifyError(err, step, ctx);
      throw err;
    }
  }
}

async function executeStep(
  step: Step,
  ctx: ExecutionContext,
  registry: EffectRegistry,
  observers?: ObserverBus,
): Promise<void> {
  if (step.type === "effect") {
    await executeEffect(step, ctx, registry);
  } else {
    await executeCondition(step, ctx, registry, observers);
  }
}

async function executeEffect(
  step: EffectStep,
  ctx: ExecutionContext,
  registry: EffectRegistry,
): Promise<void> {
  const handler = registry.get(step.effect);
  const params = resolveParams(step.params, ctx);
  await handler(ctx, params);
}

async function executeCondition(
  step: ConditionStep,
  ctx: ExecutionContext,
  registry: EffectRegistry,
  observers?: ObserverBus,
): Promise<void> {
  const branch = evaluateCondition(step.if, ctx) ? step.then : step.else;
  if (branch?.length) {
    await executeSteps(branch, ctx, registry, observers);
  }
}
