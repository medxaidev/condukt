import { describe, it, expect, vi } from "vitest";
import { ConduktEngine } from "@condukt/core";

function makeEngine() {
  const engine = new ConduktEngine();
  // Register mock adapters so built-in effects don't call real APIs
  engine.registerEffect("api.call", async (ctx, _params) => {
    ctx.result = { success: true, data: { id: 99 } };
    await ctx.dispatch("api.success", { id: 99 });
  });
  engine.registerEffect("modal.open", async (ctx, _params) => {
    ctx.result = { success: true };
  });
  engine.registerEffect("modal.close", async (ctx, _params) => {
    ctx.result = { success: true };
  });
  engine.registerEffect("toast.show", async (ctx, _params) => {
    ctx.result = { success: true };
  });
  engine.registerEffect("state.set", async (ctx, params) => {
    const { key, value } = params as { key: string; value: unknown };
    ctx.state[key] = value;
    ctx.result = { success: true };
  });
  engine.registerEffect("table.reload", async (ctx, _params) => {
    ctx.result = { success: true };
  });
  return engine;
}

describe("Stage 7.3 — E2E: user.save flow", () => {
  it("executes complete flow: api → table → modal.close → toast", async () => {
    const engine = makeEngine();
    const log: string[] = [];

    engine.registerEffect("api.call", async (ctx, _params) => {
      log.push("api");
      ctx.result = { success: true };
      await ctx.dispatch("api.success", {});
    });
    engine.registerEffect("table.reload", async (_ctx, _params) => {
      log.push("table");
    });
    engine.registerEffect("modal.close", async (_ctx, _params) => {
      log.push("modal");
    });
    engine.registerEffect("toast.show", async (_ctx, _params) => {
      log.push("toast");
    });

    engine.registerFlow({
      id: "save-user",
      trigger: "user.save",
      steps: [
        { effect: "api.call", params: { url: "/api/users", method: "POST" } },
        { effect: "table.reload", params: { id: "users-table" } },
        { effect: "modal.close", params: { id: "user-form" } },
        {
          effect: "toast.show",
          params: { type: "success", message: "Saved!" },
        },
      ],
    });

    await engine.dispatch("user.save", { name: "Alice" });
    expect(log).toEqual(["api", "table", "modal", "toast"]);
  });

  it("event payload is accessible in all steps via $event", async () => {
    const engine = makeEngine();
    const captured: unknown[] = [];

    engine.registerEffect("log.event", async (ctx, _params) => {
      captured.push(ctx.event);
    });
    engine.registerFlow({
      id: "data-received",
      trigger: "data.received",
      steps: [{ effect: "log.event" }, { effect: "log.event" }],
    });

    await engine.dispatch("data.received", { userId: 42 });
    expect(captured).toHaveLength(2);
    expect(captured[0]).toEqual({ userId: 42 });
    expect(captured[1]).toEqual({ userId: 42 });
  });

  it("result from step N is accessible as $result in step N+1 params", async () => {
    const engine = makeEngine();
    let receivedToken: unknown;

    engine.registerEffect("fetch.token", async (ctx, _params) => {
      ctx.result = { token: "abc123" };
    });
    engine.registerEffect("use.token", async (_ctx, params) => {
      receivedToken = params.token;
    });

    engine.registerFlow({
      id: "token-flow",
      trigger: "token.flow",
      steps: [
        { effect: "fetch.token" },
        { effect: "use.token", params: { token: "$result.token" } },
      ],
    });

    await engine.dispatch("token.flow");
    expect(receivedToken).toBe("abc123");
  });
});

describe("Stage 7.3 — E2E: error handling via events", () => {
  it("api.error event triggers toast.show error flow", async () => {
    const engine = makeEngine();
    const toastCalled = vi.fn();

    engine.registerEffect("api.call", async (ctx, _params) => {
      ctx.result = {
        success: false,
        error: { code: "500", message: "Server error" },
      };
      await ctx.dispatch("api.error", { code: "500", message: "Server error" });
    });
    engine.registerEffect("toast.show", async (_ctx, _params) => {
      toastCalled();
    });

    engine.registerFlow({
      id: "save-user",
      trigger: "user.save",
      steps: [{ effect: "api.call", params: { url: "/api/save" } }],
    });
    engine.registerFlow({
      id: "api-error-toast",
      trigger: "api.error",
      steps: [
        {
          effect: "toast.show",
          params: { type: "error", message: "Save failed" },
        },
      ],
    });

    await engine.dispatch("user.save");
    expect(toastCalled).toHaveBeenCalledOnce();
  });

  it("error in flow A does not affect unrelated flow B", async () => {
    const engine = makeEngine();
    const bCalled = vi.fn();

    engine.registerEffect("will.fail", async (ctx, _params) => {
      ctx.result = { success: false };
    });
    engine.registerEffect("b.action", async (_ctx, _params) => {
      bCalled();
    });

    engine.registerFlow({
      id: "flow-a",
      trigger: "flow.a",
      steps: [{ effect: "will.fail" }],
    });
    engine.registerFlow({
      id: "flow-b",
      trigger: "flow.b",
      steps: [{ effect: "b.action" }],
    });

    await engine.dispatch("flow.a");
    await engine.dispatch("flow.b");
    expect(bCalled).toHaveBeenCalledOnce();
  });

  it("dispatching unknown event resolves without error", async () => {
    const engine = makeEngine();
    await expect(engine.dispatch("no.such.event")).resolves.toBeUndefined();
  });
});

describe("Stage 7.3 — E2E: conditional branching", () => {
  it("then branch executes when condition is true", async () => {
    const engine = makeEngine();
    const log: string[] = [];
    engine.registerEffect("action.a", async (_ctx, _params) => {
      log.push("A");
    });
    engine.registerEffect("action.b", async (_ctx, _params) => {
      log.push("B");
    });

    engine.registerFlow({
      id: "check-flow",
      trigger: "check",
      steps: [
        {
          if: "$event.loggedIn",
          then: [{ effect: "action.a" }],
          else: [{ effect: "action.b" }],
        },
      ],
    });

    await engine.dispatch("check", { loggedIn: true });
    expect(log).toEqual(["A"]);
  });

  it("else branch executes when condition is false", async () => {
    const engine = makeEngine();
    const log: string[] = [];
    engine.registerEffect("action.a", async (_ctx, _params) => {
      log.push("A");
    });
    engine.registerEffect("action.b", async (_ctx, _params) => {
      log.push("B");
    });

    engine.registerFlow({
      id: "check-flow",
      trigger: "check",
      steps: [
        {
          if: "$event.loggedIn",
          then: [{ effect: "action.a" }],
          else: [{ effect: "action.b" }],
        },
      ],
    });

    await engine.dispatch("check", { loggedIn: false });
    expect(log).toEqual(["B"]);
  });

  it("full flow: api → condition → modal.close or toast.error", async () => {
    const engine = makeEngine();
    const log: string[] = [];

    engine.registerEffect("api.call", async (ctx, _params) => {
      ctx.result = { success: true };
      log.push("api");
    });
    engine.registerEffect("modal.close", async (_ctx, _params) => {
      log.push("modal.close");
    });
    engine.registerEffect("toast.show", async (_ctx, _params) => {
      log.push("toast.error");
    });

    engine.registerFlow({
      id: "form-submit",
      trigger: "form.submit",
      steps: [
        { effect: "api.call", params: { url: "/submit" } },
        {
          if: "$result.success",
          then: [{ effect: "modal.close", params: { id: "form" } }],
          else: [
            {
              effect: "toast.show",
              params: { type: "error", message: "Failed" },
            },
          ],
        },
      ],
    });

    await engine.dispatch("form.submit");
    expect(log).toEqual(["api", "modal.close"]);
  });

  it("multiple events dispatch independently with correct flows", async () => {
    const engine = makeEngine();
    const log: string[] = [];
    engine.registerEffect("open.modal", async (_ctx, _params) => {
      log.push("open");
    });
    engine.registerEffect("close.modal", async (_ctx, _params) => {
      log.push("close");
    });

    engine.registerFlow({
      id: "open-modal-flow",
      trigger: "modal.open.requested",
      steps: [{ effect: "open.modal" }],
    });
    engine.registerFlow({
      id: "close-modal-flow",
      trigger: "modal.close.requested",
      steps: [{ effect: "close.modal" }],
    });

    await engine.dispatch("modal.open.requested");
    await engine.dispatch("modal.close.requested");
    await engine.dispatch("modal.open.requested");

    expect(log).toEqual(["open", "close", "open"]);
  });
});

describe("Stage 7.3 — E2E: observation", () => {
  it("observer receives flow and step lifecycle events", async () => {
    const engine = makeEngine();
    engine.registerEffect("step.one", async (_ctx, _params) => {});
    engine.registerEffect("step.two", async (_ctx, _params) => {});
    engine.registerFlow({
      id: "observed-flow",
      trigger: "observed.flow",
      steps: [{ effect: "step.one" }, { effect: "step.two" }],
    });

    const events: string[] = [];
    engine.addObserver({
      onFlowStart: () => events.push("flow:start"),
      onFlowEnd: () => events.push("flow:end"),
      onStepStart: (_s, i) => events.push(`step:start:${i}`),
      onStepEnd: (_s, i) => events.push(`step:end:${i}`),
    });

    await engine.dispatch("observed.flow");
    expect(events).toEqual([
      "flow:start",
      "step:start:0",
      "step:end:0",
      "step:start:1",
      "step:end:1",
      "flow:end",
    ]);
  });
});
