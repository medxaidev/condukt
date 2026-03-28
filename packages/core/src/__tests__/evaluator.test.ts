import { describe, it, expect } from "vitest";
import { evaluateCondition } from "../kernel/evaluator";
import type { ExecutionContext } from "../types";

function ctx(
  state: Record<string, unknown> = {},
  event: Record<string, unknown> = {},
): ExecutionContext {
  return { event, state, dispatch: async () => {} };
}

describe("Stage 2.2 — evaluateCondition: equality", () => {
  it("$state.x == null is true when x is null", () => {
    expect(evaluateCondition("$state.x == null", ctx({ x: null }))).toBe(true);
  });

  it("$state.x != null is true when x is defined", () => {
    expect(evaluateCondition("$state.x != null", ctx({ x: "hello" }))).toBe(
      true,
    );
  });

  it("$event.valid == true", () => {
    expect(
      evaluateCondition("$event.valid == true", ctx({}, { valid: true })),
    ).toBe(true);
  });

  it("$event.valid == true is false when valid is false", () => {
    expect(
      evaluateCondition("$event.valid == true", ctx({}, { valid: false })),
    ).toBe(false);
  });
});

describe("Stage 2.2 — evaluateCondition: numeric comparisons", () => {
  it("$state.count > 2 is true when count=3", () => {
    expect(evaluateCondition("$state.count > 2", ctx({ count: 3 }))).toBe(true);
  });

  it("$state.count < 2 is false when count=3", () => {
    expect(evaluateCondition("$state.count < 2", ctx({ count: 3 }))).toBe(
      false,
    );
  });

  it("$state.count >= 3 is true when count=3", () => {
    expect(evaluateCondition("$state.count >= 3", ctx({ count: 3 }))).toBe(
      true,
    );
  });

  it("$state.count <= 2 is false when count=3", () => {
    expect(evaluateCondition("$state.count <= 2", ctx({ count: 3 }))).toBe(
      false,
    );
  });
});

describe("Stage 2.2 — evaluateCondition: truthy / negation", () => {
  it("bare $state.ready is true when ready=true", () => {
    expect(evaluateCondition("$state.ready", ctx({ ready: true }))).toBe(true);
  });

  it("bare $state.ready is false when ready=false", () => {
    expect(evaluateCondition("$state.ready", ctx({ ready: false }))).toBe(
      false,
    );
  });

  it("!$state.ready is true when ready=false", () => {
    expect(evaluateCondition("!$state.ready", ctx({ ready: false }))).toBe(
      true,
    );
  });

  it("!$state.ready is false when ready=true", () => {
    expect(evaluateCondition("!$state.ready", ctx({ ready: true }))).toBe(
      false,
    );
  });

  it("$state.user != null is false when user is null", () => {
    expect(evaluateCondition("$state.user != null", ctx({ user: null }))).toBe(
      false,
    );
  });
});

describe("Stage 2.2 — evaluateCondition: string comparison", () => {
  it('$state.role == "admin" is true', () => {
    expect(
      evaluateCondition('$state.role == "admin"', ctx({ role: "admin" })),
    ).toBe(true);
  });

  it('$state.role == "admin" is false when role is user', () => {
    expect(
      evaluateCondition('$state.role == "admin"', ctx({ role: "user" })),
    ).toBe(false);
  });
});
