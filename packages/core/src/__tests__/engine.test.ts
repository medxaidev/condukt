import { describe, it, expect, vi } from "vitest";
import { ConduktEngine } from "../engine";

describe("Stage 4.2 — ConduktEngine: dispatch", () => {
  it("dispatching unregistered event resolves without error", async () => {
    const engine = new ConduktEngine();
    await expect(engine.dispatch("no.flow")).resolves.toBeUndefined();
  });

  it("executes registered flow on matching dispatch", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("toast.show", async (_ctx, _params) => {
      called();
    });
    engine.registerFlow({
      id: "save-user",
      trigger: "user.save",
      steps: [{ effect: "toast.show" }],
    });
    await engine.dispatch("user.save");
    expect(called).toHaveBeenCalledOnce();
  });

  it("passes event payload into execution context", async () => {
    const engine = new ConduktEngine();
    let capturedEvent: unknown;
    engine.registerEffect("capture", async (ctx, _params) => {
      capturedEvent = ctx.event;
    });
    engine.registerFlow({
      id: "test-flow",
      trigger: "test",
      steps: [{ effect: "capture" }],
    });
    await engine.dispatch("test", { userId: 7 });
    expect(capturedEvent).toEqual({ userId: 7 });
  });

  it("handler re-dispatch triggers another registered flow", async () => {
    const engine = new ConduktEngine();
    const second = vi.fn();
    engine.registerEffect("step.one", async (ctx, _params) => {
      await ctx.dispatch("step.two.event");
    });
    engine.registerEffect("step.two", async (_ctx, _params) => {
      second();
    });
    engine.registerFlow({
      id: "start-flow",
      trigger: "start",
      steps: [{ effect: "step.one" }],
    });
    engine.registerFlow({
      id: "step-two-flow",
      trigger: "step.two.event",
      steps: [{ effect: "step.two" }],
    });
    await engine.dispatch("start");
    expect(second).toHaveBeenCalledOnce();
  });

  it("multi-step flow runs all steps before resolving", async () => {
    const engine = new ConduktEngine();
    const log: number[] = [];
    engine.registerEffect("s1", async (_ctx, _params) => {
      log.push(1);
    });
    engine.registerEffect("s2", async (_ctx, _params) => {
      log.push(2);
    });
    engine.registerEffect("s3", async (_ctx, _params) => {
      log.push(3);
    });
    engine.registerFlow({
      id: "run-flow",
      trigger: "run",
      steps: [{ effect: "s1" }, { effect: "s2" }, { effect: "s3" }],
    });
    await engine.dispatch("run");
    expect(log).toEqual([1, 2, 3]);
  });
});

describe("Stage 4.2 — ConduktEngine: registerFlow", () => {
  it("normalizes DSL action step on registration", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("modal.open", called);
    // Uses DSL 'action' key — normalizer converts this
    engine.registerFlow({
      id: "click-modal",
      trigger: "click",
      steps: [{ action: "modal.open" }],
    });
    await engine.dispatch("click");
    expect(called).toHaveBeenCalledOnce();
  });

  it("supports on alias for trigger", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("noop", async (_ctx, _params) => {
      called();
    });
    engine.registerFlow({
      id: "alias-flow",
      on: "alias.event",
      steps: [{ effect: "noop" }],
    });
    await engine.dispatch("alias.event");
    expect(called).toHaveBeenCalledOnce();
  });

  it("re-registering same trigger replaces the flow", async () => {
    const engine = new ConduktEngine();
    const v1 = vi.fn();
    const v2 = vi.fn();
    engine.registerEffect("v1", async (_ctx, _params) => {
      v1();
    });
    engine.registerEffect("v2", async (_ctx, _params) => {
      v2();
    });
    engine.registerFlow({
      id: "f-v1",
      trigger: "t",
      steps: [{ effect: "v1" }],
    });
    engine.registerFlow({
      id: "f-v2",
      trigger: "t",
      steps: [{ effect: "v2" }],
    });
    await engine.dispatch("t");
    expect(v1).not.toHaveBeenCalled();
    expect(v2).toHaveBeenCalledOnce();
  });
});

describe("Stage 4.2 — ConduktEngine: conditional flow", () => {
  it("branches correctly based on event payload", async () => {
    const engine = new ConduktEngine();
    const log: string[] = [];
    engine.registerEffect("then.action", async (_ctx, _params) => {
      log.push("then");
    });
    engine.registerEffect("else.action", async (_ctx, _params) => {
      log.push("else");
    });
    engine.registerFlow({
      id: "check-flow",
      trigger: "check",
      steps: [
        {
          if: "$event.ok",
          then: [{ effect: "then.action" }],
          else: [{ effect: "else.action" }],
        },
      ],
    });
    await engine.dispatch("check", { ok: true });
    expect(log).toEqual(["then"]);
    log.length = 0;
    await engine.dispatch("check", { ok: false });
    expect(log).toEqual(["else"]);
  });
});
