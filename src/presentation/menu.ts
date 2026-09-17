import type { AppState } from "../types/City.ts";
import type { MenuOption } from "../types/MenuOption.ts";
import { cian } from "../utils/colors.ts";
import { simboloUnidad } from "../utils/format.ts";

function opcionesDelMenu(estado: AppState): MenuOption[] {
  return [
    { key: "1", label: "Clima de ciudad default" },
    { key: "2", label: `Clima de todas las ciudades (${estado.cities.length})` },
    { key: "3", label: "Buscar y agregar ciudad" },
    { key: "4", label: "Eliminar ciudad" },
    { key: "5", label: "Establecer ciudad default" },
    { key: "6", label: "Pronóstico 7 días" },
    { key: "8", label: `Ajustes (${simboloUnidad(estado.unit)})` },
    { key: "9", label: "Salir" },
  ];
}

export function mostrarMenu(estado: AppState): void {
  console.log(cian("════════════════════════════════════════"));
  console.log(cian("         WEATHER CLI"));
  console.log(cian("════════════════════════════════════════"));
  for (const opcion of opcionesDelMenu(estado)) {
    console.log(cian(`  ${opcion.key}. ${opcion.label}`));
  }
  console.log(cian("════════════════════════════════════════"));
}