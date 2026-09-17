import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cargarCiudades, guardarCiudades } from "../../src/storage/citiesStorage.ts";
import type { AppState, City } from "../../src/types/City.ts";

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

  test("filtra ciudades inválidas al guardar", async () => {
    const estado: AppState = {
      unit: "celsius",
      cities: [ciudadFixture(), { id: "r", name: "Rota" } as unknown as City],
      defaultCityId: "1",
    };
    await guardarCiudades(estado);
    expect(await cargarCiudades()).toEqual([ciudadFixture()]);
  });
});