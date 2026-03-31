import { useSyncExternalStore, type ReactNode } from "react";
import { modalStore } from "../ui-bridge";

type ModalProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function Modal({ id, title, children }: ModalProps) {
  const modals = useSyncExternalStore(modalStore.subscribe, modalStore.get);
  const state = modals[id];

  if (!state?.open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
