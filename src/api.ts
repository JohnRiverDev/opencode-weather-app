import type { City, ForecastResult, GeoResult, PronosticoResult, Unit } from "./types.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface GeoResponse {
  results?: Array<{
    name?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

interface ForecastResponse {
  current?: {
    temperature_2m?: number;
  };
  current_units?: {
    temperature_2m?: string;
  };
}

interface PronosticoResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
  daily_units?: {
    temperature_2m_max?: string;
  };
}

export async function buscarCiudad(nombre: string): Promise<GeoResult | null> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set("name", nombre);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "es");
  url.searchParams.set("format", "json");

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error del servicio de geocoding (HTTP ${respuesta.status})`);
  }

  const data = (await respuesta.json()) as GeoResponse;
  const resultado = data.results?.[0];
  if (!resultado || resultado.name === undefined || resultado.latitude === undefined || resultado.longitude === undefined) {
    return null;
  }

  return {
    name: resultado.name,
    country: resultado.country,
    latitude: resultado.latitude,
    longitude: resultado.longitude,
  };
}

export async function obtenerClima(ciudad: City, unidad: Unit): Promise<ForecastResult> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(ciudad.latitude));
  url.searchParams.set("longitude", String(ciudad.longitude));
  url.searchParams.set("current", "temperature_2m");
  if (unidad === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error de OpenMeteo (HTTP ${respuesta.status})`);
  }

  const data = (await respuesta.json()) as ForecastResponse;
  const temperatura = data.current?.temperature_2m;
  if (temperatura === undefined) {
    throw new Error("OpenMeteo no devolvió la temperatura actual");
  }

  return {
    temperature: temperatura,
    symbol: data.current_units?.temperature_2m ?? (unidad === "fahrenheit" ? "°F" : "°C"),
  };
}

export async function obtenerPronostico(ciudad: City, unidad: Unit): Promise<PronosticoResult> {
  const url = new URL(FORECAST_URL);
  url.searchParams.set("latitude", String(ciudad.latitude));
  url.searchParams.set("longitude", String(ciudad.longitude));
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("timezone", "auto");
  if (unidad === "fahrenheit") {
    url.searchParams.set("temperature_unit", "fahrenheit");
  }

  const respuesta = await fetch(url);
  if (!respuesta.ok) {
    throw new Error(`Error de OpenMeteo (HTTP ${respuesta.status})`);
  }

  const data = (await respuesta.json()) as PronosticoResponse;
  const fechas = data.daily?.time ?? [];
  const maximas = data.daily?.temperature_2m_max ?? [];
  const minimas = data.daily?.temperature_2m_min ?? [];
  if (fechas.length === 0) {
    throw new Error("OpenMeteo no devolvió el pronóstico");
  }

  return {
    symbol: data.daily_units?.temperature_2m_max ?? (unidad === "fahrenheit" ? "°F" : "°C"),
    days: fechas.map((date, indice) => ({
      date,
      max: maximas[indice] ?? 0,
      min: minimas[indice] ?? 0,
    })),
  };
}