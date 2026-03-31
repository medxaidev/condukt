import { useContext, useCallback, useState } from "react";
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

/**
 * Enhanced dispatch hook that tracks pending state.
 * Returns [dispatch, isPending] — isPending is true while any dispatched flow is executing.
 */
export function useConduktDispatch() {
  const { dispatch } = useCondukt();
  const [isPending, setIsPending] = useState(false);

  const wrappedDispatch = useCallback(
    async (event: string, payload?: unknown) => {
      setIsPending(true);
      try {
        await dispatch(event, payload);
      } finally {
        setIsPending(false);
      }
    },
    [dispatch],
  );

  return [wrappedDispatch, isPending] as const;
}
