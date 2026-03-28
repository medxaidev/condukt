import { describe, it, expect } from "vitest";
import { normalizeFlow } from "../normalizer/normalize";
import type { DSLFlow } from "../normalizer/dsl-types";

// ─── Trigger Resolution ───────────────────────────────────────────────────────

describe("Stage 3.1 — trigger resolution", () => {
  it("uses trigger field", () => {
    const flow = normalizeFlow({ id: "f1", trigger: "user.save", steps: [] });
    expect(flow.trigger).toBe("user.save");
  });

  it("preserves id from DSL", () => {
    const flow = normalizeFlow({
      id: "save-user",
      trigger: "user.save",
      steps: [],
    });
    expect(flow.id).toBe("save-user");
  });

  it("uses on field as alias for trigger", () => {
    const flow = normalizeFlow({ id: "f2", on: "form.submit", steps: [] });
    expect(flow.trigger).toBe("form.submit");
  });

  it("trigger takes precedence over on when both present", () => {
    const flow = normalizeFlow({
      id: "f3",
      trigger: "t1",
      on: "t2",
      steps: [],
    });
    expect(flow.trigger).toBe("t1");
  });

  it("throws when neither trigger nor on is present", () => {
    expect(() => normalizeFlow({ id: "f4", steps: [] } as DSLFlow)).toThrow(
      "trigger",
    );
  });
});

// ─── Action → Effect Conversion ───────────────────────────────────────────────

describe("Stage 3.2 — action → effect conversion", () => {
  it("converts action step to EffectStep with type 'effect'", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ action: "api.call" }],
    });
    expect(flow.steps[0]).toEqual({ type: "effect", effect: "api.call" });
  });

  it("passes effect step through with type field added", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "toast.show" }],
    });
    expect(flow.steps[0]).toEqual({ type: "effect", effect: "toast.show" });
  });

  it("preserves params from action step verbatim (no evaluation)", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ action: "user.load", params: { id: "$event.userId" } }],
    });
    const step = flow.steps[0];
    expect(step.type).toBe("effect");
    if (step.type === "effect")
      expect(step.params).toEqual({ id: "$event.userId" });
  });

  it("preserves params from effect step verbatim", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [
        {
          effect: "toast.show",
          params: { type: "success", message: "$state.msg" },
        },
      ],
    });
    const step = flow.steps[0];
    if (step.type === "effect") expect(step.params?.message).toBe("$state.msg");
  });

  it("omits params key when source step has no params", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ action: "modal.close" }],
    });
    const step = flow.steps[0];
    if (step.type === "effect") expect(step.params).toBeUndefined();
  });
});

// ─── Condition Normalization ───────────────────────────────────────────────────

describe("Stage 3.3 — condition normalization", () => {
  it("normalizes condition with then branch", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [
        {
          if: "$state.user != null",
          then: [{ action: "modal.open" }],
        },
      ],
    });
    const step = flow.steps[0];
    expect(step.type).toBe("condition");
    if (step.type === "condition") {
      expect(step.if).toBe("$state.user != null");
      expect(step.then[0]).toEqual({ type: "effect", effect: "modal.open" });
    }
  });

  it("normalizes condition with then and else branches", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [
        {
          if: "$state.ready",
          then: [{ effect: "table.reload" }],
          else: [
            {
              effect: "toast.show",
              params: { type: "error", message: "Not ready" },
            },
          ],
        },
      ],
    });
    const step = flow.steps[0];
    if (step.type === "condition") {
      expect(step.then[0].effect).toBe("table.reload");
      expect(step.else?.[0].effect).toBe("toast.show");
    }
  });

  it("else is undefined when not specified in DSL", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ if: "$event.ok", then: [{ action: "noop" }] }],
    });
    const step = flow.steps[0];
    if (step.type === "condition") expect(step.else).toBeUndefined();
  });

  it("converts action steps inside condition branches", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [
        {
          if: "$event.valid",
          then: [{ action: "api.call", params: { url: "/submit" } }],
        },
      ],
    });
    const step = flow.steps[0];
    if (step.type === "condition") {
      expect(step.then[0]).toEqual({
        type: "effect",
        effect: "api.call",
        params: { url: "/submit" },
      });
    }
  });
});

// ─── Multi-step Flow ──────────────────────────────────────────────────────────

describe("Stage 3.4 — multi-step flow", () => {
  it("produces correct step count", () => {
    const flow = normalizeFlow({
      id: "save-user",
      trigger: "user.save",
      steps: [
        { action: "api.call" },
        { effect: "table.reload" },
        { action: "modal.close" },
        { effect: "toast.show" },
      ],
    });
    expect(flow.steps).toHaveLength(4);
  });

  it("all steps have type field set", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [{ action: "a" }, { effect: "b" }],
    });
    flow.steps.forEach((s) => expect(s.type).toBeDefined());
  });

  it("mixed effect and condition steps normalize correctly", () => {
    const flow = normalizeFlow({
      id: "f1",
      trigger: "t",
      steps: [
        { action: "api.call" },
        { if: "$result.success", then: [{ action: "modal.close" }] },
      ],
    });
    expect(flow.steps[0].type).toBe("effect");
    expect(flow.steps[1].type).toBe("condition");
  });
});
