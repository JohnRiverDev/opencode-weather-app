import { describe, expect, test } from "bun:test";
import type { City } from "../../src/types/City.ts";
import type { MenuOption } from "../../src/types/MenuOption.ts";
import type { Unit } from "../../src/types/Unit.ts";
import type { ForecastResult, GeoResult, PronosticoDia, PronosticoResult } from "../../src/types/Weather.ts";

function ciudad(): City {
  return { id: "1", name: "Ottawa", country: "Canadá", latitude: 45.41, longitude: -75.7 };
}

describe("tipos del dominio", () => {
  test("las interfaces de City compilan y forman AppState", () => {
    const estado: import("../../src/types/City.ts").AppState = {
      unit: "celsius",
      cities: [ciudad()],
      defaultCityId: "1",
    };
    expect(estado.cities[0]?.name).toBe("Ottawa");
    expect(estado.unit).toBe("celsius");
  });

  test("Unit solo admite celsius y fahrenheit", () => {
    const unidad: Unit = "fahrenheit";
    expect(unidad).toBe("fahrenheit");
  });

  test("MenuOption tiene key y label", () => {
    const opcion: MenuOption = { key: "1", label: "Salir" };
    expect(opcion.key).toBe("1");
  });

  test("los tipos de clima y pronóstico compilan", () => {
    const geo: GeoResult = { name: "Ottawa", latitude: 1, longitude: 2 };
    const actual: ForecastResult = { temperature: 15, symbol: "°C" };
    const dia: PronosticoDia = { date: "2026-09-16", max: 20, min: 10 };
    const pronostico: PronosticoResult = { symbol: "°C", days: [dia] };
    expect(geo.name).toBe("Ottawa");
    expect(actual.temperature).toBe(15);
    expect(pronostico.days).toHaveLength(1);
  });
});