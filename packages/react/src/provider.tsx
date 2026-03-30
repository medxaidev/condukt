import { useMemo, type ReactNode } from "react";
import { ConduktEngine } from "@condukt/core";
import { ConduktContext } from "./context";

type ConduktProviderProps = {
  engine?: ConduktEngine;
  children: ReactNode;
};

export function ConduktProvider({
  engine: externalEngine,
  children,
}: ConduktProviderProps) {
  // empty dep array is intentional: engine is treated as stable for the
  // lifetime of the provider. If externalEngine changes, create a new
  // <ConduktProvider> instance rather than swapping the prop.
  const engine = useMemo(
    () => externalEngine ?? new ConduktEngine(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const value = useMemo(
    () => ({
      engine,
      dispatch: (event: string, payload?: unknown) =>
        engine.dispatch(event, payload),
    }),
    [engine],
  );

  return (
    <ConduktContext.Provider value={value}>{children}</ConduktContext.Provider>
  );
}
