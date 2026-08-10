// Etapp 61b (ETAPPLAN12.md): beraknaKvartal finns duplicerad i functions/index.js (medvetet,
// inte importerad – se den filens egen kommentar om ESM/CommonJS-gränsen). En drift mellan de
// två skulle inte synas som ett fel, bara som fel kvartalsnyckel i statistik – testar
// klientversionen mot samtliga månadsgränser så en framtida ändring av endera sidan upptäcks.
import { describe, it, expect } from "vitest";
import { beraknaKvartal } from "./kvartal";

describe("beraknaKvartal", () => {
  it.each([
    [0, 1], // januari -> Q1
    [1, 1], // februari
    [2, 1], // mars
    [3, 2], // april -> Q2
    [4, 2],
    [5, 2],
    [6, 3], // juli -> Q3
    [7, 3],
    [8, 3],
    [9, 4], // oktober -> Q4
    [10, 4],
    [11, 4], // december
  ])("månad-index %i ger kvartal Q%i", (manadIndex, forvantatKvartal) => {
    const datum = new Date(2026, manadIndex, 15);
    expect(beraknaKvartal(datum)).toBe(`2026-Q${forvantatKvartal}`);
  });

  it("använder det angivna årtalet, inte alltid innevarande år", () => {
    expect(beraknaKvartal(new Date(2027, 0, 1))).toBe("2027-Q1");
  });

  it("utan argument använder nuvarande datum (returnerar en giltig ÅÅÅÅ-Qn-sträng)", () => {
    expect(beraknaKvartal()).toMatch(/^\d{4}-Q[1-4]$/);
  });
});
