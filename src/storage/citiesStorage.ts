import type { AppState, City } from "../types/City.ts";
import { cargarEstado, esCiudadGuardada, guardarEstado } from "./stateStorage.ts";

export async function cargarCiudades(): Promise<City[]> {
  return (await cargarEstado()).cities;
}

export async function guardarCiudades(estado: AppState): Promise<void> {
  await guardarEstado({ ...estado, cities: estado.cities.filter(esCiudadGuardada) });
}