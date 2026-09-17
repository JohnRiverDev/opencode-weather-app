import { describe, expect, test } from "bun:test";
import { amarillo, cian, rojo, verde } from "../src/utils/colors.ts";
import { SIMBOLO_CELSIUS, SIMBOLO_FAHRENHEIT } from "../src/utils/constants.ts";
import { formatearFecha, mensajeCiudad, simboloUnidad } from "../src/utils/format.ts";

describe("simboloUnidad", () => {
  test("devuelve °C para celsius", () => {
    expect(simboloUnidad("celsius")).toBe(SIMBOLO_CELSIUS);
  });

  test("devuelve °F para fahrenheit", () => {
    expect(simboloUnidad("fahrenheit")).toBe(SIMBOLO_FAHRENHEIT);
  });
});

describe("mensajeCiudad", () => {
  test("incluye el país cuando existe", () => {
    expect(mensajeCiudad({ name: "Ottawa", country: "Canadá" })).toBe("Ottawa (Canadá)");
  });

  test("solo el nombre cuando no hay país", () => {
    expect(mensajeCiudad({ name: "Ottawa" })).toBe("Ottawa");
  });

  test("no rompe si el país es una cadena vacía", () => {
    expect(mensajeCiudad({ name: "Ottawa", country: "" })).toBe("Ottawa");
  });
});

describe("formatearFecha", () => {
  test("formatea la fecha en español corto", () => {
    const resultado = formatearFecha("2026-09-16");
    expect(resultado.toLowerCase()).toContain("sept");
    expect(resultado.toLowerCase()).toContain("16");
  });
});

describe("colores", () => {
  test("envuelven el texto con el código ANSI y reset", () => {
    expect(cian("x")).toBe("\u001b[36mx\u001b[0m");
    expect(amarillo("x")).toBe("\u001b[33mx\u001b[0m");
    expect(verde("x")).toBe("\u001b[32mx\u001b[0m");
    expect(rojo("x")).toBe("\u001b[31mx\u001b[0m");
  });
});