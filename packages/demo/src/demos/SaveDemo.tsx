import { useState } from "react";
import { useDispatch } from "@condukt/react";
import { Modal } from "../components/Modal";

export function SaveDemo() {
  const dispatch = useDispatch();
  const [name, setName] = useState("John Doe");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSave = async () => {
    await dispatch("user.save", { formData: { name } });
    setLastSaved(name);
  };

  return (
    <>
      <div className="demo-content__header">
        <div className="demo-content__title">Save → Modal → Toast</div>
        <div className="demo-content__subtitle">
          EXAMPLES.md §2 — Open modal, edit data, save triggers: api.call → modal.close → table.reload → toast
        </div>
      </div>

      <div className="feature-section">
        <div className="feature-section__title">Actions</div>
        <div className="feature-section__actions">
          <button className="btn btn--primary" onClick={() => dispatch("user.modal.open")}>
            Open User Modal
          </button>
        </div>
      </div>

      {lastSaved && (
        <div className="feature-section">
          <div className="feature-section__title">Last Saved Result</div>
          <div className="info-card info-card--green">
            ✓ User "<strong>{lastSaved}</strong>" saved successfully via api.call → modal closed → toast shown
          </div>
        </div>
      )}

      <div className="feature-section">
        <div className="feature-section__title">Flow Definition</div>
        <div className="code-block">
          {`on: "user.modal.open" → modal.open("userModal")\n\non: "user.save"\n  → api.call POST /api/users\n  → modal.close("userModal")\n  → table.reload("userTable")\n  → toast.show("Saved successfully")`}
        </div>
      </div>

      <Modal id="userModal" title="Edit User">
        <div>
          <label className="input-label">Name</label>
          <input
            className="input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn btn--success" onClick={handleSave}>
            Save
          </button>
        </div>
      </Modal>
    </>
  );
}
