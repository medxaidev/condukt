import type { EffectHandler, ExecutionContext } from "../../types";
import type { ModalAdapter } from "../adapters/modal-adapter";
import { defaultModalAdapter } from "../adapters/modal-adapter";

export function createModalOpenHandler(
  adapter: ModalAdapter = defaultModalAdapter,
): EffectHandler {
  return async (
    ctx: ExecutionContext,
    rawParams: Record<string, unknown> = {},
  ) => {
    const { id, ...props } = rawParams as { id: string; [k: string]: unknown };
    const result = await adapter.open(
      id,
      Object.keys(props).length ? props : undefined,
    );
    ctx.result = result;
    if (!result.success) await ctx.dispatch("modal.error", result.error);
  };
}

export function createModalCloseHandler(
  adapter: ModalAdapter = defaultModalAdapter,
): EffectHandler {
  return async (
    ctx: ExecutionContext,
    rawParams: Record<string, unknown> = {},
  ) => {
    const { id } = rawParams as { id: string };
    const result = await adapter.close(id);
    ctx.result = result;
    if (!result.success) await ctx.dispatch("modal.error", result.error);
  };
}
