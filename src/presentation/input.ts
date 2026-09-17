import * as readline from "node:readline";
import type { AppState, City } from "../types/City.ts";
import { listarCiudades, mostrarError, mostrarMensaje } from "./output.ts";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const lineasPendientes: string[] = [];
const resolversPendientes: Array<(respuesta: string) => void> = [];

rl.on("line", (linea) => {
  const responder = resolversPendientes.shift();
  if (responder) {
    responder(linea.trim());
  } else {
    lineasPendientes.push(linea.trim());
  }
});

rl.on("close", () => {
  const restantes = resolversPendientes.splice(0);
  for (const responder of restantes) {
    responder(lineasPendientes.shift() ?? "");
  }
});

export function preguntar(texto: string): Promise<string> {
  process.stdout.write(texto);
  const pendiente = lineasPendientes.shift();
  if (pendiente !== undefined) {
    return Promise.resolve(pendiente);
  }
  return new Promise((resolve) => {
    resolversPendientes.push(resolve);
  });
}

export function cerrarLectura(): void {
  rl.close();
}

export async function seleccionarCiudad(estado: AppState, mensaje: string): Promise<City | null> {
  listarCiudades(estado.cities);
  if (estado.cities.length === 0) {
    return null;
  }

  const seleccion = await preguntar(`  ${mensaje}: `);
  if (seleccion === "") {
    mostrarMensaje("\n  Operación cancelada.");
    return null;
  }
  const indice = Number(seleccion) - 1;
  if (!Number.isInteger(indice) || indice < 0 || indice >= estado.cities.length) {
    mostrarError("\n  Selección no válida.");
    return null;
  }

  return estado.cities[indice] ?? null;
}