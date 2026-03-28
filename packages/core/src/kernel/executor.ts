import type {
  Step,
  EffectStep,
  ConditionStep,
  ExecutionContext,
  EffectRegistry,
} from "../types";
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
): Promise<void> {
  for (const step of steps) {
    await executeStep(step, ctx, registry);
  }
}

async function executeStep(
  step: Step,
  ctx: ExecutionContext,
  registry: EffectRegistry,
): Promise<void> {
  if (step.type === "effect") {
    await executeEffect(step, ctx, registry);
  } else {
    await executeCondition(step, ctx, registry);
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
): Promise<void> {
  const branch = evaluateCondition(step.if, ctx) ? step.then : step.else;
  if (branch?.length) {
    await executeSteps(branch, ctx, registry);
  }
}
