import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, mock, spyOn, test, type Mock } from "bun:test";
import type { AppState, City } from "../../src/types/City.ts";
import { emitLine } from "../helpers/fakeReadline.ts";

const dirBase = import.meta.dir + "/../..";
const cwdOriginal = process.cwd();

const { buscarYAgregar } = await import(`${dirBase}/src/actions/addCity.ts`);
const { climaCiudadDefault, climaTodasLasCiudades } = await import(`${dirBase}/src/actions/getWeather.ts`);
const { eliminarCiudad } = await import(`${dirBase}/src/actions/removeCity.ts`);
const { establecerDefault } = await import(`${dirBase}/src/actions/setDefaultCity.ts`);
const { pronostico7Dias } = await import(`${dirBase}/src/actions/forecast.ts`);
const { alternarUnidad } = await import(`${dirBase}/src/actions/settings.ts`);
const { mostrarListadoCiudades } = await import(`${dirBase}/src/actions/listCities.ts`);

type HandlerFetch = (url: URL) => Response | Promise<Response>;
const fetchOriginal = globalThis.fetch;
let fetchMock: Mock<(input: string | URL | Request) => Promise<Response>>;

function jsonResponse(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), { status });
}

function mockFetch(handler: HandlerFetch): void {
  fetchMock = mock(async (input: string | URL | Request) => handler(new URL(String(input))));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
}

function urlLlamada(indice = 0): URL {
  return new URL(String(fetchMock.mock.calls[indice]?.[0]));
}

let dirTemp: string;

beforeEach(() => {
  dirTemp = fs.mkdtempSync(path.join(os.tmpdir(), "weather-actions-"));
  process.chdir(dirTemp);
  mockFetch(() => jsonResponse({}));
  spyOn(process.stdout, "write").mockImplementation(() => true);
});

afterEach(() => {
  globalThis.fetch = fetchOriginal;
  spyOn(console, "log").mockRestore();
  spyOn(console, "error").mockRestore();
  spyOn(process.stdout, "write").mockRestore();
  process.chdir(cwdOriginal);
  fs.rmSync(dirTemp, { recursive: true, force: true });
});

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

function estado(parcial: Partial<AppState> = {}): AppState {
  return {
    unit: "celsius",
    cities: [],
    defaultCityId: null,
    ...parcial,
  };
}

function capturarSalida() {
  const log = spyOn(console, "log").mockImplementation(() => {});
  const error = spyOn(console, "error").mockImplementation(() => {});
  return {
    log,
    error,
    salida: () => log.mock.calls.flat().join("\n"),
    errores: () => error.mock.calls.flat().join("\n"),
  };
}

async function existeArchivoEstado(): Promise<boolean> {
  return Bun.file("weather-state.json").exists();
}

async function leerEstado(): Promise<AppState> {
  return (await Bun.file("weather-state.json").json()) as AppState;
}

const respuestaGeocoding = () =>
  jsonResponse({
    results: [{ name: "Ottawa", country: "Canadá", latitude: 45.41, longitude: -75.7 }],
  });

describe("buscarYAgregar", () => {
  test("ignora un nombre vacío", async () => {
    emitLine("");
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(captura.log).not.toHaveBeenCalled();
  });

  test("muestra el error del servicio de geocoding", async () => {
    emitLine("bogotá");
    mockFetch(async () => {
      throw new Error("red caída");
    });
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(captura.errores()).toContain('Error al buscar "bogotá"');
    expect(captura.errores()).toContain("red caída");
    expect(est.cities).toHaveLength(0);
  });

  test("avisa cuando no encuentra la ciudad", async () => {
    emitLine("ciudadfantasma");
    mockFetch(() => jsonResponse({ results: [] }));
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(captura.errores()).toContain('No se encontró la ciudad "ciudadfantasma"');
    expect(est.cities).toHaveLength(0);
  });

  test("cancela si la confirmación no es 's'", async () => {
    emitLine("ottawa");
    emitLine("n");
    mockFetch(respuestaGeocoding);
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(captura.salida()).toContain("Operación cancelada");
    expect(est.cities).toHaveLength(0);
    expect(await existeArchivoEstado()).toBe(false);
  });

  test("no registra una ciudad que ya existe", async () => {
    emitLine("ottawa");
    emitLine("s");
    mockFetch(respuestaGeocoding);
    const captura = capturarSalida();
    const est = estado({ cities: [ciudad()] });
    await buscarYAgregar(est);
    expect(captura.errores()).toContain("ya está registrada");
    expect(est.cities).toHaveLength(1);
    expect(await existeArchivoEstado()).toBe(false);
  });

  test("agrega una ciudad nueva y la guarda", async () => {
    emitLine("medellin");
    emitLine("s");
    mockFetch(() =>
      jsonResponse({
        results: [{ name: "Medellín", country: "Colombia", latitude: 6.24, longitude: -75.57 }],
      })
    );
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(urlLlamada().searchParams.get("name")).toBe("medellin");
    expect(est.cities).toHaveLength(1);
    expect(est.cities[0]).toMatchObject({ name: "Medellín", latitude: 6.24, longitude: -75.57 });
    expect(typeof est.cities[0]?.id).toBe("string");
    expect(captura.salida()).toContain('"Medellín" fue agregada correctamente');
    const archivo = await leerEstado();
    expect(archivo.cities).toHaveLength(1);
    expect(archivo.cities[0]).toMatchObject({ name: "Medellín", latitude: 6.24, longitude: -75.57 });
  });
});

describe("climaCiudadDefault", () => {
  test("avisa cuando no hay ciudad default", async () => {
    const captura = capturarSalida();
    await climaCiudadDefault(estado());
    expect(captura.salida()).toContain("No hay ciudad default");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("muestra el clima de la ciudad default", async () => {
    mockFetch(() => jsonResponse({ current: { temperature_2m: 15 }, current_units: { temperature_2m: "°C" } }));
    const captura = capturarSalida();
    const c1 = ciudad();
    await climaCiudadDefault(estado({ cities: [c1], defaultCityId: "1" }));
    expect(urlLlamada().searchParams.get("latitude")).toBe("45.41");
    expect(urlLlamada().searchParams.get("current")).toBe("temperature_2m");
    expect(captura.salida()).toContain("Ottawa (Canadá):");
    expect(captura.salida()).toContain("15°C");
  });

  test("reacciona ante un error de la API", async () => {
    mockFetch(async () => {
      throw new Error("boom");
    });
    const captura = capturarSalida();
    await climaCiudadDefault(estado({ cities: [ciudad()], defaultCityId: "1" }));
    expect(captura.errores()).toContain("Error al obtener el clima de Ottawa (Canadá): boom");
  });
});

describe("climaTodasLasCiudades", () => {
  test("avisa cuando no hay ciudades", async () => {
    const captura = capturarSalida();
    await climaTodasLasCiudades(estado());
    expect(captura.salida()).toContain("No hay ciudades registradas");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("consulta el clima de todas las ciudades con la unidad configurada", async () => {
    mockFetch(() => jsonResponse({ current: { temperature_2m: 15 }, current_units: { temperature_2m: "°F" } }));
    const captura = capturarSalida();
    const c1 = ciudad();
    const c2 = ciudad({ id: "2", name: "Lima", country: "Perú", latitude: -12.04, longitude: -77.04 });
    await climaTodasLasCiudades(estado({ cities: [c1, c2], unit: "fahrenheit" }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(urlLlamada(0).searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(urlLlamada(1).searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(urlLlamada(1).searchParams.get("latitude")).toBe("-12.04");
    expect(captura.salida()).toContain("Ottawa (Canadá):");
    expect(captura.salida()).toContain("Lima (Perú):");
    expect(captura.salida()).toContain("15°F");
  });
});

describe("eliminarCiudad", () => {
  test("no elimina nada si la selección se cancela", async () => {
    emitLine("  ");
    capturarSalida();
    const est = estado({ cities: [ciudad()] });
    await eliminarCiudad(est);
    expect(est.cities).toHaveLength(1);
    expect(await existeArchivoEstado()).toBe(false);
  });

  test("elimina la ciudad y limpia el default si coinciden", async () => {
    emitLine("1");
    const captura = capturarSalida();
    const c2 = ciudad({ id: "2", name: "Lima", country: "Perú", latitude: -12.04, longitude: -77.04 });
    const est = estado({ cities: [ciudad(), c2], defaultCityId: "1" });
    await eliminarCiudad(est);
    expect(est.cities).toEqual([c2]);
    expect(est.defaultCityId).toBeNull();
    expect(captura.salida()).toContain('"Ottawa" fue eliminada');
    const archivo = await leerEstado();
    expect(archivo.cities).toHaveLength(1);
    expect(archivo.cities[0]).toMatchObject({ id: "2" });
    expect(archivo.defaultCityId).toBeNull();
  });

  test("conserva el default cuando se elimina otra ciudad", async () => {
    emitLine("2");
    capturarSalida();
    const est = estado({ cities: [ciudad(), ciudad({ id: "2", name: "Lima" })], defaultCityId: "1" });
    await eliminarCiudad(est);
    expect(est.defaultCityId).toBe("1");
  });
});

describe("establecerDefault", () => {
  test("avisa cuando no hay ciudades", async () => {
    const captura = capturarSalida();
    await establecerDefault(estado());
    expect(captura.salida()).toContain("No hay ciudades registradas");
  });

  test("no guarda si la selección se cancela", async () => {
    emitLine("  ");
    capturarSalida();
    const est = estado({ cities: [ciudad()] });
    await establecerDefault(est);
    expect(est.defaultCityId).toBeNull();
    expect(await existeArchivoEstado()).toBe(false);
  });

  test("establece la ciudad default y la guarda", async () => {
    emitLine("2");
    const captura = capturarSalida();
    const est = estado({ cities: [ciudad(), ciudad({ id: "2", name: "Lima" })] });
    await establecerDefault(est);
    expect(est.defaultCityId).toBe("2");
    expect(captura.salida()).toContain("Ciudad default establecida: Lima");
    const archivo = await leerEstado();
    expect(archivo.defaultCityId).toBe("2");
  });
});

describe("pronostico7Dias", () => {
  test("no consulta si la selección se cancela", async () => {
    emitLine("  ");
    capturarSalida();
    await pronostico7Dias(estado({ cities: [ciudad()] }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("muestra el pronóstico formateado", async () => {
    emitLine("1");
    mockFetch(() =>
      jsonResponse({
        daily: {
          time: ["2026-09-16", "2026-09-17"],
          temperature_2m_max: [20, 22],
          temperature_2m_min: [10, 12],
        },
        daily_units: { temperature_2m_max: "°F" },
      })
    );
    const captura = capturarSalida();
    await pronostico7Dias(estado({ cities: [ciudad()], unit: "fahrenheit" }));
    expect(urlLlamada().searchParams.get("temperature_unit")).toBe("fahrenheit");
    expect(urlLlamada().searchParams.get("daily")).toBe("temperature_2m_max,temperature_2m_min");
    expect(captura.salida()).toContain("Pronóstico 7 días de Ottawa (Canadá):");
    expect(captura.salida()).toContain("mín");
    expect(captura.salida()).toContain("máx");
    expect(captura.salida()).toContain("10°F");
    expect(captura.salida()).toContain("20°F");
  });

  test("reacciona ante un error de la API", async () => {
    emitLine("1");
    mockFetch(async () => {
      throw new Error("sin datos");
    });
    const captura = capturarSalida();
    await pronostico7Dias(estado({ cities: [ciudad()] }));
    expect(captura.errores()).toContain("Error al obtener el pronóstico de Ottawa (Canadá): sin datos");
  });
});

describe("alternarUnidad", () => {
  test("alterna de celsius a fahrenheit y guarda", async () => {
    const captura = capturarSalida();
    const est = estado({ unit: "celsius" });
    await alternarUnidad(est);
    expect(est.unit).toBe("fahrenheit");
    expect(captura.salida()).toContain("Unidad de temperatura: °F");
    const archivo = await leerEstado();
    expect(archivo.unit).toBe("fahrenheit");
  });

  test("alterna de fahrenheit a celsius", async () => {
    const captura = capturarSalida();
    const est = estado({ unit: "fahrenheit" });
    await alternarUnidad(est);
    expect(est.unit).toBe("celsius");
    expect(captura.salida()).toContain("Unidad de temperatura: °C");
  });
});

describe("mostrarListadoCiudades", () => {
  test("delega en listarCiudades", () => {
    const captura = capturarSalida();
    mostrarListadoCiudades(estado({ cities: [ciudad()] }));
    expect(captura.salida()).toContain("1. Ottawa (Canadá)");
  });
});