/**
 * UI Bridge — Observable store connecting Condukt effects to React state.
 *
 * Effects write to this store via adapters.
 * React components subscribe to changes via useSyncExternalStore.
 */

export type ToastItem = {
  id: number;
  type: "success" | "error" | "warning" | "info";
  message: string;
};

export type ModalState = {
  id: string;
  open: boolean;
  props?: Record<string, unknown>;
};

export type LogEntry = {
  id: number;
  timestamp: number;
  type: "flow:start" | "flow:end" | "step:start" | "step:end" | "effect" | "error" | "event";
  message: string;
};

type Listener = () => void;

function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<Listener>();

  return {
    get: () => state,
    set: (next: T) => {
      state = next;
      listeners.forEach((l) => l());
    },
    update: (fn: (prev: T) => T) => {
      state = fn(state);
      listeners.forEach((l) => l());
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

let _nextToastId = 0;
let _nextLogId = 0;

export type EngineInfo = {
  flowCount: number;
  effectCount: number;
};

export const toastStore = createStore<ToastItem[]>([]);
export const modalStore = createStore<Record<string, ModalState>>({});
export const logStore = createStore<LogEntry[]>([]);
export const tableStore = createStore<Record<string, number>>({});
export const runtimeStateStore = createStore<Record<string, unknown>>({});
export const engineInfoStore = createStore<EngineInfo>({ flowCount: 0, effectCount: 0 });

export function addToast(type: ToastItem["type"], message: string) {
  const id = ++_nextToastId;
  toastStore.update((prev) => [...prev, { id, type, message }]);
  setTimeout(() => {
    toastStore.update((prev) => prev.filter((t) => t.id !== id));
  }, 3000);
}

export function openModal(id: string, props?: Record<string, unknown>) {
  modalStore.update((prev) => ({ ...prev, [id]: { id, open: true, props } }));
}

export function closeModal(id: string) {
  modalStore.update((prev) => ({ ...prev, [id]: { id, open: false } }));
}

export function reloadTable(id: string) {
  tableStore.update((prev) => ({
    ...prev,
    [id]: (prev[id] ?? 0) + 1,
  }));
}

export function addLog(
  type: LogEntry["type"],
  message: string,
) {
  const id = ++_nextLogId;
  logStore.update((prev) => [
    { id, timestamp: Date.now(), type, message },
    ...prev,
  ].slice(0, 100));
}
