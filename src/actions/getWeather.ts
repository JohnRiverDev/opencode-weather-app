import { obtenerClima } from "../api/weather.ts";
import { mostrarError, mostrarMensaje } from "../presentation/output.ts";
import type { AppState, City } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import { amarillo } from "../utils/colors.ts";
import { mensajeCiudad } from "../utils/format.ts";

function ciudadDefault(estado: AppState): City | null {
  return estado.cities.find((ciudad) => ciudad.id === estado.defaultCityId) ?? null;
}

export async function mostrarClima(ciudad: City, unidad: Unit): Promise<void> {
  try {
    const clima = await obtenerClima(ciudad, unidad);
    mostrarMensaje(`\n  ${mensajeCiudad(ciudad)}: ${amarillo(`${clima.temperature}${clima.symbol}`)}`);
  } catch (error) {
    mostrarError(`\n  Error al obtener el clima de ${mensajeCiudad(ciudad)}: ${(error as Error).message}`);
  }
}

export async function climaCiudadDefault(estado: AppState): Promise<void> {
  const ciudad = ciudadDefault(estado);
  if (!ciudad) {
    mostrarMensaje("\n  No hay ciudad default. Usa la opción 5 para establecerla.");
    return;
  }
  await mostrarClima(ciudad, estado.unit);
}

export async function climaTodasLasCiudades(estado: AppState): Promise<void> {
  if (estado.cities.length === 0) {
    mostrarMensaje("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const ciudad of estado.cities) {
    await mostrarClima(ciudad, estado.unit);
  }
}