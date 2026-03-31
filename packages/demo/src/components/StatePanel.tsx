import { useSyncExternalStore } from "react";
import { modalStore, tableStore, logStore, runtimeStateStore, engineInfoStore } from "../ui-bridge";
import { FlowLog } from "./FlowLog";

export function StatePanel() {
  const modals = useSyncExternalStore(modalStore.subscribe, modalStore.get);
  const tables = useSyncExternalStore(tableStore.subscribe, tableStore.get);
  const logs = useSyncExternalStore(logStore.subscribe, logStore.get);
  const runtimeState = useSyncExternalStore(runtimeStateStore.subscribe, runtimeStateStore.get);
  const info = useSyncExternalStore(engineInfoStore.subscribe, engineInfoStore.get);

  const openModals = Object.values(modals).filter((m) => m.open);

  return (
    <div className="state-panel">
      {/* Engine Info */}
      <div className="state-panel__section">
        <div className="state-panel__title">Engine</div>
        <div className="state-panel__row">
          <span className="state-panel__label">Flows</span>
          <span className="state-panel__value state-panel__value--accent">
            {info.flowCount}
          </span>
        </div>
        <div className="state-panel__row">
          <span className="state-panel__label">Effects</span>
          <span className="state-panel__value state-panel__value--accent">
            {info.effectCount}
          </span>
        </div>
      </div>

      {/* Runtime State (ctx.state) */}
      <div className="state-panel__section">
        <div className="state-panel__title">Runtime State</div>
        {Object.keys(runtimeState).length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
            Empty — trigger a flow with state.set to see data here
          </div>
        ) : (
          Object.entries(runtimeState).map(([key, val]) => (
            <div key={key} className="state-panel__row">
              <span className="state-panel__label">{key}</span>
              <span className="state-panel__value" style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Active Modules */}
      <div className="state-panel__section">
        <div className="state-panel__title">Active Modules</div>
        <div className="state-panel__row">
          <span className="state-panel__label">Open Modals</span>
          <span className={`state-panel__value ${openModals.length > 0 ? "state-panel__value--warning" : ""}`}>
            {openModals.length > 0
              ? openModals.map((m) => m.id).join(", ")
              : "—"}
          </span>
        </div>
        {Object.entries(tables).map(([id, count]) => (
          <div key={id} className="state-panel__row">
            <span className="state-panel__label">Table: {id}</span>
            <span className="state-panel__value">
              reloaded {count}x
            </span>
          </div>
        ))}
      </div>

      {/* Execution Log */}
      <div className="state-panel__section">
        <div className="state-panel__title">
          Execution Log ({logs.length})
        </div>
        <FlowLog />
      </div>
    </div>
  );
}
