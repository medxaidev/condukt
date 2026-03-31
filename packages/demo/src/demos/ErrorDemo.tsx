import { useState } from "react";
import { useDispatch } from "@condukt/react";

type LastAction = { type: "error" | "cross-flow"; timestamp: number } | null;

export function ErrorDemo() {
  const dispatch = useDispatch();
  const [lastAction, setLastAction] = useState<LastAction>(null);

  const handleFail = async () => {
    setLastAction({ type: "error", timestamp: Date.now() });
    await dispatch("user.save.fail");
  };

  const handleCrossFlow = async () => {
    setLastAction({ type: "cross-flow", timestamp: Date.now() });
    await dispatch("user.save.and.notify", { data: { name: "Test" } });
  };

  return (
    <>
      <div className="demo-content__header">
        <div className="demo-content__title">Error Handling & Cross-Flow Chaining</div>
        <div className="demo-content__subtitle">
          EXAMPLES.md §5 & §6 — Errors are events, not exceptions. Cross-flow: one effect dispatches an event that triggers another flow.
        </div>
      </div>

      <div className="feature-section">
        <div className="feature-section__title">Actions</div>
        <div className="feature-section__actions">
          <button className="btn btn--danger" onClick={handleFail}>
            Trigger API Failure
          </button>
          <button className="btn btn--primary" onClick={handleCrossFlow}>
            Cross-Flow: Save & Auto Refresh
          </button>
        </div>
      </div>

      {lastAction && (
        <div className="feature-section">
          <div className="feature-section__title">Last Triggered</div>
          {lastAction.type === "error" ? (
            <div className="info-card info-card--red">
              ✗ API failure triggered → api.call(/api/fail) returned error
              → handler dispatched <strong>api.error</strong> event
              → errorHandlerFlow ran → toast("API request failed")
            </div>
          ) : (
            <div className="info-card info-card--blue">
              ✓ Cross-flow triggered → api.call succeeded
              → handler dispatched <strong>api.success</strong> event
              → onApiSuccessRefresh flow ran → table.reload + toast("table refreshed")
            </div>
          )}
        </div>
      )}

      <div className="feature-section">
        <div className="feature-section__title">Flow Definitions</div>
        <div className="code-block">
          {`# Error path\non: "user.save.fail"\n  → api.call POST /api/fail   (simulated failure)\n  → [handler auto-dispatches "api.error"]\n\non: "api.error"\n  → toast.show(error, "API request failed")\n\n# Cross-flow path\non: "user.save.and.notify"\n  → api.call POST /api/users\n  → [handler auto-dispatches "api.success"]\n\non: "api.success"\n  → table.reload("userTable")\n  → toast.show(info, "Cross-flow: table refreshed")`}
        </div>
      </div>
    </>
  );
}
