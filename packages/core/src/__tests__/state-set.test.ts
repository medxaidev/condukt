import { describe, it, expect } from "vitest";
import { stateSetHandler } from "../effects/handlers/state-set";
import type { ExecutionContext } from "../types";

type TestCtx = ExecutionContext & { events: [string, unknown][] };

function makeCtx(): TestCtx {
  const events: [string, unknown][] = [];
  return {
    event: {},
    state: {},
    dispatch: async (e, p) => {
      events.push([e, p]);
    },
    events,
  };
}

describe("Stage 5.4 — state.set", () => {
  it("sets a key on ctx.state", async () => {
    const ctx = makeCtx();
    await stateSetHandler(ctx, { key: "username", value: "Alice" });
    expect(ctx.state["username"]).toBe("Alice");
  });

  it("overwrites an existing state key", async () => {
    const ctx = makeCtx();
    ctx.state["count"] = 3;
    await stateSetHandler(ctx, { key: "count", value: 5 });
    expect(ctx.state["count"]).toBe(5);
  });

  it("sets ctx.result to { success: true }", async () => {
    const ctx = makeCtx();
    await stateSetHandler(ctx, { key: "x", value: true });
    expect(ctx.result).toEqual({ success: true });
  });

  it("dispatches state.error when key is not a string", async () => {
    const ctx = makeCtx();
    await stateSetHandler(ctx, { key: 42 as unknown as string, value: "v" });
    expect(ctx.events[0][0]).toBe("state.error");
  });

  it("stores object values", async () => {
    const ctx = makeCtx();
    await stateSetHandler(ctx, { key: "user", value: { id: 1, name: "Bob" } });
    expect(ctx.state["user"]).toEqual({ id: 1, name: "Bob" });
  });

  it("stores null (explicit clear)", async () => {
    const ctx = makeCtx();
    await stateSetHandler(ctx, { key: "session", value: null });
    expect(ctx.state["session"]).toBeNull();
  });
});
