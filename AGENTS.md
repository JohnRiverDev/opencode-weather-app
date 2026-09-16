# AGENTS.md

## Overview
Bun-only TypeScript CLI app (course project, `02-weather`). Interactive weather CLI for multiple cities, backed by the keyless OpenMeteo API. Entrypoint `index.ts` (menu loop, fully working); modules in `src/`:
- `api.ts` — OpenMeteo geocoding (`buscarCiudad`), current forecast (`obtenerClima`) and 7-day forecast (`obtenerPronostico`)
- `colors.ts` — ANSI color helpers: cyanish menu, yellow temps, green ok, red errors
- `state.ts` — load/save persisted app state
- `ui.ts` — readline prompter (`preguntar`) and menu render
- `types.ts` — shared types

State (cities, default city, °C/°F) persists to `weather-state.json` in cwd (gitignored).

## Commands
- Run: `bun run index.ts`
- Execute binary: `bun build --compile index.ts --outfile out/weather` (output dirs `out`/`dist` are gitignored)
- A compiled binary is the project goal (see README "binario ejecutable").
- No test/lint/format/typecheck scripts exist — don't invent them. Use `bunx tsc --noEmit` for a type check if needed.

## Conventions
- Package manager is **Bun** (`bun.lock` committed). Never use npm/yarn; don't add extra dependencies.
- UI text must be **in Spanish** (menus, prompts, output) matching the README example.
- OpenMeteo needs **no API key** — do not introduce `.env`/config for one.
- tsconfig: strict + `verbatimModuleSyntax`, `allowImportingTsExtensions`, `moduleResolution: bundler`. Use explicit type-only imports (`import type`) and you may import `.ts` extensions in source.
- App reads city names from stdin (interactive); design for plain `console.log`/`console.error` I/O.
- README.md is the spec for the menu/options (default city, saved cities, °C/°F setting 8).