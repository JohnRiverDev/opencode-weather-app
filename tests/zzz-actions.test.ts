import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { AppState, City } from "../src/types/City.ts";
import type { GeoResult, PronosticoResult } from "../src/types/Weather.ts";

const dirBase = import.meta.dir + "/..";

const mockPreguntar = mock(async () => "");
const mockSeleccionarCiudad = mock<() => Promise<City | null>>(async () => null);
const mockGuardarCiudades = mock(async () => {});
const mockCargarCiudades = mock(async () => []);
const mockGuardarSettings = mock(async () => {});
const mockCargarSettings = mock(async () => ({ unit: "celsius", defaultCityId: null }));
const mockObtenerClima = mock(async () => ({ temperature: 15, symbol: "°C" }));
const mockObtenerPronostico = mock<() => Promise<PronosticoResult>>(async () => ({ symbol: "°C", days: [] }));
const mockBuscarCiudad = mock<() => Promise<GeoResult | null>>(async () => null);

const fakeRl = {
  on() {
    return fakeRl;
  },
  close() {},
};

await mock.module("node:readline", () => ({ createInterface: () => fakeRl }));
await mock.module(`${dirBase}/src/presentation/input.ts`, () => ({
  preguntar: mockPreguntar,
  seleccionarCiudad: mockSeleccionarCiudad,
}));
await mock.module(`${dirBase}/src/storage/citiesStorage.ts`, () => ({
  cargarCiudades: mockCargarCiudades,
  guardarCiudades: mockGuardarCiudades,
}));
await mock.module(`${dirBase}/src/storage/settingsStorage.ts`, () => ({
  cargarSettings: mockCargarSettings,
  guardarSettings: mockGuardarSettings,
}));
await mock.module(`${dirBase}/src/api/weather.ts`, () => ({
  obtenerClima: mockObtenerClima,
  obtenerPronostico: mockObtenerPronostico,
}));
await mock.module(`${dirBase}/src/api/geocoding.ts`, () => ({
  buscarCiudad: mockBuscarCiudad,
}));

const { buscarYAgregar } = await import(`${dirBase}/src/actions/addCity.ts`);
const { climaCiudadDefault, climaTodasLasCiudades } = await import(`${dirBase}/src/actions/getWeather.ts`);
const { eliminarCiudad } = await import(`${dirBase}/src/actions/removeCity.ts`);
const { establecerDefault } = await import(`${dirBase}/src/actions/setDefaultCity.ts`);
const { pronostico7Dias } = await import(`${dirBase}/src/actions/forecast.ts`);
const { alternarUnidad } = await import(`${dirBase}/src/actions/settings.ts`);
const { mostrarListadoCiudades } = await import(`${dirBase}/src/actions/listCities.ts`);

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

function respuestas(...valores: string[]): () => Promise<string> {
  const cola = [...valores];
  return async () => cola.shift() ?? "";
}

function capturarSalida() {
  const log = spyOn(console, "log");
  const error = spyOn(console, "error");
  return {
    log,
    error,
    salida: () => log.mock.calls.flat().join("\n"),
    errores: () => error.mock.calls.flat().join("\n"),
  };
}

beforeEach(() => {
  mockPreguntar.mockClear().mockImplementation(async () => "");
  mockSeleccionarCiudad.mockClear().mockImplementation(async () => null);
  mockGuardarCiudades.mockClear();
  mockCargarCiudades.mockClear();
  mockGuardarSettings.mockClear();
  mockCargarSettings.mockClear();
  mockObtenerClima.mockClear().mockImplementation(async () => ({ temperature: 15, symbol: "°C" }));
  mockObtenerPronostico.mockClear().mockImplementation(async () => ({
    symbol: "°C",
    days: [{ date: "2026-09-16", max: 20, min: 10 }],
  }));
  mockBuscarCiudad.mockClear().mockImplementation(async () => null);
});

afterEach(() => {
  spyOn(console, "log").mockRestore();
  spyOn(console, "error").mockRestore();
});

describe("buscarYAgregar", () => {
  test("ignora un nombre vacío", async () => {
    const captura = capturarSalida();
    await buscarYAgregar(estado());
    expect(mockBuscarCiudad).not.toHaveBeenCalled();
    expect(captura.log).not.toHaveBeenCalled();
  });

  test("muestra el error del servicio de geocoding", async () => {
    mockPreguntar.mockImplementation(respuestas("bogotá"));
    mockBuscarCiudad.mockImplementation(async () => {
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
    mockPreguntar.mockImplementation(respuestas("ciudadfantasma"));
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(captura.errores()).toContain('No se encontró la ciudad "ciudadfantasma"');
    expect(est.cities).toHaveLength(0);
  });

  test("cancela si la confirmación no es 's'", async () => {
    mockPreguntar.mockImplementation(respuestas("ottawa", "n"));
    mockBuscarCiudad.mockImplementation(async () => ({
      name: "Ottawa",
      country: "Canadá",
      latitude: 45.41,
      longitude: -75.7,
    }));
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(captura.salida()).toContain("Operación cancelada");
    expect(est.cities).toHaveLength(0);
    expect(mockGuardarCiudades).not.toHaveBeenCalled();
  });

  test("no registra una ciudad que ya existe", async () => {
    mockPreguntar.mockImplementation(respuestas("ottawa", "s"));
    mockBuscarCiudad.mockImplementation(async () => ({
      name: "Ottawa",
      country: "Canadá",
      latitude: 45.41,
      longitude: -75.7,
    }));
    const captura = capturarSalida();
    const est = estado({ cities: [ciudad()] });
    await buscarYAgregar(est);
    expect(captura.errores()).toContain("ya está registrada");
    expect(est.cities).toHaveLength(1);
    expect(mockGuardarCiudades).not.toHaveBeenCalled();
  });

  test("agrega una ciudad nueva y la guarda", async () => {
    mockPreguntar.mockImplementation(respuestas("medellin", "s"));
    mockBuscarCiudad.mockImplementation(async () => ({
      name: "Medellín",
      country: "Colombia",
      latitude: 6.24,
      longitude: -75.57,
    }));
    const captura = capturarSalida();
    const est = estado();
    await buscarYAgregar(est);
    expect(est.cities).toHaveLength(1);
    expect(est.cities[0]).toMatchObject({ name: "Medellín", latitude: 6.24, longitude: -75.57 });
    expect(typeof est.cities[0]?.id).toBe("string");
    expect(mockGuardarCiudades).toHaveBeenCalledWith(est);
    expect(captura.salida()).toContain('"Medellín" fue agregada correctamente');
  });
});

describe("climaCiudadDefault", () => {
  test("avisa cuando no hay ciudad default", async () => {
    const captura = capturarSalida();
    await climaCiudadDefault(estado());
    expect(captura.salida()).toContain("No hay ciudad default");
    expect(mockObtenerClima).not.toHaveBeenCalled();
  });

  test("muestra el clima de la ciudad default", async () => {
    mockObtenerClima.mockImplementation(async () => ({ temperature: 15, symbol: "°C" }));
    const captura = capturarSalida();
    const c1 = ciudad();
    await climaCiudadDefault(estado({ cities: [c1], defaultCityId: "1" }));
    expect(mockObtenerClima).toHaveBeenCalledWith(c1, "celsius");
    expect(captura.salida()).toContain("Ottawa (Canadá):");
    expect(captura.salida()).toContain("15°C");
  });

  test("reacciona ante un error de la API", async () => {
    mockObtenerClima.mockImplementation(async () => {
      throw new Error("boom");
    });
    const captura = capturarSalida();
    const c1 = ciudad();
    await climaCiudadDefault(estado({ cities: [c1], defaultCityId: "1" }));
    expect(captura.errores()).toContain("Error al obtener el clima de Ottawa (Canadá): boom");
  });
});

describe("climaTodasLasCiudades", () => {
  test("avisa cuando no hay ciudades", async () => {
    const captura = capturarSalida();
    await climaTodasLasCiudades(estado());
    expect(captura.salida()).toContain("No hay ciudades registradas");
    expect(mockObtenerClima).not.toHaveBeenCalled();
  });

  test("consulta el clima de todas las ciudades con la unidad configurada", async () => {
    const captura = capturarSalida();
    const c1 = ciudad();
    const c2 = ciudad({ id: "2", name: "Lima", country: "Perú", latitude: -12.04, longitude: -77.04 });
    await climaTodasLasCiudades(estado({ cities: [c1, c2], unit: "fahrenheit" }));
    expect(mockObtenerClima).toHaveBeenCalledWith(c1, "fahrenheit");
    expect(mockObtenerClima).toHaveBeenCalledWith(c2, "fahrenheit");
    expect(captura.salida()).toContain("Ottawa (Canadá):");
    expect(captura.salida()).toContain("Lima (Perú):");
  });
});

describe("eliminarCiudad", () => {
  test("no elimina nada si la selección se cancela", async () => {
    const est = estado({ cities: [ciudad()] });
    await eliminarCiudad(est);
    expect(est.cities).toHaveLength(1);
    expect(mockGuardarCiudades).not.toHaveBeenCalled();
  });

  test("elimina la ciudad y limpia el default si coinciden", async () => {
    mockSeleccionarCiudad.mockImplementation(async () => ciudad());
    const captura = capturarSalida();
    const c2 = ciudad({ id: "2", name: "Lima", country: "Perú", latitude: -12.04, longitude: -77.04 });
    const est = estado({ cities: [ciudad(), c2], defaultCityId: "1" });
    await eliminarCiudad(est);
    expect(est.cities).toEqual([c2]);
    expect(est.defaultCityId).toBeNull();
    expect(mockGuardarCiudades).toHaveBeenCalledWith(est);
    expect(captura.salida()).toContain('"Ottawa" fue eliminada');
  });

  test("conserva el default cuando se elimina otra ciudad", async () => {
    mockSeleccionarCiudad.mockImplementation(async () => ciudad({ id: "2", name: "Lima" }));
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
    expect(mockSeleccionarCiudad).not.toHaveBeenCalled();
  });

  test("no guarda si la selección se cancela", async () => {
    const est = estado({ cities: [ciudad()] });
    await establecerDefault(est);
    expect(mockGuardarSettings).not.toHaveBeenCalled();
  });

  test("establece la ciudad default y la guarda", async () => {
    mockSeleccionarCiudad.mockImplementation(async () => ciudad({ id: "2", name: "Lima" }));
    const captura = capturarSalida();
    const est = estado({ cities: [ciudad(), ciudad({ id: "2", name: "Lima" })] });
    await establecerDefault(est);
    expect(est.defaultCityId).toBe("2");
    expect(mockGuardarSettings).toHaveBeenCalledWith(est);
    expect(captura.salida()).toContain("Ciudad default establecida: Lima");
  });
});

describe("pronostico7Dias", () => {
  test("no consulta si la selección se cancela", async () => {
    await pronostico7Dias(estado({ cities: [ciudad()] }));
    expect(mockObtenerPronostico).not.toHaveBeenCalled();
  });

  test("muestra el pronóstico formateado", async () => {
    mockSeleccionarCiudad.mockImplementation(async () => ciudad());
    mockObtenerPronostico.mockImplementation(async () => ({
      symbol: "°F",
      days: [
        { date: "2026-09-16", max: 20, min: 10 },
        { date: "2026-09-17", max: 22, min: 12 },
      ],
    }));
    const captura = capturarSalida();
    const c1 = ciudad();
    await pronostico7Dias(estado({ cities: [c1], unit: "fahrenheit" }));
    expect(mockObtenerPronostico).toHaveBeenCalledWith(c1, "fahrenheit");
    expect(captura.salida()).toContain("Pronóstico 7 días de Ottawa (Canadá):");
    expect(captura.salida()).toContain("mín");
    expect(captura.salida()).toContain("máx");
    expect(captura.salida()).toContain("10°F");
    expect(captura.salida()).toContain("20°F");
  });

  test("reacciona ante un error de la API", async () => {
    mockSeleccionarCiudad.mockImplementation(async () => ciudad());
    mockObtenerPronostico.mockImplementation(async () => {
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
    expect(mockGuardarSettings).toHaveBeenCalledWith(est);
    expect(captura.salida()).toContain("Unidad de temperatura: °F");
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