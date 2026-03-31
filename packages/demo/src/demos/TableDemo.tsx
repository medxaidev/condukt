import { useState, useSyncExternalStore } from "react";
import { useDispatch } from "@condukt/react";
import { Modal } from "../components/Modal";
import { tableStore, runtimeStateStore } from "../ui-bridge";

const MOCK_USERS = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Charlie", email: "charlie@example.com" },
];

export function TableDemo() {
  const dispatch = useDispatch();
  const tables = useSyncExternalStore(tableStore.subscribe, tableStore.get);
  const runtimeState = useSyncExternalStore(runtimeStateStore.subscribe, runtimeStateStore.get);
  const reloadCount = tables["userTable"] ?? 0;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const handleRowClick = (userId: number) => {
    setSelectedId(userId);
    dispatch("table.row.click", { row: { id: userId } });
  };

  const handleSave = async () => {
    const user = MOCK_USERS.find((u) => u.id === selectedId);
    await dispatch("user.update", { data: { name: user?.name ?? "Unknown" } });
    setLastUpdated(user?.name ?? "Unknown");
  };

  const selectedUser = MOCK_USERS.find((u) => u.id === selectedId);

  return (
    <>
      <div className="demo-content__header">
        <div className="demo-content__title">DataTable → Detail → Edit → Refresh</div>
        <div className="demo-content__subtitle">
          EXAMPLES.md §4 — Click row to open detail, save triggers: api → modal.close → table.reload → toast
        </div>
      </div>

      <div className="feature-section">
        <div className="feature-section__title">
          User Table
          {reloadCount > 0 && (
            <span className="status-tag status-tag--active" style={{ marginLeft: 8 }}>
              reloaded {reloadCount}x
            </span>
          )}
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button
                    className="btn btn--small btn--info"
                    onClick={() => handleRowClick(user.id)}
                  >
                    View Detail
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show what state.set wrote */}
      {runtimeState["currentUser"] != null && (
        <div className="feature-section">
          <div className="feature-section__title">ctx.state.currentUser (via state.set)</div>
          <div className="result-display">
            {JSON.stringify(runtimeState["currentUser"], null, 2)}
          </div>
        </div>
      )}

      {lastUpdated && (
        <div className="feature-section">
          <div className="info-card info-card--green">
            ✓ User "<strong>{lastUpdated}</strong>" updated → modal closed → table reloaded → toast shown
          </div>
        </div>
      )}

      <div className="feature-section">
        <div className="feature-section__title">Flow Definitions</div>
        <div className="code-block">
          {`on: "table.row.click"\n  → modal.open("detailModal")\n  → api.call GET /api/users/detail\n  → state.set("currentUser", $result)\n\non: "user.update"\n  → api.call PUT /api/users/update\n  → modal.close("detailModal")\n  → table.reload("userTable")\n  → toast.show("User updated!")`}
        </div>
      </div>

      <Modal id="detailModal" title={selectedUser ? `Detail: ${selectedUser.name}` : "User Detail"}>
        {selectedUser && (
          <div>
            <div className="state-panel__row" style={{ marginBottom: 4 }}>
              <span className="state-panel__label">ID</span>
              <span className="state-panel__value">{selectedUser.id}</span>
            </div>
            <div className="state-panel__row" style={{ marginBottom: 4 }}>
              <span className="state-panel__label">Name</span>
              <span className="state-panel__value">{selectedUser.name}</span>
            </div>
            <div className="state-panel__row" style={{ marginBottom: 4 }}>
              <span className="state-panel__label">Email</span>
              <span className="state-panel__value">{selectedUser.email}</span>
            </div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn--success" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </Modal>
    </>
  );
}
