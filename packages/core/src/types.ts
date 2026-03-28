// ─── Adapter ─────────────────────────────────────────────────────────────────

export type AdapterError = {
  code: string;
  message: string;
  retryable?: boolean;
};

export type AdapterResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: AdapterError };

export type Adapter<TParams = Record<string, unknown>, TResult = unknown> = {
  execute(params: TParams): Promise<AdapterResult<TResult>>;
};

// ─── Step Types ───────────────────────────────────────────────────────────────
// Steps MUST NOT contain an `id` field (RUNTIME-SPEC §4 — Step Identity Constraint).
// If identification is needed for debugging, Runtime MAY generate ephemeral IDs
// at execution time.

export type EffectStep = {
  type: "effect";
  effect: string;
  params?: Record<string, unknown>;
};

export type ConditionStep = {
  type: "condition";
  if: string;
  then: EffectStep[];
  else?: EffectStep[];
};

export type Step = EffectStep | ConditionStep;

// ─── Flow ─────────────────────────────────────────────────────────────────────

export type Flow = {
  id: string;
  trigger: string;
  steps: Step[];
};

// ─── Execution Context ────────────────────────────────────────────────────────

export type ExecutionContext = {
  event: unknown;
  state: Record<string, unknown>;
  result?: unknown;
  dispatch: (event: string, payload?: unknown) => Promise<void>;
};

// ─── Effect Handler ───────────────────────────────────────────────────────────

export type EffectHandler = (
  ctx: ExecutionContext,
  params: Record<string, unknown>,
) => Promise<void>;

// ─── Effect Registry ──────────────────────────────────────────────────────────

export type EffectRegistry = {
  register(name: string, handler: EffectHandler): void;
  get(name: string): EffectHandler;
  has(name: string): boolean;
};
