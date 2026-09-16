# AGENTS.md

## Overview
Bun-only TypeScript CLI app (course project, `02-weather`). Single entrypoint `index.ts` (currently a "Hello via Bun!" stub). Goal per README: interactive weather CLI for multiple cities, backed by the keyless OpenMeteo API.

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