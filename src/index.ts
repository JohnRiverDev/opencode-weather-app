import { buscarYAgregar } from "./actions/addCity.ts";
import { pronostico7Dias } from "./actions/forecast.ts";
import { climaCiudadDefault, climaTodasLasCiudades } from "./actions/getWeather.ts";
import { eliminarCiudad } from "./actions/removeCity.ts";
import { establecerDefault } from "./actions/setDefaultCity.ts";
import { alternarUnidad } from "./actions/settings.ts";
import { cerrarLectura, preguntar } from "./presentation/input.ts";
import { mostrarMenu } from "./presentation/menu.ts";
import { mostrarError, mostrarMensaje } from "./presentation/output.ts";
import { cargarEstado } from "./storage/stateStorage.ts";

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
      case "6":
        await pronostico7Dias(estado);
        break;
      case "8":
        await alternarUnidad(estado);
        break;
      case "9":
        seguir = false;
        break;
      default:
        mostrarError("\n  Opción no válida.");
    }
  }

  mostrarMensaje("\n  ¡Hasta luego!");
}

await main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => cerrarLectura());