import { afterEach, describe, expect, spyOn, test } from "bun:test";
import type { Mock } from "bun:test";
import { mostrarMenu } from "../../src/presentation/menu.ts";
import type { AppState, City } from "../../src/types/City.ts";

function estado(parcial: Partial<AppState> = {}): AppState {
  return {
    unit: "celsius",
    cities: [],
    defaultCityId: null,
    ...parcial,
  };
}

function ciudad(): City {
  return { id: "1", name: "Ottawa", country: "Canadá", latitude: 45.41, longitude: -75.7 };
}

function salidaDelMenu(log: Mock<(...args: any[]) => any>): string {
  return log.mock.calls.flat().join("\n");
}

afterEach(() => {
  spyOn(console, "log").mockRestore();
});

describe("mostrarMenu", () => {
  test("muestra el título de la aplicación", () => {
    const log = spyOn(console, "log");
    mostrarMenu(estado());
    expect(salidaDelMenu(log)).toContain("WEATHER CLI");
  });

  test("incluye todas las opciones", () => {
    const log = spyOn(console, "log");
    mostrarMenu(estado());
    const salida = salidaDelMenu(log);
    expect(salida).toContain("1. Clima de ciudad default");
    expect(salida).toContain("2. Clima de todas las ciudades");
    expect(salida).toContain("3. Buscar y agregar ciudad");
    expect(salida).toContain("4. Eliminar ciudad");
    expect(salida).toContain("5. Establecer ciudad default");
    expect(salida).toContain("6. Pronóstico 7 días");
    expect(salida).toContain("8. Ajustes");
    expect(salida).toContain("9. Salir");
  });

  test("muestra el contador de ciudades", () => {
    const log = spyOn(console, "log");
    mostrarMenu(estado({ cities: [ciudad(), ciudad()] }));
    expect(salidaDelMenu(log)).toContain("2. Clima de todas las ciudades (2)");
  });

  test("refleja la unidad configurada", () => {
    const log = spyOn(console, "log");
    mostrarMenu(estado({ unit: "fahrenheit" }));
    expect(salidaDelMenu(log)).toContain("8. Ajustes (°F)");
  });
});