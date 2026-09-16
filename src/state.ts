import type { AppState, City } from "./types.ts";

const STATE_FILE = "weather-state.json";

export function crearEstadoInicial(): AppState {
  return {
    unit: "celsius",
    cities: [],
    defaultCityId: null,
  };
}

function esCiudad(valor: unknown): valor is City {
  if (typeof valor !== "object" || valor === null) return false;
  const ciudad = valor as Partial<City>;
  return (
    typeof ciudad.id === "string" &&
    typeof ciudad.name === "string" &&
    typeof ciudad.latitude === "number" &&
    typeof ciudad.longitude === "number"
  );
}

export async function cargarEstado(): Promise<AppState> {
  try {
    const archivo = Bun.file(STATE_FILE);
    if (!(await archivo.exists())) {
      return crearEstadoInicial();
    }
    const data = (await archivo.json()) as Partial<AppState>;
    return {
      unit: data.unit === "fahrenheit" ? "fahrenheit" : "celsius",
      cities: Array.isArray(data.cities) ? data.cities.filter(esCiudad) : [],
      defaultCityId: typeof data.defaultCityId === "string" ? data.defaultCityId : null,
    };
  } catch {
    return crearEstadoInicial();
  }
}

export async function guardarEstado(estado: AppState): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(estado, null, 2));
}