import { describe, it, expect } from "vitest";
import { resolveValue, resolveParams } from "../kernel/resolver";
import type { ExecutionContext } from "../types";

function ctx(overrides?: Partial<ExecutionContext>): ExecutionContext {
  return {
    event: { userId: 42, tag: "admin" },
    state: { user: { name: "Alice" }, count: 3 },
    result: { success: true, data: { token: "abc" } },
    dispatch: async () => {},
    ...overrides,
  };
}

describe("Stage 2.1 — resolveValue: $event", () => {
  it("resolves $event.userId", () => {
    expect(resolveValue("$event.userId", ctx())).toBe(42);
  });

  it("resolves $event.tag", () => {
    expect(resolveValue("$event.tag", ctx())).toBe("admin");
  });

  it("returns undefined for missing $event key", () => {
    expect(resolveValue("$event.missing", ctx())).toBeUndefined();
  });
});

describe("Stage 2.1 — resolveValue: $state", () => {
  it("resolves $state.count", () => {
    expect(resolveValue("$state.count", ctx())).toBe(3);
  });

  it("resolves nested $state.user.name", () => {
    expect(resolveValue("$state.user.name", ctx())).toBe("Alice");
  });

  it("returns undefined when path traverses null", () => {
    expect(resolveValue("$state.missing.deep", ctx())).toBeUndefined();
  });
});

describe("Stage 2.1 — resolveValue: $result", () => {
  it("resolves $result.success", () => {
    expect(resolveValue("$result.success", ctx())).toBe(true);
  });

  it("resolves $result.data.token", () => {
    expect(resolveValue("$result.data.token", ctx())).toBe("abc");
  });

  it("returns undefined when result is undefined", () => {
    expect(
      resolveValue("$result.success", ctx({ result: undefined })),
    ).toBeUndefined();
  });
});

describe("Stage 2.1 — resolveValue: pass-through", () => {
  it("returns non-string value unchanged", () => {
    expect(resolveValue(42, ctx())).toBe(42);
    expect(resolveValue(true, ctx())).toBe(true);
    expect(resolveValue(null, ctx())).toBe(null);
  });

  it("returns plain string (no $ prefix) unchanged", () => {
    expect(resolveValue("hello", ctx())).toBe("hello");
  });

  it("returns unknown $ root unchanged", () => {
    expect(resolveValue("$unknown.foo", ctx())).toBe("$unknown.foo");
  });
});

describe("Stage 2.1 — resolveParams", () => {
  it("resolves all $ refs in a params object", () => {
    const resolved = resolveParams(
      { id: "$event.userId", method: "GET" },
      ctx(),
    );
    expect(resolved).toEqual({ id: 42, method: "GET" });
  });

  it("returns empty object for undefined params", () => {
    expect(resolveParams(undefined, ctx())).toEqual({});
  });

  it("resolves nested $state reference to object", () => {
    const resolved = resolveParams({ user: "$state.user" }, ctx());
    expect(resolved.user).toEqual({ name: "Alice" });
  });

  it("preserves non-$ string values unchanged", () => {
    const resolved = resolveParams(
      { url: "/api/users", method: "POST" },
      ctx(),
    );
    expect(resolved).toEqual({ url: "/api/users", method: "POST" });
  });
});
