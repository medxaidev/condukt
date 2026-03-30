import { createContext } from "react";
import type { ConduktEngine } from "@condukt/core";

export type ConduktContextValue = {
  engine: ConduktEngine;
  dispatch: (event: string, payload?: unknown) => Promise<void>;
};

export const ConduktContext = createContext<ConduktContextValue | null>(null);
