import { mostrarExito } from "../presentation/output.ts";
import { guardarSettings } from "../storage/settingsStorage.ts";
import type { AppState } from "../types/City.ts";
import { simboloUnidad } from "../utils/format.ts";

export async function alternarUnidad(estado: AppState): Promise<void> {
  estado.unit = estado.unit === "celsius" ? "fahrenheit" : "celsius";
  mostrarExito(`\n  Unidad de temperatura: ${simboloUnidad(estado.unit)}`);
  await guardarSettings(estado);
}