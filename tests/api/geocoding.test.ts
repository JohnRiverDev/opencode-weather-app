import { afterAll, describe, expect, mock, test } from "bun:test";
import { buscarCiudad } from "../../src/api/geocoding.ts";
import { GEOCODING_URL } from "../../src/utils/constants.ts";

const fetchOriginal = globalThis.fetch;

function mockFetch(impl: (url: string | URL, init?: RequestInit) => Promise<Response>): typeof fetch {
  return mock(impl) as unknown as typeof fetch;
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