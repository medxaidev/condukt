import type { EffectHandler, ExecutionContext } from "../../types";
import type { ToastAdapter, ToastParams } from "../adapters/toast-adapter";
import { defaultToastAdapter } from "../adapters/toast-adapter";

export function createToastShowHandler(
  adapter: ToastAdapter = defaultToastAdapter,
): EffectHandler {
  return async (
    ctx: ExecutionContext,
    rawParams: Record<string, unknown> = {},
  ) => {
    const params = rawParams as ToastParams;
    const result = await adapter.execute(params);
    ctx.result = result;
    if (!result.success) await ctx.dispatch("toast.error", result.error);
  };
}
