import type { AdapterResult } from "../../types";

export type TableAdapter = {
  reload(id: string): Promise<AdapterResult>;
};

export const defaultTableAdapter: TableAdapter = {
  async reload(_id) {
    return { success: true };
  },
};
