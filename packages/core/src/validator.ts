import type { Flow, Step, EffectRegistry } from "./types";

export const MAX_STEPS = 10;

// MAX_CONDITION_DEPTH is a defence-in-depth guard.
// The primary rule is enforced by TypeScript: DSLConditionStep.then/else is
// typed as DSLLeafStep[] (no ConditionStep allowed), making nested conditions
// a compile-time error. This runtime check handles flows constructed outside
// the type system (e.g. plain JS, deserialized JSON, or tests via `as` casts).
export const MAX_CONDITION_DEPTH = 1;

export type ValidationError = {
  code: string;
  message: string;
};

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: ValidationError[] };

export function validateFlow(
  flow: Flow,
  registry?: EffectRegistry,
): ValidationResult {
  const errors: ValidationError[] = [];

  // Trigger
  if (typeof flow.trigger !== "string" || flow.trigger.length === 0) {
    errors.push({
      code: "MISSING_TRIGGER",
      message: "Flow must have a non-empty trigger string",
    });
  }

  // Steps must be an array
  if (!Array.isArray(flow.steps)) {
    errors.push({
      code: "INVALID_STEPS",
      message: "Flow steps must be an array",
    });
    return { valid: false, errors };
  }

  // Max steps
  if (flow.steps.length > MAX_STEPS) {
    errors.push({
      code: "TOO_MANY_STEPS",
      message: `Flow has ${flow.steps.length} steps; maximum is ${MAX_STEPS}`,
    });
  }

  // Structural + registry check
  validateSteps(flow.steps, 0, errors, registry);

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

function validateSteps(
  steps: Step[],
  depth: number,
  errors: ValidationError[],
  registry?: EffectRegistry,
): void {
  // Defence-in-depth: TypeScript types prevent nesting at compile time;
  // this guard catches structurally invalid flows at runtime.
  if (depth > MAX_CONDITION_DEPTH) {
    errors.push({
      code: "CONDITION_TOO_DEEP",
      message: `Condition nesting exceeds maximum depth of ${MAX_CONDITION_DEPTH}`,
    });
    return;
  }

  for (const step of steps) {
    if (step.type === "effect") {
      if (!step.effect || typeof step.effect !== "string") {
        errors.push({
          code: "INVALID_EFFECT_NAME",
          message: "EffectStep must have a non-empty effect name",
        });
      } else if (registry && !registry.has(step.effect)) {
        errors.push({
          code: "UNREGISTERED_EFFECT",
          message: `Effect "${step.effect}" is not registered`,
        });
      }
    } else if (step.type === "condition") {
      if (!step.if || typeof step.if !== "string") {
        errors.push({
          code: "INVALID_CONDITION_EXPR",
          message: "ConditionStep must have a non-empty if expression",
        });
      }
      if (!Array.isArray(step.then)) {
        errors.push({
          code: "INVALID_THEN",
          message: "ConditionStep.then must be an array",
        });
      } else {
        validateSteps(step.then, depth + 1, errors, registry);
      }
      if (step.else !== undefined) {
        validateSteps(step.else, depth + 1, errors, registry);
      }
    } else {
      errors.push({
        code: "UNKNOWN_STEP_TYPE",
        message: `Unknown step type: "${(step as { type: string }).type}"`,
      });
    }
  }
}
