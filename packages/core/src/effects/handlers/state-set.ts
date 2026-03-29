import type { EffectHandler, ExecutionContext } from "../../types";

export const stateSetHandler: EffectHandler = async (
  ctx: ExecutionContext,
  rawParams: Record<string, unknown> = {},
) => {
  const { key, value } = rawParams as { key: string; value: unknown };
  if (typeof key !== "string" || key.length === 0) {
    await ctx.dispatch("state.error", {
      message: "state.set requires a non-empty string key",
    });
    return;
  }
  ctx.state[key] = value;
  ctx.result = { success: true };
};
