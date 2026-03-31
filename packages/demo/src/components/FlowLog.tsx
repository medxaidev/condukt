import { useSyncExternalStore } from "react";
import { logStore, type LogEntry } from "../ui-bridge";

const typeClassMap: Record<LogEntry["type"], string> = {
  "flow:start": "event-item--flow-start",
  "flow:end": "event-item--flow-end",
  "step:start": "event-item--step-start",
  "step:end": "event-item--step-end",
  effect: "event-item--effect",
  error: "event-item--error",
  event: "event-item--event",
};

export function FlowLog() {
  const logs = useSyncExternalStore(logStore.subscribe, logStore.get);

  return (
    <>
      {logs.length === 0 ? (
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          No events yet. Trigger a flow from the center panel.
        </div>
      ) : (
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {logs.map((entry) => (
            <div key={entry.id} className={`event-item ${typeClassMap[entry.type]}`}>
              {entry.message}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
