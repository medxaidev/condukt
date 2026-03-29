import { describe, it, expect } from "vitest";
import { validateFlow, MAX_STEPS } from "../validator";
import { DefaultEffectRegistry } from "../registry";
import type { Flow } from "../types";

function valid(overrides?: Partial<Flow>): Flow {
  return {
    id: "test-flow",
    trigger: "user.save",
    steps: [{ type: "effect", effect: "api.call" }],
    ...overrides,
  };
}

describe("Stage 6.1 — validateFlow: trigger", () => {
  it("returns valid for correct flow", () => {
    expect(validateFlow(valid())).toEqual({ valid: true });
  });

  it("returns MISSING_TRIGGER when trigger is empty string", () => {
    const r = validateFlow({ id: "f1", trigger: "", steps: [] });
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.errors.some((e) => e.code === "MISSING_TRIGGER")).toBe(true);
  });
});

describe("Stage 6.1 — validateFlow: step count", () => {
  it(`rejects flow with more than ${MAX_STEPS} steps`, () => {
    const steps: Flow["steps"] = Array.from(
      { length: MAX_STEPS + 1 },
      (_, i) => ({
        type: "effect" as const,
        effect: `s.${i}`,
      }),
    );
    const r = validateFlow({ id: "f1", trigger: "t", steps });
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.errors.some((e) => e.code === "TOO_MANY_STEPS")).toBe(true);
  });

  it(`accepts flow with exactly ${MAX_STEPS} steps`, () => {
    const steps: Flow["steps"] = Array.from({ length: MAX_STEPS }, (_, i) => ({
      type: "effect" as const,
      effect: `s.${i}`,
    }));
    expect(validateFlow({ id: "f1", trigger: "t", steps })).toEqual({
      valid: true,
    });
  });
});

describe("Stage 6.1 — validateFlow: condition depth", () => {
  it("accepts condition at depth 0 (top-level)", () => {
    const flow: Flow = {
      id: "f1",
      trigger: "t",
      steps: [
        {
          type: "condition",
          if: "$state.ok",
          then: [{ type: "effect", effect: "a" }],
        },
      ],
    };
    expect(validateFlow(flow)).toEqual({ valid: true });
  });

  it("rejects nested condition (depth > 1)", () => {
    // Simulate invalid runtime structure via cast
    const flow: Flow = {
      id: "f1",
      trigger: "t",
      steps: [
        {
          type: "condition",
          if: "$state.a",
          then: [
            { type: "condition", if: "$state.b", then: [] } as unknown as {
              type: "effect";
              effect: string;
            },
          ],
        },
      ],
    };
    const r = validateFlow(flow);
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.errors.some((e) => e.code === "CONDITION_TOO_DEEP")).toBe(true);
  });
});

describe("Stage 6.1 — validateFlow: registry check", () => {
  it("reports UNREGISTERED_EFFECT when registry provided and effect missing", () => {
    const reg = new DefaultEffectRegistry();
    const r = validateFlow(
      {
        id: "f1",
        trigger: "t",
        steps: [{ type: "effect", effect: "unknown.x" }],
      },
      reg,
    );
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.errors.some((e) => e.code === "UNREGISTERED_EFFECT")).toBe(true);
  });

  it("passes when effect is registered", () => {
    const reg = new DefaultEffectRegistry();
    reg.register("api.call", async (_ctx, _params) => {});
    expect(
      validateFlow(
        {
          id: "f1",
          trigger: "t",
          steps: [{ type: "effect", effect: "api.call" }],
        },
        reg,
      ),
    ).toEqual({ valid: true });
  });

  it("skips registry check when registry not provided", () => {
    expect(
      validateFlow({
        id: "f1",
        trigger: "t",
        steps: [{ type: "effect", effect: "any.name" }],
      }),
    ).toEqual({ valid: true });
  });
});

describe("Stage 6.1 — validateFlow: effect name", () => {
  it("rejects empty effect name", () => {
    const r = validateFlow({
      id: "f1",
      trigger: "t",
      steps: [{ type: "effect", effect: "" }],
    });
    expect(r.valid).toBe(false);
  });

  it("rejects condition with empty if expression", () => {
    const r = validateFlow({
      id: "f1",
      trigger: "t",
      steps: [{ type: "condition", if: "", then: [] }],
    });
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.errors.some((e) => e.code === "INVALID_CONDITION_EXPR")).toBe(
        true,
      );
  });

  it("collects multiple errors in one pass", () => {
    const r = validateFlow({
      id: "f1",
      trigger: "",
      steps: [
        { type: "effect", effect: "" },
        { type: "condition", if: "", then: [] },
      ],
    });
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });
});
