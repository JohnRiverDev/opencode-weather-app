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
- Execute binary: `bun build --compile src/index.ts --outfile out/weather` (output dirs `out`/`dist` are gitignored)
- A compiled binary is the project goal (see README "binario ejecutable").
- No test/lint/format/typecheck scripts exist — don't invent them. Use `bunx tsc --noEmit` for a type check if needed.

## Conventions
- Package manager is **Bun** (`bun.lock` committed). Never use npm/yarn; don't add extra dependencies.
- UI text must be **in Spanish** (menus, prompts, output) matching the README example.
- OpenMeteo needs **no API key** — do not introduce `.env`/config for one.
- tsconfig: strict + `verbatimModuleSyntax`, `allowImportingTsExtensions`, `moduleResolution: bundler`. Use explicit type-only imports (`import type`) and you may import `.ts` extensions in source.
- App reads city names from stdin (interactive); design for plain `console.log`/`console.error` I/O.
- README.md is the spec for the menu/options (default city, saved cities, °C/°F setting 8).