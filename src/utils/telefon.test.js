import { describe, it, expect } from "vitest";
import { telHref } from "./telefon";

describe("telHref", () => {
  it("behåller ett inledande plustecken och tar bort allt annat icke-numeriskt", () => {
    expect(telHref("+46 70-123 45 67")).toBe("tel:+46701234567");
  });

  it("fungerar utan plustecken", () => {
    expect(telHref("070-123 45 67")).toBe("tel:0701234567");
  });

  it("hanterar interna nummer med parenteser/mellanslag", () => {
    expect(telHref("112 (larm)")).toBe("tel:112");
  });
});
