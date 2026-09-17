import type { City } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import type { ForecastResult, PronosticoResult } from "../types/Weather.ts";
import { FORECAST_URL } from "../utils/constants.ts";

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