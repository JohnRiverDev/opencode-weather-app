import { buscarCiudad } from "../api/geocoding.ts";
import { preguntar } from "../presentation/input.ts";
import { mostrarError, mostrarExito, mostrarMensaje } from "../presentation/output.ts";
import { guardarCiudades } from "../storage/citiesStorage.ts";
import type { AppState, City } from "../types/City.ts";
import { rojo } from "../utils/colors.ts";
import { mensajeCiudad } from "../utils/format.ts";

export async function buscarYAgregar(estado: AppState): Promise<void> {
  const nombre = await preguntar("\n  Nombre de la ciudad a buscar: ");
  if (!nombre) {
    return;
  }

  let resultado;
  try {
    resultado = await buscarCiudad(nombre);
  } catch (error) {
    mostrarError(`\n  Error al buscar "${nombre}": ${(error as Error).message}`);
    return;
  }

  if (!resultado) {
    mostrarError(`\n  No se encontró la ciudad "${nombre}".`);
    return;
  }

  mostrarMensaje(`\n  Se encontró: ${mensajeCiudad(resultado)}`);
  const confirmacion = await preguntar("  ¿Agregar esta ciudad? (s/n): ");
  if (confirmacion.toLowerCase() !== "s") {
    mostrarMensaje("\n  Operación cancelada.");
    return;
  }

  const yaRegistrada = estado.cities.some((ciudad) => ciudad.name.toLowerCase() === resultado.name.toLowerCase());
  if (yaRegistrada) {
    mostrarError(rojo("\n  Esa ciudad ya está registrada."));
    return;
  }

  const nueva: City = {
    id: crypto.randomUUID(),
    name: resultado.name,
    country: resultado.country,
    latitude: resultado.latitude,
    longitude: resultado.longitude,
  };
  estado.cities.push(nueva);
  await guardarCiudades(estado);
  mostrarExito(`\n  "${nueva.name}" fue agregada correctamente.`);
}