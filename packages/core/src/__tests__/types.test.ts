import { describe, it, expect } from "vitest";
import type {
  EffectStep,
  ConditionStep,
  Flow,
  ExecutionContext,
  AdapterResult,
  EffectHandler,
} from "../types";

describe("Stage 1.2 — EffectStep", () => {
  it("can be constructed with required fields only", () => {
    const step: EffectStep = { type: "effect", effect: "modal.open" };
    expect(step.type).toBe("effect");
    expect(step.effect).toBe("modal.open");
    expect(step.params).toBeUndefined();
  });

  it("can be constructed with params", () => {
    const step: EffectStep = {
      type: "effect",
      effect: "api.call",
      params: { url: "/api/users", method: "POST" },
    };
    expect(step.params).toMatchObject({ url: "/api/users" });
  });

  it("type field is literal 'effect'", () => {
    const step: EffectStep = { type: "effect", effect: "toast.show" };
    expect(step.type).toBe("effect");
  });
});

describe("Stage 1.2 — ConditionStep", () => {
  it("can be constructed with if + then", () => {
    const step: ConditionStep = {
      type: "condition",
      if: "$state.user != null",
      then: [{ type: "effect", effect: "modal.open" }],
    };
    expect(step.if).toBe("$state.user != null");
    expect(step.then).toHaveLength(1);
  });

  it("else branch is optional", () => {
    const step: ConditionStep = {
      type: "condition",
      if: "$state.ready",
      then: [],
    };
    expect(step.else).toBeUndefined();
  });

  it("then and else only contain EffectStep (not nested ConditionStep)", () => {
    const step: ConditionStep = {
      type: "condition",
      if: "$event.valid",
      then: [{ type: "effect", effect: "api.call" }],
      else: [{ type: "effect", effect: "toast.show" }],
    };
    expect(step.then[0].type).toBe("effect");
    expect(step.else![0].type).toBe("effect");
  });
});

describe("Stage 1.2 — Flow", () => {
  it("has id, trigger and steps", () => {
    const flow: Flow = { id: "save-user", trigger: "user.save", steps: [] };
    expect(flow.id).toBe("save-user");
    expect(flow.trigger).toBe("user.save");
    expect(flow.steps).toEqual([]);
  });

  it("steps can contain both EffectStep and ConditionStep", () => {
    const flow: Flow = {
      id: "submit-form",
      trigger: "form.submit",
      steps: [
        { type: "effect", effect: "api.call" },
        {
          type: "condition",
          if: "$result.success",
          then: [{ type: "effect", effect: "modal.close" }],
        },
      ],
    };
    expect(flow.steps).toHaveLength(2);
  });
});

describe("Stage 1.2 — ExecutionContext", () => {
  it("has all required fields", async () => {
    const dispatched: string[] = [];
    const ctx: ExecutionContext = {
      event: { id: 1 },
      state: {},
      dispatch: async (e) => {
        dispatched.push(e);
      },
    };
    await ctx.dispatch("test.event");
    expect(dispatched).toContain("test.event");
  });

  it("result is optional, defaults to undefined", () => {
    const ctx: ExecutionContext = {
      event: {},
      state: {},
      dispatch: async () => {},
    };
    expect(ctx.result).toBeUndefined();
  });
});

describe("Stage 1.2 — AdapterResult", () => {
  it("success result has success: true", () => {
    const r: AdapterResult<string> = { success: true, data: "ok" };
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("ok");
  });

  it("failure result has success: false with error object", () => {
    const r: AdapterResult = {
      success: false,
      error: { code: "ERR_001", message: "Failed" },
    };
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.code).toBe("ERR_001");
      expect(r.error.message).toBe("Failed");
    }
  });

  it("failure error can include retryable flag", () => {
    const r: AdapterResult = {
      success: false,
      error: { code: "TIMEOUT", message: "Request timed out", retryable: true },
    };
    if (!r.success) expect(r.error.retryable).toBe(true);
  });
});

describe("Stage 1.2 — EffectHandler", () => {
  it("is an async function that receives context and params", async () => {
    const handler: EffectHandler = async (ctx, params) => {
      ctx.result = { done: true, url: params.url };
    };
    const ctx: ExecutionContext = {
      event: {},
      state: {},
      dispatch: async () => {},
    };
    await handler(ctx, { url: "/api/users" });
    expect(ctx.result).toEqual({ done: true, url: "/api/users" });
  });

  it("returns Promise<void> — caller does not receive a value", async () => {
    const handler: EffectHandler = async (_ctx, _params) => {};
    const ctx: ExecutionContext = {
      event: {},
      state: {},
      dispatch: async () => {},
    };
    const returned = await handler(ctx, {});
    expect(returned).toBeUndefined();
  });

  it("can dispatch events via ctx.dispatch", async () => {
    const events: string[] = [];
    const handler: EffectHandler = async (ctx, _params) => {
      await ctx.dispatch("handler.done", { ok: true });
    };
    const ctx: ExecutionContext = {
      event: {},
      state: {},
      dispatch: async (e) => {
        events.push(e);
      },
    };
    await handler(ctx, {});
    expect(events).toContain("handler.done");
  });

  it("receives resolved params as explicit second argument", async () => {
    let received: Record<string, unknown> | undefined;
    const handler: EffectHandler = async (_ctx, params) => {
      received = params;
    };
    const ctx: ExecutionContext = {
      event: {},
      state: {},
      dispatch: async () => {},
    };
    await handler(ctx, { url: "/api/users", method: "POST" });
    expect(received).toEqual({ url: "/api/users", method: "POST" });
  });
});
