import { describe, it, expect, vi } from "vitest";
import {
  createModalOpenHandler,
  createModalCloseHandler,
} from "../effects/handlers/modal";
import type { ModalAdapter } from "../effects/adapters/modal-adapter";
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

function makeAdapter(): ModalAdapter {
  return {
    open: vi.fn().mockResolvedValue({ success: true }),
    close: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe("Stage 5.2 — modal.open", () => {
  it("calls adapter.open with modal id", async () => {
    const adapter = makeAdapter();
    await createModalOpenHandler(adapter)(makeCtx(), { id: "user-form" });
    expect(adapter.open).toHaveBeenCalledWith("user-form", undefined);
  });

  it("passes extra props to adapter.open", async () => {
    const adapter = makeAdapter();
    await createModalOpenHandler(adapter)(makeCtx(), {
      id: "confirm",
      title: "Delete?",
    });
    expect(adapter.open).toHaveBeenCalledWith("confirm", { title: "Delete?" });
  });

  it("sets ctx.result to adapter result", async () => {
    const ctx = makeCtx();
    await createModalOpenHandler(makeAdapter())(ctx, { id: "x" });
    expect((ctx.result as { success: boolean }).success).toBe(true);
  });

  it("dispatches modal.error on failure", async () => {
    const adapter: ModalAdapter = {
      open: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "ERR", message: "x" },
      }),
      close: vi.fn(),
    };
    const ctx = makeCtx();
    await createModalOpenHandler(adapter)(ctx, { id: "bad" });
    expect(ctx.events[0][0]).toBe("modal.error");
  });
});

describe("Stage 5.2 — modal.close", () => {
  it("calls adapter.close with modal id", async () => {
    const adapter = makeAdapter();
    await createModalCloseHandler(adapter)(makeCtx(), { id: "user-form" });
    expect(adapter.close).toHaveBeenCalledWith("user-form");
  });

  it("sets ctx.result to adapter result", async () => {
    const ctx = makeCtx();
    await createModalCloseHandler(makeAdapter())(ctx, { id: "x" });
    expect((ctx.result as { success: boolean }).success).toBe(true);
  });

  it("dispatches modal.error on failure", async () => {
    const adapter: ModalAdapter = {
      open: vi.fn(),
      close: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "ERR", message: "fail" },
      }),
    };
    const ctx = makeCtx();
    await createModalCloseHandler(adapter)(ctx, { id: "y" });
    expect(ctx.events[0][0]).toBe("modal.error");
  });
});
