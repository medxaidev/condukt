import type { ExecutionContext } from "../types";
import { resolveValue } from "./resolver";

/**
 * Evaluates a string boolean expression against execution context.
 *
 * Supported forms:
 *   $x == y       equality (loose)
 *   $x != y       inequality
 *   $x > y        numeric greater-than
 *   $x < y        numeric less-than
 *   $x >= y       numeric >=
 *   $x <= y       numeric <=
 *   !$x           negation (truthy check)
 *   $x            bare truthy check
 */
export function evaluateCondition(
  expr: string,
  ctx: ExecutionContext,
): boolean {
  const trimmed = expr.trim();

  if (trimmed.startsWith("!")) {
    return !evaluateCondition(trimmed.slice(1), ctx);
  }

  for (const op of ["==", "!=", ">=", "<=", ">", "<"] as const) {
    const idx = trimmed.indexOf(op);
    if (idx === -1) continue;

    const left = trimmed.slice(0, idx).trim();
    const right = trimmed.slice(idx + op.length).trim();
    const lVal = resolveValue(left, ctx);
    const rVal = parseRhs(right, ctx);

    // eslint-disable-next-line eqeqeq
    if (op === "==") return lVal == rVal;
    // eslint-disable-next-line eqeqeq
    if (op === "!=") return lVal != rVal;
    if (op === ">") return (lVal as number) > (rVal as number);
    if (op === "<") return (lVal as number) < (rVal as number);
    if (op === ">=") return (lVal as number) >= (rVal as number);
    if (op === "<=") return (lVal as number) <= (rVal as number);
  }

  return Boolean(resolveValue(trimmed, ctx));
}

function parseRhs(raw: string, ctx: ExecutionContext): unknown {
  if (raw.startsWith("$")) return resolveValue(raw, ctx);
  if (raw === "null") return null;
  if (raw === "undefined") return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  const n = Number(raw);
  if (!Number.isNaN(n)) return n;
  if (/^["'].*["']$/.test(raw)) return raw.slice(1, -1);
  return raw;
}
