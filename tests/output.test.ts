import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { listarCiudades, mostrarError, mostrarExito, mostrarMensaje } from "../src/presentation/output.ts";
import type { City } from "../src/types/City.ts";

function ciudad(parcial: Partial<City> = {}): City {
  return {
    id: "1",
    name: "Ottawa",
    country: "Canadá",
    latitude: 45.41117,
    longitude: -75.69812,
    ...parcial,
  };
}

afterEach(() => {
  spyOn(console, "log").mockRestore();
  spyOn(console, "error").mockRestore();
});

describe("mostrarMensaje", () => {
  test("imprime el texto tal cual", () => {
    const log = spyOn(console, "log");
    mostrarMensaje("hola");
    expect(log).toHaveBeenCalledWith("hola");
  });
});

describe("mostrarExito", () => {
  test("imprime el texto en verde", () => {
    const log = spyOn(console, "log");
    mostrarExito("listo");
    expect(log).toHaveBeenCalledWith(expect.stringContaining("\u001b[32mlisto\u001b[0m"));
  });
});

describe("mostrarError", () => {
  test("imprime el texto en rojo por console.error", () => {
    const error = spyOn(console, "error");
    mostrarError("falló");
    expect(error).toHaveBeenCalledWith(expect.stringContaining("\u001b[31mfalló\u001b[0m"));
  });
});

describe("listarCiudades", () => {
  test("muestra un aviso cuando no hay ciudades", () => {
    const log = spyOn(console, "log");
    listarCiudades([]);
    expect(log).toHaveBeenCalledWith(expect.stringContaining("No hay ciudades registradas"));
  });

  test("lista las ciudades numeradas incluyendo el país", () => {
    const log = spyOn(console, "log");
    listarCiudades([ciudad(), ciudad({ id: "2", name: "Lima" })]);
    const salida = log.mock.calls.flat().join("\n");
    expect(salida).toContain("1. Ottawa (Canadá)");
    expect(salida).toContain("2. Lima");
  });
});