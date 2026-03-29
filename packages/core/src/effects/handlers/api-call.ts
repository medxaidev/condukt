import type { EffectHandler, ExecutionContext } from "../../types";
import type { ApiAdapter, ApiCallParams } from "../adapters/api-adapter";
import { defaultApiAdapter } from "../adapters/api-adapter";

export function createApiCallHandler(
  adapter: ApiAdapter = defaultApiAdapter,
): EffectHandler {
  return async (
    ctx: ExecutionContext,
    rawParams: Record<string, unknown> = {},
  ) => {
    const params = rawParams as ApiCallParams;
    const result = await adapter.execute(params);
    ctx.result = result;
    if (!result.success) {
      await ctx.dispatch("api.error", result.error);
    } else {
      await ctx.dispatch("api.success", result.data);
    }
  };
}
