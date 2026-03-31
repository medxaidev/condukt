/**
 * Engine setup — Creates a ConduktEngine with custom adapters that bridge
 * to the UI store, registers all demo flows from EXAMPLES.md.
 */
import {
  ConduktEngine,
  createApiCallHandler,
  createModalOpenHandler,
  createModalCloseHandler,
  createToastShowHandler,
  stateSetHandler,
  createTableReloadHandler,
  type ApiAdapter,
  type ModalAdapter,
  type ToastAdapter,
  type TableAdapter,
  type Observer,
} from "@condukt/core";
import { addToast, openModal, closeModal, reloadTable, addLog, runtimeStateStore, engineInfoStore } from "./ui-bridge";

// ---------------------------------------------------------------------------
// Custom Adapters — bridge effects → UI store
// ---------------------------------------------------------------------------

const apiAdapter: ApiAdapter = {
  async execute(params) {
    addLog("effect", `api.call → ${params.method ?? "GET"} ${params.url}`);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 600));
    // Simulate success for demo (fail if url contains "fail")
    if (params.url?.includes("fail")) {
      return {
        success: false,
        error: { code: "API_ERROR", message: `Request to ${params.url} failed` },
      };
    }
    return { success: true, data: { id: 1, saved: true, url: params.url } };
  },
};

const modalAdapter: ModalAdapter = {
  async open(id, props) {
    addLog("effect", `modal.open → "${id}"`);
    openModal(id, props);
    return { success: true };
  },
  async close(id) {
    addLog("effect", `modal.close → "${id}"`);
    closeModal(id);
    return { success: true };
  },
};

const toastAdapter: ToastAdapter = {
  async execute(params) {
    addLog("effect", `toast.show → [${params.type}] ${params.message}`);
    addToast(params.type, params.message);
    return { success: true };
  },
};

const tableAdapter: TableAdapter = {
  async reload(id) {
    addLog("effect", `table.reload → "${id}"`);
    reloadTable(id);
    return { success: true };
  },
};

// ---------------------------------------------------------------------------
// Observer — logs flow/step lifecycle to the log store
// ---------------------------------------------------------------------------

const demoObserver: Observer = {
  onFlowStart: (flow) => {
    addLog("flow:start", `▶ Flow "${flow.trigger}" started`);
  },
  onFlowEnd: (flow, ctx) => {
    addLog("flow:end", `✓ Flow "${flow.trigger}" completed`);
    // Sync ctx.state into the UI store so StatePanel can display it
    runtimeStateStore.set({ ...ctx.state });
  },
  onStepStart: (step, index) => {
    const label = step.type === "effect" ? step.effect : `condition(${step.if})`;
    addLog("step:start", `  Step ${index}: ${label}`);
  },
  onStepEnd: (_step, index) => {
    addLog("step:end", `  Step ${index}: done`);
  },
  onError: (error, _step, _ctx) => {
    addLog("error", `✗ Error: ${String(error)}`);
  },
};

// ---------------------------------------------------------------------------
// Create and configure engine
// ---------------------------------------------------------------------------

export function createDemoEngine(): ConduktEngine {
  const engine = new ConduktEngine();

  // Register effects with custom adapters
  engine.registerEffect("api.call", createApiCallHandler(apiAdapter));
  engine.registerEffect("modal.open", createModalOpenHandler(modalAdapter));
  engine.registerEffect("modal.close", createModalCloseHandler(modalAdapter));
  engine.registerEffect("toast.show", createToastShowHandler(toastAdapter));
  engine.registerEffect("state.set", stateSetHandler);
  engine.registerEffect("table.reload", createTableReloadHandler(tableAdapter));

  // Add observer
  engine.addObserver(demoObserver);

  // ---------------------------------------------------------------------------
  // Register demo flows — from EXAMPLES.md
  // ---------------------------------------------------------------------------

  // §2 Open user modal (all behavior goes through Condukt)
  engine.registerFlow({
    id: "openUserModalFlow",
    on: "user.modal.open",
    steps: [
      { action: "modal.open", params: { id: "userModal" } },
    ],
  });

  // §2 Save → Modal → Toast + table reload
  engine.registerFlow({
    id: "saveUserFlow",
    on: "user.save",
    steps: [
      {
        action: "api.call",
        params: { url: "/api/users", method: "POST", body: "$event.formData" },
      },
      { action: "modal.close", params: { id: "userModal" } },
      { action: "table.reload", params: { id: "userTable" } },
      {
        action: "toast.show",
        params: { type: "success", message: "Saved successfully" },
      },
    ],
  });

  // §3 Form Validation (conditional)
  engine.registerFlow({
    id: "submitForm",
    on: "form.submit",
    steps: [
      {
        if: "$event.valid == false",
        then: [
          {
            action: "toast.show",
            params: { type: "error", message: "Form invalid — please check fields" },
          },
        ],
      },
      {
        if: "$event.valid == true",
        then: [
          {
            action: "api.call",
            params: { url: "/api/forms", method: "POST", body: "$event.data" },
          },
          {
            action: "toast.show",
            params: { type: "success", message: "Form submitted!" },
          },
        ],
      },
    ],
  });

  // §4 Table row click → open modal + fetch detail + state.set
  engine.registerFlow({
    id: "tableRowClickFlow",
    on: "table.row.click",
    steps: [
      { action: "modal.open", params: { id: "detailModal" } },
      {
        action: "api.call",
        params: { url: "/api/users/detail", method: "GET" },
      },
      { action: "state.set", params: { key: "currentUser", value: "$result" } },
    ],
  });

  // §4 Save from detail → api → close modal → table reload → toast
  engine.registerFlow({
    id: "saveFromDrawer",
    on: "user.update",
    steps: [
      {
        action: "api.call",
        params: { url: "/api/users/update", method: "PUT", body: "$event.data" },
      },
      { action: "modal.close", params: { id: "detailModal" } },
      { action: "table.reload", params: { id: "userTable" } },
      {
        action: "toast.show",
        params: { type: "success", message: "User updated!" },
      },
    ],
  });

  // §5 Cross-flow chaining via domain events
  // user.save.and.notify dispatches a domain event "user.saved" after api success,
  // which triggers a separate flow for table reload.
  engine.registerFlow({
    id: "saveAndNotifyFlow",
    on: "user.save.and.notify",
    steps: [
      {
        action: "api.call",
        params: { url: "/api/users", method: "POST", body: "$event.data" },
      },
    ],
  });

  // The api.call handler auto-dispatches api.success on success.
  // This domain flow listens to api.success and refreshes the table.
  // NOTE: In production, prefer domain-specific events like "user.saved"
  // over generic "api.success" to avoid global pollution.
  engine.registerFlow({
    id: "onApiSuccessRefresh",
    on: "api.success",
    steps: [
      { action: "table.reload", params: { id: "userTable" } },
      {
        action: "toast.show",
        params: { type: "info", message: "Cross-flow: table refreshed via api.success event" },
      },
    ],
  });

  // §6 Error handling: api.error → toast
  engine.registerFlow({
    id: "errorHandlerFlow",
    on: "api.error",
    steps: [
      {
        action: "toast.show",
        params: { type: "error", message: "API request failed" },
      },
    ],
  });

  // Error scenario: intentional API failure
  engine.registerFlow({
    id: "saveFailFlow",
    on: "user.save.fail",
    steps: [
      {
        action: "api.call",
        params: { url: "/api/fail", method: "POST" },
      },
    ],
  });

  // Publish engine metadata to UI store
  engineInfoStore.set({ flowCount: 9, effectCount: 6 });

  return engine;
}
