import type { Step, ExecutionContext, Flow } from "./types";

export type ObserverHooks = {
  onFlowStart?: (flow: Flow, ctx: ExecutionContext) => void;
  onFlowEnd?: (flow: Flow, ctx: ExecutionContext) => void;
  onStepStart?: (step: Step, index: number, ctx: ExecutionContext) => void;
  onStepEnd?: (step: Step, index: number, ctx: ExecutionContext) => void;
  onError?: (error: unknown, step: Step, ctx: ExecutionContext) => void;
};

export type Observer = ObserverHooks;

export class ObserverBus {
  private observers: Observer[] = [];

  add(observer: Observer): void {
    this.observers.push(observer);
  }

  notifyFlowStart(flow: Flow, ctx: ExecutionContext): void {
    for (const o of this.observers) o.onFlowStart?.(flow, ctx);
  }

  notifyFlowEnd(flow: Flow, ctx: ExecutionContext): void {
    for (const o of this.observers) o.onFlowEnd?.(flow, ctx);
  }

  notifyStepStart(step: Step, index: number, ctx: ExecutionContext): void {
    for (const o of this.observers) o.onStepStart?.(step, index, ctx);
  }

  notifyStepEnd(step: Step, index: number, ctx: ExecutionContext): void {
    for (const o of this.observers) o.onStepEnd?.(step, index, ctx);
  }

  notifyError(error: unknown, step: Step, ctx: ExecutionContext): void {
    for (const o of this.observers) o.onError?.(error, step, ctx);
  }
}
