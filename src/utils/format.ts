import type { Unit } from "../types/Unit.ts";
import { SIMBOLO_CELSIUS, SIMBOLO_FAHRENHEIT } from "./constants.ts";

export function simboloUnidad(unidad: Unit): string {
  return unidad === "celsius" ? SIMBOLO_CELSIUS : SIMBOLO_FAHRENHEIT;
}

export function mensajeCiudad(ciudad: { name: string; country?: string }): string {
  return ciudad.country ? `${ciudad.name} (${ciudad.country})` : ciudad.name;
}

export function formatearFecha(fecha: string): string {
  const date = new Date(`${fecha}T00:00:00`);
  return date.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}