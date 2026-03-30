import { useContext } from "react";
import { ConduktContext } from "./context";

export function useCondukt() {
  const ctx = useContext(ConduktContext);
  if (!ctx) {
    throw new Error("useCondukt must be used inside <ConduktProvider>");
  }
  return ctx;
}

export function useDispatch() {
  return useCondukt().dispatch;
}
