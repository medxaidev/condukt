import { describe, it, expect, vi } from "vitest";
import { createToastShowHandler } from "../effects/handlers/toast";
import type { ToastAdapter } from "../effects/adapters/toast-adapter";
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

describe("Stage 5.3 — toast.show", () => {
  it("calls adapter.execute with type and message", async () => {
    const adapter: ToastAdapter = {
      execute: vi.fn().mockResolvedValue({ success: true }),
    };
    await createToastShowHandler(adapter)(makeCtx(), {
      type: "success",
      message: "Saved!",
    });
    expect(adapter.execute).toHaveBeenCalledWith({
      type: "success",
      message: "Saved!",
    });
  });

  it("passes optional duration to adapter", async () => {
    const adapter: ToastAdapter = {
      execute: vi.fn().mockResolvedValue({ success: true }),
    };
    await createToastShowHandler(adapter)(makeCtx(), {
      type: "info",
      message: "Loading",
      duration: 5000,
    });
    expect(adapter.execute).toHaveBeenCalledWith({
      type: "info",
      message: "Loading",
      duration: 5000,
    });
  });

  it("sets ctx.result on success", async () => {
    const adapter: ToastAdapter = {
      execute: vi.fn().mockResolvedValue({ success: true }),
    };
    const ctx = makeCtx();
    await createToastShowHandler(adapter)(ctx, {
      type: "success",
      message: "Ok",
    });
    expect((ctx.result as { success: boolean }).success).toBe(true);
  });

  it("dispatches toast.error on adapter failure", async () => {
    const adapter: ToastAdapter = {
      execute: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "FAIL", message: "x" },
      }),
    };
    const ctx = makeCtx();
    await createToastShowHandler(adapter)(ctx, {
      type: "error",
      message: "Oops",
    });
    expect(ctx.events[0][0]).toBe("toast.error");
  });

  it("does not throw on failure — error becomes event", async () => {
    const adapter: ToastAdapter = {
      execute: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "E", message: "f" },
      }),
    };
    await expect(
      createToastShowHandler(adapter)(makeCtx(), {
        type: "error",
        message: "x",
      }),
    ).resolves.toBeUndefined();
  });
});
