import { afterAll, describe, expect, mock, test } from "bun:test";
import { buscarCiudad } from "../src/api/geocoding.ts";
import { obtenerClima, obtenerPronostico } from "../src/api/weather.ts";
import type { City } from "../src/types/City.ts";
import { FORECAST_URL, GEOCODING_URL } from "../src/utils/constants.ts";

const fetchOriginal = globalThis.fetch;

function mockFetch(impl: (url: string | URL, init?: RequestInit) => Promise<Response>): typeof fetch {
  return mock(impl) as unknown as typeof fetch;
}

function ciudadFixture(): City {
  return {
    id: "1",
    name: "Ottawa",
    country: "Canadá",
    latitude: 45.41117,
    longitude: -75.69812,
  };
}

function jsonResponse(cuerpo: unknown, ok = true, status = ok ? 200 : 500): Response {
  return new Response(JSON.stringify(cuerpo), { status, headers: { "content-type": "application/json" } });
}

afterAll(() => {
  globalThis.fetch = fetchOriginal;
});

describe("buscarCiudad", () => {
  test("construye la URL de geocoding correctamente", async () => {
    const fetchMock = mockFetch(async (url: string | URL) => {
      const u = new URL(String(url));
      expect(u.origin + u.pathname).toBe(GEOCODING_URL);
      expect(u.searchParams.get("name")).toBe("ottawa");
      expect(u.searchParams.get("count")).toBe("1");
      expect(u.searchParams.get("language")).toBe("es");
      expect(u.searchParams.get("format")).toBe("json");
      return jsonResponse({});
    });
    globalThis.fetch = fetchMock;

    await buscarCiudad("ottawa");
    expect(fetchMock).toHaveBeenCalled();
  });

  test("devuelve el primer resultado con país opcional", async () => {
    globalThis.fetch = mockFetch(async () =>
      jsonResponse({
        results: [{ name: "Ottawa", country: "Canadá", latitude: 45.42, longitude: -75.7 }],
      }),
    );
    const resultado = await buscarCiudad("ottawa");
    expect(resultado).toEqual({
      name: "Ottawa",
      country: "Canadá",
      latitude: 45.42,
      longitude: -75.7,
    });
  });

  test("devuelve null cuando no hay resultados", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({ results: [] }));
    expect(await buscarCiudad("asdf")).toBeNull();
  });

  test("devuelve null cuando el resultado no tiene coordenadas", async () => {
    globalThis.fetch = mockFetch(async () =>
      jsonResponse({ results: [{ name: "Ottawa", country: "Canadá" }] }),
    );
    expect(await buscarCiudad("ottawa")).toBeNull();
  });

  test("lanza error cuando la respuesta HTTP no es ok", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({}, false, 500));
    expect(buscarCiudad("ottawa")).rejects.toThrow(/HTTP 500/);
  });
});

describe("obtenerClima", () => {
  test("consulta celsius sin temperature_unit", async () => {
    const fetchMock = mockFetch(async (url: string | URL) => {
      const u = new URL(String(url));
      expect(u.origin + u.pathname).toBe(FORECAST_URL);
      expect(u.searchParams.get("latitude")).toBe("45.41117");
      expect(u.searchParams.get("longitude")).toBe("-75.69812");
      expect(u.searchParams.get("current")).toBe("temperature_2m");
      expect(u.searchParams.has("temperature_unit")).toBe(false);
      return jsonResponse({ current: { temperature_2m: 12.3 } });
    });
    globalThis.fetch = fetchMock;

    const clima = await obtenerClima(ciudadFixture(), "celsius");
    expect(clima).toEqual({ temperature: 12.3, symbol: "°C" });
  });

  test("agrega temperature_unit para fahrenheit", async () => {
    const fetchMock = mockFetch(async (url: string | URL) => {
      const u = new URL(String(url));
      expect(u.searchParams.get("temperature_unit")).toBe("fahrenheit");
      return jsonResponse({ current: { temperature_2m: 55 } });
    });
    globalThis.fetch = fetchMock;

    const clima = await obtenerClima(ciudadFixture(), "fahrenheit");
    expect(clima.temperature).toBe(55);
  });

  test("usa el símbolo devuelto por la API", async () => {
    globalThis.fetch = mockFetch(async () =>
      jsonResponse({
        current: { temperature_2m: 15 },
        current_units: { temperature_2m: "°F" },
      }),
    );
    const clima = await obtenerClima(ciudadFixture(), "fahrenheit");
    expect(clima.symbol).toBe("°F");
  });

  test("lanza error cuando no hay temperatura", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({ current: {} }));
    expect(obtenerClima(ciudadFixture(), "celsius")).rejects.toThrow(/no devolvió la temperatura/);
  });

  test("lanza error cuando la respuesta HTTP no es ok", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({}, false, 400));
    expect(obtenerClima(ciudadFixture(), "celsius")).rejects.toThrow(/HTTP 400/);
  });
});

describe("obtenerPronostico", () => {
  test("consulta daily con timezone auto", async () => {
    const fetchMock = mockFetch(async (url: string | URL) => {
      const u = new URL(String(url));
      expect(u.searchParams.get("daily")).toBe("temperature_2m_max,temperature_2m_min");
      expect(u.searchParams.get("timezone")).toBe("auto");
      expect(u.searchParams.has("temperature_unit")).toBe(false);
      return jsonResponse({
        daily: { time: ["2026-09-16"], temperature_2m_max: [20], temperature_2m_min: [10] },
      });
    });
    globalThis.fetch = fetchMock;

    const pronostico = await obtenerPronostico(ciudadFixture(), "celsius");
    expect(fetchMock).toHaveBeenCalled();
    expect(pronostico.days).toEqual([{ date: "2026-09-16", max: 20, min: 10 }]);
  });

  test("agrega temperature_unit para fahrenheit", async () => {
    const fetchMock = mockFetch(async (url: string | URL) => {
      const u = new URL(String(url));
      expect(u.searchParams.get("temperature_unit")).toBe("fahrenheit");
      return jsonResponse({
        daily: { time: ["2026-09-16"], temperature_2m_max: [68], temperature_2m_min: [50] },
      });
    });
    globalThis.fetch = fetchMock;

    const pronostico = await obtenerPronostico(ciudadFixture(), "fahrenheit");
    expect(pronostico.days[0]?.max).toBe(68);
    expect(pronostico.days[0]?.min).toBe(50);
  });

  test("usa el símbolo de la API y completa días incompletos con 0", async () => {
    globalThis.fetch = mockFetch(async () =>
      jsonResponse({
        daily: {
          time: ["2026-09-16", "2026-09-17"],
          temperature_2m_max: [20],
          temperature_2m_min: [10],
        },
        daily_units: { temperature_2m_max: "°F" },
      }),
    );
    const pronostico = await obtenerPronostico(ciudadFixture(), "celsius");
    expect(pronostico.symbol).toBe("°F");
    expect(pronostico.days).toEqual([
      { date: "2026-09-16", max: 20, min: 10 },
      { date: "2026-09-17", max: 0, min: 0 },
    ]);
  });

  test("lanza error cuando no hay fechas", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({ daily: {} }));
    expect(obtenerPronostico(ciudadFixture(), "celsius")).rejects.toThrow(/no devolvió el pronóstico/);
  });

  test("lanza error cuando la respuesta HTTP no es ok", async () => {
    globalThis.fetch = mockFetch(async () => jsonResponse({}, false, 503));
    expect(obtenerPronostico(ciudadFixture(), "celsius")).rejects.toThrow(/HTTP 503/);
  });
});
