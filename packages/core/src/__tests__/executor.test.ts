import { describe, it, expect, vi } from "vitest";
import { executeSteps } from "../kernel/executor";
import type {
  ExecutionContext,
  EffectHandler,
  EffectRegistry,
  Step,
} from "../types";

function makeCtx(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    event: { id: 1, valid: true },
    state: { ready: true, count: 5 },
    dispatch: vi.fn(),
    ...overrides,
  };
}

function makeRegistry(...pairs: [string, EffectHandler][]): EffectRegistry {
  const map = new Map(pairs);
  return {
    register: (n, h) => {
      map.set(n, h);
    },
    get: (n) => map.get(n) as EffectHandler,
    has: (n) => map.has(n),
  };
}

describe("Stage 2.3 — executeSteps: sequential execution", () => {
  it("runs all steps in order", async () => {
    const log: string[] = [];
    const reg = makeRegistry(
      [
        "a",
        async (_ctx, _params) => {
          log.push("a");
        },
      ],
      [
        "b",
        async (_ctx, _params) => {
          log.push("b");
        },
      ],
      [
        "c",
        async (_ctx, _params) => {
          log.push("c");
        },
      ],
    );
    await executeSteps(
      [
        { type: "effect", effect: "a" },
        { type: "effect", effect: "b" },
        { type: "effect", effect: "c" },
      ],
      makeCtx(),
      reg,
    );
    expect(log).toEqual(["a", "b", "c"]);
  });

  it("awaits each handler before proceeding", async () => {
    const log: number[] = [];
    const reg = makeRegistry(
      [
        "slow",
        async (_ctx, _params) => {
          await new Promise((r) => setTimeout(r, 5));
          log.push(1);
        },
      ],
      [
        "fast",
        async (_ctx, _params) => {
          log.push(2);
        },
      ],
    );
    await executeSteps(
      [
        { type: "effect", effect: "slow" },
        { type: "effect", effect: "fast" },
      ],
      makeCtx(),
      reg,
    );
    expect(log).toEqual([1, 2]);
  });

  it("handles an empty steps array without error", async () => {
    await expect(
      executeSteps([], makeCtx(), makeRegistry()),
    ).resolves.toBeUndefined();
  });
});

describe("Stage 2.3 — executeSteps: param resolution", () => {
  it("passes resolved params to handler as second argument", async () => {
    let captured: unknown;
    const reg = makeRegistry([
      "grab",
      async (_ctx, params) => {
        captured = params;
      },
    ]);
    const ctx = makeCtx({ event: { userId: 99 } });
    await executeSteps(
      [{ type: "effect", effect: "grab", params: { id: "$event.userId" } }],
      ctx,
      reg,
    );
    expect(captured).toEqual({ id: 99 });
  });

  it("passes empty object when step has no params", async () => {
    let captured: unknown;
    const reg = makeRegistry([
      "noop",
      async (_ctx, params) => {
        captured = params;
      },
    ]);
    await executeSteps([{ type: "effect", effect: "noop" }], makeCtx(), reg);
    expect(captured).toEqual({});
  });

  it("ctx.result set by handler is available in subsequent step params", async () => {
    let secondParams: unknown;
    const reg = makeRegistry(
      [
        "set.result",
        async (ctx, _params) => {
          ctx.result = { token: "xyz" };
        },
      ],
      [
        "use.result",
        async (_ctx, params) => {
          secondParams = params;
        },
      ],
    );
    await executeSteps(
      [
        { type: "effect", effect: "set.result" },
        {
          type: "effect",
          effect: "use.result",
          params: { token: "$result.token" },
        },
      ],
      makeCtx(),
      reg,
    );
    expect(secondParams).toEqual({ token: "xyz" });
  });
});

describe("Stage 2.3 — executeSteps: condition branching", () => {
  it("executes then branch when condition is true", async () => {
    const log: string[] = [];
    const reg = makeRegistry(
      [
        "then.step",
        async (_ctx, _params) => {
          log.push("then");
        },
      ],
      [
        "else.step",
        async (_ctx, _params) => {
          log.push("else");
        },
      ],
    );
    await executeSteps(
      [
        {
          type: "condition",
          if: "$state.ready",
          then: [{ type: "effect", effect: "then.step" }],
          else: [{ type: "effect", effect: "else.step" }],
        },
      ],
      makeCtx({ state: { ready: true } }),
      reg,
    );
    expect(log).toEqual(["then"]);
  });

  it("executes else branch when condition is false", async () => {
    const log: string[] = [];
    const reg = makeRegistry(
      [
        "then.step",
        async (_ctx, _params) => {
          log.push("then");
        },
      ],
      [
        "else.step",
        async (_ctx, _params) => {
          log.push("else");
        },
      ],
    );
    await executeSteps(
      [
        {
          type: "condition",
          if: "$state.ready",
          then: [{ type: "effect", effect: "then.step" }],
          else: [{ type: "effect", effect: "else.step" }],
        },
      ],
      makeCtx({ state: { ready: false } }),
      reg,
    );
    expect(log).toEqual(["else"]);
  });

  it("skips entirely when condition is false and no else branch", async () => {
    const log: string[] = [];
    const reg = makeRegistry([
      "then.step",
      async (_ctx, _params) => {
        log.push("then");
      },
    ]);
    await executeSteps(
      [
        {
          type: "condition",
          if: "$state.ready",
          then: [{ type: "effect", effect: "then.step" }],
        },
      ],
      makeCtx({ state: { ready: false } }),
      reg,
    );
    expect(log).toHaveLength(0);
  });

  it("executes mixed effect + condition steps in sequence", async () => {
    const log: string[] = [];
    const reg = makeRegistry(
      [
        "before",
        async (_ctx, _params) => {
          log.push("before");
        },
      ],
      [
        "in.then",
        async (_ctx, _params) => {
          log.push("in-then");
        },
      ],
      [
        "after",
        async (_ctx, _params) => {
          log.push("after");
        },
      ],
    );
    const steps: Step[] = [
      { type: "effect", effect: "before" },
      {
        type: "condition",
        if: "$event.valid",
        then: [{ type: "effect", effect: "in.then" }],
      },
      { type: "effect", effect: "after" },
    ];
    await executeSteps(steps, makeCtx({ event: { valid: true } }), reg);
    expect(log).toEqual(["before", "in-then", "after"]);
  });
});
