import type { ExecutionContext } from "../types";

/**
 * Resolves a single value against execution context.
 * $event.x  → ctx.event.x
 * $state.x  → ctx.state.x
 * $result.x → ctx.result.x
 * non-string / non-$ → returned as-is
 */
export function resolveValue(value: unknown, ctx: ExecutionContext): unknown {
  if (typeof value !== "string" || !value.startsWith("$")) return value;

  const [root, ...path] = value.slice(1).split(".");
  let current: unknown;

  switch (root) {
    case "event":
      current = ctx.event;
      break;
    case "state":
      current = ctx.state;
      break;
    case "result":
      current = ctx.result;
      break;
    default:
      return value; // unknown root — return unchanged
  }

  for (const key of path) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Resolves all values in a params record.
 * Non-$ values are preserved as-is.
 */
export function resolveParams(
  params: Record<string, unknown> | undefined,
  ctx: ExecutionContext,
): Record<string, unknown> {
  if (!params) return {};
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, resolveValue(v, ctx)]),
  );
}
