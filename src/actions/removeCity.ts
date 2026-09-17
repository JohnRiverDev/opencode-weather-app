import { seleccionarCiudad } from "../presentation/input.ts";
import { mostrarExito } from "../presentation/output.ts";
import { guardarCiudades } from "../storage/citiesStorage.ts";
import type { AppState } from "../types/City.ts";

export async function eliminarCiudad(estado: AppState): Promise<void> {
  const ciudad = await seleccionarCiudad(estado, "Número de ciudad a eliminar (vacío para cancelar)");
  if (!ciudad) {
    return;
  }

  estado.cities = estado.cities.filter((c) => c.id !== ciudad.id);
  if (estado.defaultCityId === ciudad.id) {
    estado.defaultCityId = null;
  }
  await guardarCiudades(estado);
  mostrarExito(`\n  "${ciudad.name}" fue eliminada.`);
}