import { useSyncExternalStore } from "react";
import { toastStore, type ToastItem } from "../ui-bridge";

const typeIcons: Record<ToastItem["type"], string> = {
  success: "\u2713",
  error: "\u2717",
  warning: "\u26a0",
  info: "\u2139",
};

export function ToastContainer() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.get);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span style={{ marginRight: 8 }}>{typeIcons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
