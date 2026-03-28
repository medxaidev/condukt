/**
 * DSL-layer types.
 * These are the developer-facing input types — NOT runtime types.
 * All DSL types normalize into types from @condukt/core.
 */

export type DSLActionStep = {
  action: string;
  params?: Record<string, unknown>;
};

export type DSLEffectStep = {
  effect: string;
  params?: Record<string, unknown>;
};

export type DSLLeafStep = DSLActionStep | DSLEffectStep;

export type DSLConditionStep = {
  if: string;
  then: DSLLeafStep[];
  else?: DSLLeafStep[];
};

export type DSLStep = DSLLeafStep | DSLConditionStep;

export type DSLFlow = {
  id: string;
  trigger?: string;
  on?: string; // alias for trigger
  steps: DSLStep[];
};
