import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { AppState, City } from "../src/types/City.ts";

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

await mock.module("node:readline", () => ({
  createInterface: () => fakeRl,
}));

const { preguntar, seleccionarCiudad } = await import("../src/presentation/input.ts");

function emitLine(texto: string): void {
  handlers.get("line")?.(texto);
}

function ciudad(parcial: Partial<City> = {}): City {
  return {
    id: "1",
    name: "Ottawa",
    country: "Canadá",
    latitude: 45.41,
    longitude: -75.7,
    ...parcial,
  };
}

function estadoCiudades(ciudades: City[]): AppState {
  return { unit: "celsius", cities: ciudades, defaultCityId: null };
}

afterEach(() => {
  spyOn(console, "log").mockRestore();
  spyOn(console, "error").mockRestore();
  spyOn(process.stdout, "write").mockRestore();
});

describe("preguntar", () => {
  test("escribe el prompt en stdout", async () => {
    const write = spyOn(process.stdout, "write");
    const p = preguntar("  Selecciona: ");
    fakeRl.close();
    await p;
    expect(write).toHaveBeenCalledWith("  Selecciona: ");
  });

  test("devuelve la línea ya encolada recortada", async () => {
    emitLine("  ottawa  ");
    expect(await preguntar("prompt: ")).toBe("ottawa");
  });

  test("resuelve con la línea emitida después de preguntar", async () => {
    const p = preguntar("prompt: ");
    emitLine("medellin");
    expect(await p).toBe("medellin");
  });

  test("resuelve con cadena vacía si se cierra la interfaz", async () => {
    const p = preguntar("prompt: ");
    fakeRl.close();
    expect(await p).toBe("");
  });
});

describe("seleccionarCiudad", () => {
  test("devuelve null y avisa si no hay ciudades", async () => {
    const log = spyOn(console, "log");
    const resultado = await seleccionarCiudad(estadoCiudades([]), "Elige");
    expect(resultado).toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("No hay ciudades registradas"));
  });

  test("devuelve null si se cancela con una línea vacía", async () => {
    const log = spyOn(console, "log");
    const promesa = seleccionarCiudad(estadoCiudades([ciudad()]), "Elige");
    emitLine("  ");
    expect(await promesa).toBeNull();
    expect(log).toHaveBeenCalledWith(expect.stringContaining("Operación cancelada"));
  });

  test("devuelve null si la selección no es válida", async () => {
    const error = spyOn(console, "error");
    const promesa = seleccionarCiudad(estadoCiudades([ciudad()]), "Elige");
    emitLine("abc");
    expect(await promesa).toBeNull();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Selección no válida"));
  });

  test("devuelve null si el índice está fuera de rango", async () => {
    const error = spyOn(console, "error");
    const promesa = seleccionarCiudad(estadoCiudades([ciudad()]), "Elige");
    emitLine("5");
    expect(await promesa).toBeNull();
    expect(error).toHaveBeenCalled();
  });

  test("devuelve la ciudad seleccionada", async () => {
    const ciudades = [ciudad(), ciudad({ id: "2", name: "Lima" })];
    const promesa = seleccionarCiudad(estadoCiudades(ciudades), "Elige");
    emitLine("2");
    const resultado = await promesa;
    expect(resultado).not.toBeNull();
    expect(resultado?.id).toBe("2");
    expect(resultado?.name).toBe("Lima");
  });
});