import { describe, expect, test } from "bun:test";
import { amarillo, cian, rojo, verde } from "../../src/utils/colors.ts";

describe("colores", () => {
  test("envuelven el texto con el código ANSI y reset", () => {
    expect(cian("x")).toBe("\u001b[36mx\u001b[0m");
    expect(amarillo("x")).toBe("\u001b[33mx\u001b[0m");
    expect(verde("x")).toBe("\u001b[32mx\u001b[0m");
    expect(rojo("x")).toBe("\u001b[31mx\u001b[0m");
  });
});