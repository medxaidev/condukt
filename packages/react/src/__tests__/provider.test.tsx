import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConduktProvider } from "../provider";
import { ConduktEngine } from "@condukt/core";
import { useCondukt } from "../hooks";

describe("Stage 7.1 — ConduktProvider", () => {
  it("renders children", () => {
    render(
      <ConduktProvider>
        <span>hello</span>
      </ConduktProvider>,
    );
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("accepts an external engine instance", () => {
    const engine = new ConduktEngine();
    expect(() =>
      render(
        <ConduktProvider engine={engine}>
          <span>ok</span>
        </ConduktProvider>,
      ),
    ).not.toThrow();
  });

  it("creates a default ConduktEngine when no engine prop provided", () => {
    let captured: ConduktEngine | null = null;
    function Capture() {
      captured = useCondukt().engine;
      return null;
    }
    render(
      <ConduktProvider>
        <Capture />
      </ConduktProvider>,
    );
    expect(captured).toBeInstanceOf(ConduktEngine);
  });

  it("does not recreate engine across re-renders", () => {
    const engines: ConduktEngine[] = [];
    function Capture() {
      engines.push(useCondukt().engine);
      return null;
    }
    const { rerender } = render(
      <ConduktProvider>
        <Capture />
      </ConduktProvider>,
    );
    rerender(
      <ConduktProvider>
        <Capture />
      </ConduktProvider>,
    );
    expect(engines[0]).toBe(engines[1]);
  });

  it("external engine is used as-is (not wrapped)", () => {
    const engine = new ConduktEngine();
    let captured: ConduktEngine | null = null;
    function Capture() {
      captured = useCondukt().engine;
      return null;
    }
    render(
      <ConduktProvider engine={engine}>
        <Capture />
      </ConduktProvider>,
    );
    expect(captured).toBe(engine);
  });
});
