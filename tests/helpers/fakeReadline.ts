import { mock } from "bun:test";

type Handler = (...args: unknown[]) => void;

const handlers = new Map<string, Handler>();

const fakeRl = {
  on(evento: string, cb: Handler) {
    handlers.set(evento, cb);
    return fakeRl;
  },
  close() {
    handlers.get("close")?.();
  },
};

mock.module("node:readline", () => ({
  createInterface: () => fakeRl,
}));

export function emitLine(texto: string): void {
  handlers.get("line")?.(texto);
}

export function emitClose(): void {
  fakeRl.close();
}