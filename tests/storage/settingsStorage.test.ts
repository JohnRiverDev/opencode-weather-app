import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cargarSettings, guardarSettings } from "../../src/storage/settingsStorage.ts";
import { cargarEstado, guardarEstado } from "../../src/storage/stateStorage.ts";
import type { AppState, City } from "../../src/types/City.ts";

const cwdOriginal = process.cwd();
const directoriosTemporales: string[] = [];

function ciudadFixture(): City {
  return {
    id: "1",
    name: "Ottawa",
    country: "Canadá",
    latitude: 45.41117,
    longitude: -75.69812,
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

describe("cargarSettings / guardarSettings", () => {
  test("guarda la unidad y la lee al cargar", async () => {
    const estado = {
      unit: "fahrenheit",
      cities: [],
      defaultCityId: null,
    } as AppState;
    await guardarSettings(estado);
    expect((await cargarEstado()).unit).toBe("fahrenheit");
  });

  test("sanea la unidad inválida a celsius", async () => {
    const estado = {
      unit: "kelvin",
      cities: [],
      defaultCityId: null,
    } as unknown as AppState;
    await guardarSettings(estado);
    expect((await cargarEstado()).unit).toBe("celsius");
  });

  test("conserva la ciudad default válida", async () => {
    const estado = {
      unit: "celsius",
      cities: [],
      defaultCityId: "abc",
    } as AppState;
    await guardarSettings(estado);
    expect((await cargarEstado()).defaultCityId).toBe("abc");
  });

  test("sanea la ciudad default inválida a null", async () => {
    const estado = {
      unit: "celsius",
      cities: [],
      defaultCityId: 7,
    } as unknown as AppState;
    await guardarSettings(estado);
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