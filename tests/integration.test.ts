import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("CLI (integración)", () => {
  test("muestra el menú y termina al elegir salir", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "weather-cli-e2e-"));
    try {
      const proc = Bun.spawn({
        cmd: [process.execPath, "run", `${import.meta.dir}/../src/index.ts`],
        cwd,
        stdin: "pipe",
        stdout: "pipe",
        stderr: "pipe",
      });
      proc.stdin!.write("9\n");
      await proc.stdin!.end();

      const salida = await new Response(proc.stdout).text();
      const errores = await new Response(proc.stderr).text();
      const exitCode = await proc.exited;

      expect(exitCode).toBe(0);
      expect(errores).toBe("");
      expect(salida).toContain("WEATHER CLI");
      expect(salida).toContain("1. Clima de ciudad default");
      expect(salida).toContain("8. Ajustes (°C)");
      expect(salida).toContain("9. Salir");
      expect(salida).toContain("¡Hasta luego!");
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});