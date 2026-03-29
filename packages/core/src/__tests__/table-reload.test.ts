import { describe, it, expect, vi } from "vitest";
import { createTableReloadHandler } from "../effects/handlers/table-reload";
import type { TableAdapter } from "../effects/adapters/table-adapter";
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

describe("Stage 5.5 — table.reload", () => {
  it("calls adapter.reload with table id", async () => {
    const adapter: TableAdapter = {
      reload: vi.fn().mockResolvedValue({ success: true }),
    };
    await createTableReloadHandler(adapter)(makeCtx(), { id: "users-table" });
    expect(adapter.reload).toHaveBeenCalledWith("users-table");
  });

  it("sets ctx.result to success result", async () => {
    const ctx = makeCtx();
    await createTableReloadHandler({
      reload: vi.fn().mockResolvedValue({ success: true }),
    })(ctx, { id: "orders" });
    expect((ctx.result as { success: boolean }).success).toBe(true);
  });

  it("dispatches table.error on failure", async () => {
    const adapter: TableAdapter = {
      reload: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "FAIL", message: "x" },
      }),
    };
    const ctx = makeCtx();
    await createTableReloadHandler(adapter)(ctx, { id: "t" });
    expect(ctx.events[0][0]).toBe("table.error");
  });

  it("does not throw on failure", async () => {
    const adapter: TableAdapter = {
      reload: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "E", message: "x" },
      }),
    };
    await expect(
      createTableReloadHandler(adapter)(makeCtx(), { id: "t" }),
    ).resolves.toBeUndefined();
  });
});
