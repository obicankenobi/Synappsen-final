import { describe, it, expect } from "vitest";
import { kvitteringsgradForRutin, kvitteringsgradPerRutin } from "./kvitteringsgrad";

describe("kvitteringsgradForRutin", () => {
  it("returnerar null om ingen personal finns att räkna mot", () => {
    expect(kvitteringsgradForRutin({ lasteAv: [] }, 0)).toBeNull();
    expect(kvitteringsgradForRutin({ lasteAv: [] }, null)).toBeNull();
  });

  it("räknar andelen kvitterat av totalen, avrundat", () => {
    const rutin = { lasteAv: [{ uid: "a" }, { uid: "b" }, { uid: "c" }] };
    expect(kvitteringsgradForRutin(rutin, 4)).toBe(75);
  });

  it("behandlar en rutin utan lasteAv som 0 % kvitterad", () => {
    expect(kvitteringsgradForRutin({}, 5)).toBe(0);
  });

  it("klipper aldrig över 100 % även om lasteAv råkar innehålla fler poster än antalAnvandare", () => {
    const rutin = { lasteAv: [{ uid: "a" }, { uid: "b" }, { uid: "c" }] };
    expect(kvitteringsgradForRutin(rutin, 2)).toBe(100);
  });
});

describe("kvitteringsgradPerRutin", () => {
  it("bygger en post per rutin, sorterad på titel", () => {
    const rutiner = [
      { id: "r2", titel: "Övning", omrade: "administration", lasteAv: [{ uid: "a" }] },
      { id: "r1", titel: "Akut", omrade: "kliniskt-stod", lasteAv: [] },
    ];
    const resultat = kvitteringsgradPerRutin(rutiner, 2);
    expect(resultat.map((r) => r.id)).toEqual(["r1", "r2"]);
    expect(resultat[0]).toMatchObject({ antalKvitterat: 0, antalTotalt: 2, andel: 0 });
    expect(resultat[1]).toMatchObject({ antalKvitterat: 1, antalTotalt: 2, andel: 50 });
  });

  it("hanterar en tom lista", () => {
    expect(kvitteringsgradPerRutin([], 5)).toEqual([]);
  });
});
