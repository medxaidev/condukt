import type { Flow, EffectStep, ConditionStep, Step } from "../types";
import type {
  DSLFlow,
  DSLStep,
  DSLLeafStep,
  DSLConditionStep,
} from "./dsl-types";

// ─── Type Guards ──────────────────────────────────────────────────────────────

function isActionStep(
  step: DSLLeafStep,
): step is { action: string; params?: Record<string, unknown> } {
  return "action" in step;
}

function isConditionStep(step: DSLStep): step is DSLConditionStep {
  return "if" in step;
}

// ─── Leaf Step ────────────────────────────────────────────────────────────────

function normalizeLeafStep(step: DSLLeafStep): EffectStep {
  const effect = isActionStep(step) ? step.action : step.effect;
  const out: EffectStep = { type: "effect", effect };
  if (step.params !== undefined) out.params = step.params;
  return out;
}

// ─── Condition Step ───────────────────────────────────────────────────────────

function normalizeConditionStep(step: DSLConditionStep): ConditionStep {
  const out: ConditionStep = {
    type: "condition",
    if: step.if,
    then: step.then.map(normalizeLeafStep),
  };
  if (step.else !== undefined) {
    out.else = step.else.map(normalizeLeafStep);
  }
  return out;
}

// ─── Step ─────────────────────────────────────────────────────────────────────

function normalizeStep(step: DSLStep): Step {
  if (isConditionStep(step)) return normalizeConditionStep(step);
  return normalizeLeafStep(step as DSLLeafStep);
}

// ─── Flow ─────────────────────────────────────────────────────────────────────

export function normalizeFlow(dsl: DSLFlow): Flow {
  const trigger = dsl.trigger ?? dsl.on;
  if (!trigger) {
    throw new Error(
      "normalizeFlow: DSL flow must have a 'trigger' or 'on' field",
    );
  }
  return {
    id: dsl.id,
    trigger,
    steps: dsl.steps.map(normalizeStep),
  };
}
