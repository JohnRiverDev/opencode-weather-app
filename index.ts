import { buscarCiudad, obtenerClima } from "./src/api.ts";
import { cargarEstado, guardarEstado } from "./src/state.ts";
import type { AppState, City, Unit } from "./src/types.ts";
import { cerrarLectura, mostrarMenu, preguntar } from "./src/ui.ts";

function ciudadDefault(estado: AppState): City | null {
  return estado.cities.find((ciudad) => ciudad.id === estado.defaultCityId) ?? null;
}

function mensajeCiudad(ciudad: { name: string; country?: string }): string {
  return ciudad.country ? `${ciudad.name} (${ciudad.country})` : ciudad.name;
}

async function mostrarClima(ciudad: City, unidad: Unit): Promise<void> {
  try {
    const clima = await obtenerClima(ciudad, unidad);
    console.log(`\n  ${mensajeCiudad(ciudad)}: ${clima.temperature}${clima.symbol}`);
  } catch (error) {
    console.error(`\n  Error al obtener el clima de ${mensajeCiudad(ciudad)}: ${(error as Error).message}`);
  }
}

async function climaCiudadDefault(estado: AppState): Promise<void> {
  const ciudad = ciudadDefault(estado);
  if (!ciudad) {
    console.log("\n  No hay ciudad default. Usa la opción 5 para establecerla.");
    return;
  }
  await mostrarClima(ciudad, estado.unit);
}

async function climaTodasLasCiudades(estado: AppState): Promise<void> {
  if (estado.cities.length === 0) {
    console.log("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }
  for (const ciudad of estado.cities) {
    await mostrarClima(ciudad, estado.unit);
  }
}

async function buscarYAgregar(estado: AppState): Promise<void> {
  const nombre = await preguntar("\n  Nombre de la ciudad a buscar: ");
  if (!nombre) {
    return;
  }

  let resultado;
  try {
    resultado = await buscarCiudad(nombre);
  } catch (error) {
    console.error(`\n  Error al buscar "${nombre}": ${(error as Error).message}`);
    return;
  }

  if (!resultado) {
    console.log(`\n  No se encontró la ciudad "${nombre}".`);
    return;
  }

  console.log(`\n  Se encontró: ${mensajeCiudad(resultado)}`);
  const confirmacion = await preguntar("  ¿Agregar esta ciudad? (s/n): ");
  if (confirmacion.toLowerCase() !== "s") {
    console.log("\n  Operación cancelada.");
    return;
  }

  if (estado.cities.some((ciudad) => ciudad.name.toLowerCase() === resultado.name.toLowerCase())) {
    console.log("\n  Esa ciudad ya está registrada.");
    return;
  }

  const nueva: City = {
    id: crypto.randomUUID(),
    name: resultado.name,
    country: resultado.country,
    latitude: resultado.latitude,
    longitude: resultado.longitude,
  };
  estado.cities.push(nueva);
  await guardarEstado(estado);
  console.log(`\n  "${nueva.name}" fue agregada correctamente.`);
}

async function seleccionarCiudad(estado: AppState, mensaje: string): Promise<City | null> {
  if (estado.cities.length === 0) {
    console.log("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return null;
  }

  console.log("");
  estado.cities.forEach((ciudad, indice) => {
    console.log(`  ${indice + 1}. ${mensajeCiudad(ciudad)}`);
  });

  const seleccion = await preguntar(`  ${mensaje}: `);
  if (seleccion === "") {
    console.log("\n  Operación cancelada.");
    return null;
  }
  const indice = Number(seleccion) - 1;
  if (!Number.isInteger(indice) || indice < 0 || indice >= estado.cities.length) {
    console.log("\n  Selección no válida.");
    return null;
  }

  return estado.cities[indice] ?? null;
}

async function eliminarCiudad(estado: AppState): Promise<void> {
  const ciudad = await seleccionarCiudad(estado, "Número de ciudad a eliminar (vacío para cancelar)");
  if (!ciudad) {
    return;
  }

  estado.cities = estado.cities.filter((c) => c.id !== ciudad.id);
  if (estado.defaultCityId === ciudad.id) {
    estado.defaultCityId = null;
  }
  await guardarEstado(estado);
  console.log(`\n  "${ciudad.name}" fue eliminada.`);
}

async function establecerDefault(estado: AppState): Promise<void> {
  if (estado.cities.length === 0) {
    console.log("\n  No hay ciudades registradas. Usa la opción 3 para agregar una.");
    return;
  }

  const ciudad = await seleccionarCiudad(estado, "Número de la ciudad default (vacío para cancelar)");
  if (!ciudad) {
    return;
  }

  estado.defaultCityId = ciudad.id;
  await guardarEstado(estado);
  console.log(`\n  Ciudad default establecida: ${mensajeCiudad(ciudad)}`);
}

function toglearUnidad(estado: AppState): void {
  estado.unit = estado.unit === "celsius" ? "fahrenheit" : "celsius";
  const unidad = estado.unit === "celsius" ? "°C" : "°F";
  console.log(`\n  Unidad de temperatura: ${unidad}`);
}

async function main(): Promise<void> {
  const estado = await cargarEstado();

  let seguir = true;
  while (seguir) {
    mostrarMenu(estado);
    const opcion = await preguntar("  Selecciona una opción: ");

    switch (opcion) {
      case "1":
        await climaCiudadDefault(estado);
        break;
      case "2":
        await climaTodasLasCiudades(estado);
        break;
      case "3":
        await buscarYAgregar(estado);
        break;
      case "4":
        await eliminarCiudad(estado);
        break;
      case "5":
        await establecerDefault(estado);
        break;
      case "8":
        toglearUnidad(estado);
        await guardarEstado(estado);
        break;
      case "9":
        seguir = false;
        break;
      default:
        console.log("\n  Opción no válida.");
    }
  }

  console.log("\n  ¡Hasta luego!");
}

await main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => cerrarLectura());