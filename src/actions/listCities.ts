import { listarCiudades } from "../presentation/output.ts";
import type { AppState } from "../types/City.ts";

export function mostrarListadoCiudades(estado: AppState): void {
  listarCiudades(estado.cities);
}