import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  cargarCiudades,
  guardarCiudades,
} from "../src/storage/citiesStorage.ts";
import {
  cargarSettings,
  guardarSettings,
} from "../src/storage/settingsStorage.ts";
import {
  cargarEstado,
  crearEstadoInicial,
  esCiudadGuardada,
  guardarEstado,
} from "../src/storage/stateStorage.ts";
import type { AppState, City } from "../src/types/City.ts";
import { STATE_FILE } from "../src/utils/constants.ts";

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
    expect(esCiudadGuardada(ciudadFixture() as unknown as Record<string, unknown>)).toBe(true);
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

describe("cargarCiudades / guardarCiudades", () => {
  test("carga solo las ciudades persistidas", async () => {
    const estado: AppState = {
      unit: "celsius",
      cities: [ciudadFixture(), ciudadFixture({ id: "2", name: "Lima" })],
      defaultCityId: "1",
    };
    await guardarCiudades(estado);
    expect(await cargarCiudades()).toEqual(estado.cities);
  });
});

describe("cargarSettings / guardarSettings", () => {
  test("guardarSettings sanea unidad inválida a celsius", async () => {
    const estado = {
      unit: "fahrenheit",
      cities: [],
      defaultCityId: null,
    } as AppState;
    await guardarSettings(estado);
    const guardado = await cargarEstado();
    expect(guardado.unit).toBe("fahrenheit");

    const estadoRoto = { ...estado, unit: "kelvin" } as unknown as AppState;
    await guardarSettings(estadoRoto);
    expect((await cargarEstado()).unit).toBe("celsius");
  });

  test("guardarSettings sanea defaultCityId inválido a null", async () => {
    const estado = {
      unit: "celsius",
      cities: [],
      defaultCityId: "abc",
    } as AppState;
    await guardarSettings(estado);
    expect((await cargarEstado()).defaultCityId).toBe("abc");

    const estadoRoto = { ...estado, defaultCityId: 7 } as unknown as AppState;
    await guardarSettings(estadoRoto);
    expect((await cargarEstado()).defaultCityId).toBeNull();
  });

  test("cargarSettings devuelve la unidad y la ciudad default", async () => {
    const estado: AppState = {
      unit: "celsius",
      cities: [ciudadFixture()],
      defaultCityId: "1",
    };
    await guardarEstado(estado);
    expect(await cargarSettings()).toEqual({ unit: "celsius", defaultCityId: "1" });
  });
});