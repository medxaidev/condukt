import { describe, it, expect } from "vitest";
import { DefaultEffectRegistry } from "../registry";
import type { EffectHandler } from "../types";

const noop: EffectHandler = async (_ctx, _params) => {};

describe("Stage 4.1 — DefaultEffectRegistry", () => {
  it("registers and retrieves a handler by name", () => {
    const reg = new DefaultEffectRegistry();
    reg.register("toast.show", noop);
    expect(reg.get("toast.show")).toBe(noop);
  });

  it("has() returns true for registered, false for unknown", () => {
    const reg = new DefaultEffectRegistry();
    reg.register("modal.open", noop);
    expect(reg.has("modal.open")).toBe(true);
    expect(reg.has("modal.close")).toBe(false);
  });

  it("has() is the correct way to check existence before get()", () => {
    const reg = new DefaultEffectRegistry();
    reg.register("api.call", noop);
    expect(reg.has("api.call")).toBe(true);
    expect(reg.has("unknown")).toBe(false);
  });

  it("overwrites handler on re-registration with same name", () => {
    const reg = new DefaultEffectRegistry();
    const first: EffectHandler = async (_ctx, _params) => {};
    const second: EffectHandler = async (_ctx, _params) => {};
    reg.register("api.call", first);
    reg.register("api.call", second);
    expect(reg.get("api.call")).toBe(second);
  });

  it("supports multiple independent registrations", () => {
    const reg = new DefaultEffectRegistry();
    const h1: EffectHandler = async (_ctx, _params) => {};
    const h2: EffectHandler = async (_ctx, _params) => {};
    reg.register("modal.open", h1);
    reg.register("toast.show", h2);
    expect(reg.get("modal.open")).toBe(h1);
    expect(reg.get("toast.show")).toBe(h2);
  });
});
