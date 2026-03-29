import type { AdapterResult } from "../../types";

export type ToastParams = {
  type: "success" | "error" | "warning" | "info";
  message: string;
  duration?: number;
};

export type ToastAdapter = {
  execute(params: ToastParams): Promise<AdapterResult>;
};

export const defaultToastAdapter: ToastAdapter = {
  async execute(_params) {
    return { success: true };
  },
};
