import { useState } from "react";
import { useDispatch } from "@condukt/react";

type SubmitResult = { valid: boolean; email: string } | null;

export function FormDemo() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<SubmitResult>(null);

  const handleSubmit = async () => {
    const valid = email.includes("@");
    setResult({ valid, email });
    await dispatch("form.submit", { valid, data: { email } });
  };

  return (
    <>
      <div className="demo-content__header">
        <div className="demo-content__title">Form Validation (Conditional)</div>
        <div className="demo-content__subtitle">
          EXAMPLES.md §3 — Conditional branching: valid → api + toast(success), invalid → toast(error)
        </div>
      </div>

      <div className="feature-section">
        <div className="feature-section__title">Form Input</div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="input-label">Email</label>
            <input
              className="input"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter email (must contain "@")'
            />
          </div>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Submit
          </button>
        </div>
        <div className="feature-section__desc" style={{ marginTop: 8 }}>
          Current value: <code>{email || "(empty)"}</code>
          {" · "}Valid: <strong>{email.includes("@") ? "✓ yes" : "✗ no"}</strong>
        </div>
      </div>

      {result && (
        <div className="feature-section">
          <div className="feature-section__title">Submission Result</div>
          <div className={`info-card ${result.valid ? "info-card--green" : "info-card--red"}`}>
            {result.valid
              ? <>✓ "<strong>{result.email}</strong>" submitted → api.call → toast(success)</>
              : <>✗ "<strong>{result.email}</strong>" rejected → toast(error) — missing @ symbol</>
            }
          </div>
        </div>
      )}

      <div className="feature-section">
        <div className="feature-section__title">Flow Definition</div>
        <div className="code-block">
          {`on: "form.submit"\n  if($event.valid == false)\n    → toast.show(error, "Form invalid")\n  if($event.valid == true)\n    → api.call POST /api/forms\n    → toast.show(success, "Form submitted!")`}
        </div>
      </div>
    </>
  );
}
