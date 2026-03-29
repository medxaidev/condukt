import { describe, it, expect, vi } from "vitest";
import { createApiCallHandler } from "../effects/handlers/api-call";
import type { ApiAdapter } from "../effects/adapters/api-adapter";
import type { ExecutionContext, AdapterResult } from "../types";

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

function makeAdapter(result: AdapterResult<unknown>): ApiAdapter {
  return { execute: vi.fn().mockResolvedValue(result) };
}

describe("Stage 5.1 — api.call", () => {
  it("calls adapter.execute with resolved params", async () => {
    const adapter = makeAdapter({ success: true, data: {} });
    await createApiCallHandler(adapter)(makeCtx(), {
      url: "/api/users",
      method: "GET",
    });
    expect(adapter.execute).toHaveBeenCalledWith({
      url: "/api/users",
      method: "GET",
    });
  });

  it("sets ctx.result to adapter result on success", async () => {
    const adapter = makeAdapter({ success: true, data: { id: 1 } });
    const ctx = makeCtx();
    await createApiCallHandler(adapter)(ctx, { url: "/api/x" });
    expect(ctx.result).toEqual({ success: true, data: { id: 1 } });
  });

  it("dispatches api.success event on success", async () => {
    const adapter = makeAdapter({ success: true, data: { ok: true } });
    const ctx = makeCtx();
    await createApiCallHandler(adapter)(ctx, { url: "/api/x" });
    expect(ctx.events[0]).toEqual(["api.success", { ok: true }]);
  });

  it("dispatches api.error event on failure", async () => {
    const adapter = makeAdapter({
      success: false,
      error: { code: "404", message: "Not found" },
    });
    const ctx = makeCtx();
    await createApiCallHandler(adapter)(ctx, { url: "/api/missing" });
    expect(ctx.events[0][0]).toBe("api.error");
  });

  it("sets ctx.result on failure (not thrown)", async () => {
    const adapter = makeAdapter({
      success: false,
      error: { code: "500", message: "Server error" },
    });
    const ctx = makeCtx();
    await createApiCallHandler(adapter)(ctx, { url: "/api/fail" });
    expect((ctx.result as { success: boolean }).success).toBe(false);
  });

  it("returns Promise<void> — never throws", async () => {
    const adapter = makeAdapter({
      success: false,
      error: { code: "ERR", message: "x" },
    });
    await expect(
      createApiCallHandler(adapter)(makeCtx(), { url: "/x" }),
    ).resolves.toBeUndefined();
  });
});
