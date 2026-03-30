import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import React from "react";
import { ConduktProvider } from "../provider";
import { useCondukt, useDispatch } from "../hooks";
import { ConduktEngine } from "@condukt/core";

function Wrapper({
  engine,
  children,
}: {
  engine?: ConduktEngine;
  children: React.ReactNode;
}) {
  return <ConduktProvider engine={engine}>{children}</ConduktProvider>;
}

describe("Stage 7.2 — useCondukt", () => {
  it("throws when used outside ConduktProvider", () => {
    function Bad() {
      useCondukt();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(
      "useCondukt must be used inside <ConduktProvider>",
    );
    spy.mockRestore();
  });

  it("returns engine and dispatch inside provider", () => {
    let result: ReturnType<typeof useCondukt> | null = null;
    function Capture() {
      result = useCondukt();
      return null;
    }
    render(
      <Wrapper>
        <Capture />
      </Wrapper>,
    );
    expect(result).not.toBeNull();
    expect(typeof result!.dispatch).toBe("function");
    expect(result!.engine).toBeInstanceOf(ConduktEngine);
  });

  it("dispatch is stable across re-renders", () => {
    const dispatches: Function[] = [];
    function Capture() {
      dispatches.push(useCondukt().dispatch);
      return null;
    }
    const { rerender } = render(
      <Wrapper>
        <Capture />
      </Wrapper>,
    );
    rerender(
      <Wrapper>
        <Capture />
      </Wrapper>,
    );
    expect(dispatches[0]).toBe(dispatches[1]);
  });
});

describe("Stage 7.2 — useDispatch", () => {
  it("returns a function", () => {
    let dispatch: unknown;
    function Capture() {
      dispatch = useDispatch();
      return null;
    }
    render(
      <Wrapper>
        <Capture />
      </Wrapper>,
    );
    expect(typeof dispatch).toBe("function");
  });

  it("calling dispatch invokes engine.dispatch", async () => {
    const engine = new ConduktEngine();
    const spy = vi.spyOn(engine, "dispatch").mockResolvedValue(undefined);

    let dispatch!: ReturnType<typeof useDispatch>;
    function Capture() {
      dispatch = useDispatch();
      return null;
    }
    render(
      <Wrapper engine={engine}>
        <Capture />
      </Wrapper>,
    );

    await act(async () => {
      await dispatch("user.save", { id: 1 });
    });
    expect(spy).toHaveBeenCalledWith("user.save", { id: 1 });
  });

  it("dispatch triggers actual flow execution end-to-end", async () => {
    const engine = new ConduktEngine();
    const called = vi.fn();
    engine.registerEffect("modal.open", async (_ctx, _params) => {
      called();
    });
    engine.registerFlow({
      id: "open-modal",
      trigger: "open.modal",
      steps: [{ effect: "modal.open" }],
    });

    let dispatch!: ReturnType<typeof useDispatch>;
    function Capture() {
      dispatch = useDispatch();
      return null;
    }
    render(
      <Wrapper engine={engine}>
        <Capture />
      </Wrapper>,
    );

    await act(async () => {
      await dispatch("open.modal");
    });
    expect(called).toHaveBeenCalledOnce();
  });
});
