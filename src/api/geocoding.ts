import type { GeoResult } from "../types/Weather.ts";
import { GEOCODING_URL } from "../utils/constants.ts";

interface GeoResponse {
  results?: Array<{
    name?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  }>;
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