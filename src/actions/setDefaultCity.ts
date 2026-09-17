import { seleccionarCiudad } from "../presentation/input.ts";
import { mostrarExito, mostrarMensaje } from "../presentation/output.ts";
import { guardarSettings } from "../storage/settingsStorage.ts";
import type { AppState } from "../types/City.ts";
import { mensajeCiudad } from "../utils/format.ts";

export async function establecerDefault(estado: AppState): Promise<void> {
  if (estado.cities.length === 0) {
    mostrarMensaje("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }

  const ciudad = await seleccionarCiudad(estado, "Número de la ciudad default (vacío para cancelar)");
  if (!ciudad) {
    return;
  }

  estado.defaultCityId = ciudad.id;
  await guardarSettings(estado);
  mostrarExito(`\n  Ciudad default establecida: ${mensajeCiudad(ciudad)}`);
}