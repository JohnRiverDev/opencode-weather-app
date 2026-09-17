import type { AppState } from "../types/City.ts";
import type { Unit } from "../types/Unit.ts";
import { cargarEstado, guardarEstado } from "./stateStorage.ts";

export interface Settings {
  unit: Unit;
  defaultCityId: string | null;
}

export async function cargarSettings(): Promise<Settings> {
  const estado = await cargarEstado();
  return {
    unit: estado.unit,
    defaultCityId: estado.defaultCityId,
  };
}

export async function guardarSettings(estado: AppState): Promise<void> {
  await guardarEstado({
    ...estado,
    unit: estado.unit === "fahrenheit" ? "fahrenheit" : "celsius",
    defaultCityId: typeof estado.defaultCityId === "string" ? estado.defaultCityId : null,
  });
}