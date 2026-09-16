import * as readline from "node:readline";
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
  console.log("════════════════════════════════════════");
  console.log("         WEATHER CLI");
  console.log("════════════════════════════════════════");
  console.log("  1. Clima de ciudad default");
  console.log(`  2. Clima de todas las ciudades (${estado.cities.length})`);
  console.log("  3. Buscar y agregar ciudad");
  console.log("  4. Eliminar ciudad");
  console.log("  5. Establecer ciudad default");
  console.log(`  8. Ajustes (${unidad})`);
  console.log("  9. Salir");
  console.log("════════════════════════════════════════");
}