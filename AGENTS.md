# AGENTS.md

## Overview
Bun-only TypeScript CLI app (course project, `02-weather`). Interactive weather CLI for multiple cities, backed by the keyless OpenMeteo API. Entrypoint `src/index.ts` (menu loop, fully working); modular layout in `src/`:
- `actions/` — user actions: `getWeather`, `addCity`, `removeCity`, `setDefaultCity`, `listCities`, `forecast`, `settings`
- `presentation/` — console/CLI interaction: `menu.ts` (render), `output.ts` (messages), `input.ts` (readline prompter `preguntar`, city selector)
- `storage/` — persistence of the single `weather-state.json`: `stateStorage` (full state), `citiesStorage` (cities), `settingsStorage` (unit + default city)
- `types/` — shared global types: `City`, `Unit`, `Weather`, `MenuOption`
- `api/` — OpenMeteo: `geocoding.ts` (`buscarCiudad`), `weather.ts` (`obtenerClima`, `obtenerPronostico`)
- `utils/` — helpers: `colors.ts` (ANSI), `format.ts` (dates, units, city labels), `constants.ts`
- `index.ts` — CLI entry point with the menu loop

State (cities, default city, °C/°F) persists to `weather-state.json` in cwd (gitignored).

## Commands
- Run: `bun run src/index.ts`
- Tests: `bun test tests/` (Bun's built-in runner; no extra deps). Config via package.json script `test`.
- Execute binary: `bun run build` = primero `bun test tests/` y, solo si pasan, `bun build --compile src/index.ts --outfile out/weather.exe` (la build **se bloquea si algún test falla**). Output dirs `out`/`dist` are gitignored.
- A compiled binary is the project goal (see README "binario ejecutable").
- Type check if needed: `bunx tsc --noEmit`. No lint/format scripts exist — don't invent them.
- Tests live in `tests/`, use `import * as X from "bun:test"` API (`describe`/`test`/`expect`/`mock`/`spyOn`), mock `globalThis.fetch` for API calls and `mock.module` for modules with side effects.
- Bun test runs **all test files in a single process**: `mock.module` and `globalThis` changes persist for the whole run and leak across files. The only file that mocks source modules is `tests/zzz-actions.test.ts` — keep it named `zzz-*` (or later in alphabetical order) so its global mocks never break the other specs (`api`, `input`, `storage`).

## Conventions
- Package manager is **Bun** (`bun.lock` committed). Never use npm/yarn; don't add extra dependencies.
- UI text must be **in Spanish** (menus, prompts, output) matching the README example.
- OpenMeteo needs **no API key** — do not introduce `.env`/config for one.
- tsconfig: strict + `verbatimModuleSyntax`, `allowImportingTsExtensions`, `moduleResolution: bundler`. Use explicit type-only imports (`import type`) and you may import `.ts` extensions in source.
- App reads city names from stdin (interactive); design for plain `console.log`/`console.error` I/O.
- README.md is the spec for the menu/options (default city, saved cities, °C/°F setting 8).