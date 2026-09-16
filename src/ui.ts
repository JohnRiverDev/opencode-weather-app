import * as readline from "node:readline";
import { cian } from "./colors.ts";
import type { AppState } from "./types.ts";

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

export function mostrarMenu(estado: AppState): void {
  const unidad = estado.unit === "celsius" ? "°C" : "°F";
  console.log(cian("════════════════════════════════════════"));
  console.log(cian("         WEATHER CLI"));
  console.log(cian("════════════════════════════════════════"));
  console.log(cian("  1. Clima de ciudad default"));
  console.log(cian(`  2. Clima de todas las ciudades (${estado.cities.length})`));
  console.log(cian("  3. Buscar y agregar ciudad"));
  console.log(cian("  4. Eliminar ciudad"));
  console.log(cian("  5. Establecer ciudad default"));
  console.log(cian("  6. Pronóstico 7 días"));
  console.log(cian(`  8. Ajustes (${unidad})`));
  console.log(cian("  9. Salir"));
  console.log(cian("════════════════════════════════════════"));
}