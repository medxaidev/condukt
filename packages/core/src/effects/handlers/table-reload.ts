import type { EffectHandler, ExecutionContext } from "../../types";
import type { TableAdapter } from "../adapters/table-adapter";
import { defaultTableAdapter } from "../adapters/table-adapter";

export function createTableReloadHandler(
  adapter: TableAdapter = defaultTableAdapter,
): EffectHandler {
  return async (
    ctx: ExecutionContext,
    rawParams: Record<string, unknown> = {},
  ) => {
    const { id } = rawParams as { id: string };
    const result = await adapter.reload(id);
    ctx.result = result;
    if (!result.success) await ctx.dispatch("table.error", result.error);
  };
}
