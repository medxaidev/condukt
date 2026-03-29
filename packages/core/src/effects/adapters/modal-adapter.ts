import type { AdapterResult } from "../../types";

export type ModalAdapter = {
  open(id: string, props?: Record<string, unknown>): Promise<AdapterResult>;
  close(id: string): Promise<AdapterResult>;
};

export const defaultModalAdapter: ModalAdapter = {
  async open(_id, _props) {
    return { success: true };
  },
  async close(_id) {
    return { success: true };
  },
};
