import { describe, it, expect, vi } from "vitest";
import { ConduktEngine } from "../engine";
import type { Observer } from "../observer";

describe("Stage 6.2 — Observer: lifecycle hooks", () => {
  it("calls onFlowStart and onFlowEnd when flow executes", async () => {
    const engine = new ConduktEngine();
    engine.registerEffect("noop", async (_ctx, _params) => { });
    engine.registerFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "noop" }],
    });

    const obs: Observer = { onFlowStart: vi.fn(), onFlowEnd: vi.fn() };
    engine.addObserver(obs);

    await engine.dispatch("t");
    expect(obs.onFlowStart).toHaveBeenCalledOnce();
    expect(obs.onFlowEnd).toHaveBeenCalledOnce();
  });

  it("calls onStepStart and onStepEnd for each step", async () => {
    const engine = new ConduktEngine();
    engine.registerEffect("s1", async (_ctx, _params) => { });
    engine.registerEffect("s2", async (_ctx, _params) => { });
    engine.registerFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "s1" }, { effect: "s2" }],
    });

    const starts: number[] = [];
    const ends: number[] = [];
    engine.addObserver({
      onStepStart: (_step, i) => starts.push(i),
      onStepEnd: (_step, i) => ends.push(i),
    });

    await engine.dispatch("t");
    expect(starts).toEqual([0, 1]);
    expect(ends).toEqual([0, 1]);
  });

  it("calls onError when kernel throws (unregistered effect)", async () => {
    const engine = new ConduktEngine();
    // Bypass registerFlow validation to force a runtime error
    (engine as unknown as { flows: Map<string, unknown> }).flows.set("t", {
      id: "f1",
      trigger: "t",
      steps: [{ type: "effect", effect: "missing" }],
    });

    const errorCb = vi.fn();
    engine.addObserver({ onError: errorCb });

    await expect(engine.dispatch("t")).rejects.toThrow();
    expect(errorCb).toHaveBeenCalledOnce();
  });

  it("observer hooks do not affect execution result", async () => {
    const engine = new ConduktEngine();
    const log: string[] = [];
    engine.registerEffect("s1", async (_ctx, _params) => {
      log.push("s1");
    });
    engine.registerEffect("s2", async (_ctx, _params) => {
      log.push("s2");
    });
    engine.registerFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "s1" }, { effect: "s2" }],
    });

    engine.addObserver({
      onStepStart: vi.fn(),
      onStepEnd: vi.fn(),
      onFlowStart: vi.fn(),
      onFlowEnd: vi.fn(),
    });

    await engine.dispatch("t");
    expect(log).toEqual(["s1", "s2"]);
  });

  it("multiple observers all receive notifications", async () => {
    const engine = new ConduktEngine();
    engine.registerEffect("noop", async (_ctx, _params) => { });
    engine.registerFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "noop" }],
    });

    const obs1 = { onFlowStart: vi.fn() };
    const obs2 = { onFlowStart: vi.fn() };
    engine.addObserver(obs1);
    engine.addObserver(obs2);

    await engine.dispatch("t");
    expect(obs1.onFlowStart).toHaveBeenCalledOnce();
    expect(obs2.onFlowStart).toHaveBeenCalledOnce();
  });

  it("engine works normally with no observers registered", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("noop", async (_ctx, _params) => {
      called();
    });
    engine.registerFlow({
      id: "f1",
      trigger: "t",
      steps: [{ effect: "noop" }],
    });
    await expect(engine.dispatch("t")).resolves.toBeUndefined();
    expect(called).toHaveBeenCalledOnce();
  });
});

describe("Stage 6.2 — Observer: validation integration", () => {
  it("registerFlow throws on invalid flow", () => {
    const engine = new ConduktEngine();
    // Empty trigger is caught by normalizer; use unregistered effect to test validator path
    expect(() =>
      engine.registerFlow({
        id: "f1",
        trigger: "t",
        steps: [{ effect: "not.registered" }],
      }),
    ).toThrow("failed validation");
  });

  it("registerFlow succeeds for valid flow with registered effects", () => {
    const engine = new ConduktEngine();
    engine.registerEffect("api.call", async (_ctx, _params) => { });
    expect(() =>
      engine.registerFlow({
        id: "f1",
        trigger: "t",
        steps: [{ effect: "api.call" }],
      }),
    ).not.toThrow();
  });

  it("dispatching after valid registration executes flow", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("step.a", async (_ctx, _params) => {
      called();
    });
    engine.registerFlow({
      id: "f1",
      trigger: "run",
      steps: [{ effect: "step.a" }],
    });
    await engine.dispatch("run");
    expect(called).toHaveBeenCalledOnce();
  });
});
