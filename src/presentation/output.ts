import type { City } from "../types/City.ts";
import { rojo, verde } from "../utils/colors.ts";
import { mensajeCiudad } from "../utils/format.ts";

export function mostrarMensaje(texto: string): void {
  console.log(texto);
}

export function mostrarExito(texto: string): void {
  console.log(verde(texto));
}

export function mostrarError(texto: string): void {
  console.error(rojo(texto));
}

export function listarCiudades(ciudades: City[]): void {
  if (ciudades.length === 0) {
    mostrarMensaje("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }
  mostrarMensaje("");
  ciudades.forEach((ciudad, indice) => {
    mostrarMensaje(`  ${indice + 1}. ${mensajeCiudad(ciudad)}`);
  });
}