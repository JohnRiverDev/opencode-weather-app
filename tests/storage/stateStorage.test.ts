import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  cargarEstado,
  crearEstadoInicial,
  esCiudadGuardada,
  guardarEstado,
} from "../../src/storage/stateStorage.ts";
import type { AppState, City } from "../../src/types/City.ts";
import { STATE_FILE } from "../../src/utils/constants.ts";

const cwdOriginal = process.cwd();
const directoriosTemporales: string[] = [];

function ciudadFixture(parcial: Partial<City> = {}): City {
  return {
    id: "1",
    name: "Ottawa",
    country: "Canadá",
    latitude: 45.41117,
    longitude: -75.69812,
    ...parcial,
  };
}

beforeEach(async () => {
  const dir = await mkdtemp(join(tmpdir(), "weather-test-"));
  directoriosTemporales.push(dir);
  process.chdir(dir);
});

afterAll(async () => {
  process.chdir(cwdOriginal);
  await Promise.all(directoriosTemporales.map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("crearEstadoInicial", () => {
  test("devuelve celsius, sin ciudades y sin default", () => {
    expect(crearEstadoInicial()).toEqual({
      unit: "celsius",
      cities: [],
      defaultCityId: null,
    });
  });
});

describe("esCiudadGuardada", () => {
  test("acepta una ciudad válida", () => {
    expect(esCiudadGuardada(ciudadFixture())).toBe(true);
  });

  test("rechaza null y no-objetos", () => {
    expect(esCiudadGuardada(null)).toBe(false);
    expect(esCiudadGuardada(undefined)).toBe(false);
    expect(esCiudadGuardada("Ottawa")).toBe(false);
    expect(esCiudadGuardada(42)).toBe(false);
  });

  test("rechaza objetos incompletos", () => {
    expect(esCiudadGuardada({ id: "1" })).toBe(false);
    expect(esCiudadGuardada({ id: "1", name: "Ottawa" })).toBe(false);
  });

  test("rechaza tipos erróneos en los campos", () => {
    expect(esCiudadGuardada({ id: "1", name: "Ottawa", latitude: "x", longitude: -75 })).toBe(false);
    expect(esCiudadGuardada({ id: 1, name: "Ottawa", latitude: 45, longitude: -75 })).toBe(false);
  });
});

describe("cargarEstado", () => {
  test("devuelve el estado inicial si no existe el archivo", async () => {
    const estado = await cargarEstado();
    expect(estado).toEqual(crearEstadoInicial());
  });

  test("devuelve el estado inicial si el JSON es inválido", async () => {
    await Bun.write(STATE_FILE, "no es json");
    const estado = await cargarEstado();
    expect(estado).toEqual(crearEstadoInicial());
  });

  test("filtra ciudades inválidas y sanea la unidad", async () => {
    const malo = { id: "x", name: "Roto" };
    await Bun.write(
      STATE_FILE,
      JSON.stringify({
        unit: "kelvin",
        cities: [ciudadFixture(), malo],
        defaultCityId: 42,
      }),
    );
    const estado = await cargarEstado();
    expect(estado.unit).toBe("celsius");
    expect(estado.cities).toEqual([ciudadFixture()]);
    expect(estado.defaultCityId).toBeNull();
  });

  test("carga un estado guardado de forma completa", async () => {
    const estado: AppState = {
      unit: "fahrenheit",
      cities: [ciudadFixture()],
      defaultCityId: "1",
    };
    await guardarEstado(estado);
    expect(await cargarEstado()).toEqual(estado);
  });
});

describe("guardarEstado", () => {
  test("persiste el estado en el archivo", async () => {
    const estado: AppState = {
      unit: "fahrenheit",
      cities: [ciudadFixture({ id: "abc" })],
      defaultCityId: null,
    };
    await guardarEstado(estado);
    const raw = JSON.parse(await Bun.file(STATE_FILE).text());
    expect(raw).toEqual(estado);
  });
});