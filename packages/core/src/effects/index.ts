export { createApiCallHandler } from "./handlers/api-call";
export {
  createModalOpenHandler,
  createModalCloseHandler,
} from "./handlers/modal";
export { createToastShowHandler } from "./handlers/toast";
export { stateSetHandler } from "./handlers/state-set";
export { createTableReloadHandler } from "./handlers/table-reload";

export type { ApiAdapter, ApiCallParams } from "./adapters/api-adapter";
export type { ModalAdapter } from "./adapters/modal-adapter";
export type { ToastAdapter, ToastParams } from "./adapters/toast-adapter";
export type { TableAdapter } from "./adapters/table-adapter";

import type { ConduktEngine } from "../engine";
import { createApiCallHandler } from "./handlers/api-call";
import {
  createModalOpenHandler,
  createModalCloseHandler,
} from "./handlers/modal";
import { createToastShowHandler } from "./handlers/toast";
import { stateSetHandler } from "./handlers/state-set";
import { createTableReloadHandler } from "./handlers/table-reload";

/**
 * Register all built-in effects on a ConduktEngine instance.
 * Adapters default to their default implementations.
 */
export function registerBuiltinEffects(engine: ConduktEngine): void {
  engine.registerEffect("api.call", createApiCallHandler());
  engine.registerEffect("modal.open", createModalOpenHandler());
  engine.registerEffect("modal.close", createModalCloseHandler());
  engine.registerEffect("toast.show", createToastShowHandler());
  engine.registerEffect("state.set", stateSetHandler);
  engine.registerEffect("table.reload", createTableReloadHandler());
}
