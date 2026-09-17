import { obtenerPronostico } from "../api/weather.ts";
import { seleccionarCiudad } from "../presentation/input.ts";
import { mostrarError, mostrarMensaje } from "../presentation/output.ts";
import type { AppState, City } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import { amarillo } from "../utils/colors.ts";
import { formatearFecha, mensajeCiudad } from "../utils/format.ts";

export async function mostrarPronostico(ciudad: City, unidad: Unit): Promise<void> {
  try {
    const pronostico = await obtenerPronostico(ciudad, unidad);
    mostrarMensaje(`\n  Pronóstico 7 días de ${mensajeCiudad(ciudad)}:`);
    for (const dia of pronostico.days) {
      mostrarMensaje(
        `    ${formatearFecha(dia.date)}: mín ${amarillo(`${dia.min}${pronostico.symbol}`)} / máx ${amarillo(`${dia.max}${pronostico.symbol}`)}`
      );
    }
  } catch (error) {
    mostrarError(`\n  Error al obtener el pronóstico de ${mensajeCiudad(ciudad)}: ${(error as Error).message}`);
  }
}

export async function pronostico7Dias(estado: AppState): Promise<void> {
  const ciudad = await seleccionarCiudad(estado, "Número de ciudad para el pronóstico (vacío para cancelar)");
  if (!ciudad) {
    return;
  }
  await mostrarPronostico(ciudad, estado.unit);
}