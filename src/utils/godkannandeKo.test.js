import { describe, it, expect } from "vitest";
import { byggGodkannandeKo } from "./godkannandeKo";

describe("byggGodkannandeKo", () => {
  it("kombinerar utkast från flera områden man har behörighet för", () => {
    const resultat = byggGodkannandeKo({
      rutinerPerOmrade: {
        "kliniskt-stod": [{ id: "r1", titel: "A", status: "utkast" }, { id: "r2", titel: "B", status: "godkand" }],
        administration: [{ id: "r3", titel: "C", status: "utkast" }],
      },
      behorighet: { "kliniskt-stod": true, administration: true },
    });
    expect(resultat.utkast.map((u) => u.id)).toEqual(["r1", "r3"]);
    expect(resultat.antal).toBe(2);
  });

  it("utesluter ett område man saknar behörighet för, även om det har utkast", () => {
    const resultat = byggGodkannandeKo({
      rutinerPerOmrade: { administration: [{ id: "r1", titel: "A", status: "utkast" }] },
      behorighet: { "kliniskt-stod": true },
    });
    expect(resultat.utkast).toEqual([]);
  });

  it("inkluderar förrådsartikel-utkast bara med logistik-behörighet", () => {
    const utanBehorighet = byggGodkannandeKo({
      artiklar: [{ id: "a1", namn: "Nålar", status: "utkast" }],
      behorighet: {},
    });
    expect(utanBehorighet.utkast).toEqual([]);

    const medBehorighet = byggGodkannandeKo({
      artiklar: [{ id: "a1", namn: "Nålar", status: "utkast" }],
      behorighet: { logistik: true },
    });
    expect(medBehorighet.utkast).toEqual([
      { typ: "forradsartikel", omrade: "logistik", id: "a1", titel: "Nålar", skapad: undefined },
    ]);
  });

  it("tar med väntande ändringsförslag separat från utkast, och räknar in dem i antal", () => {
    const resultat = byggGodkannandeKo({
      forslagPerOmrade: {
        "kliniskt-stod": [
          { id: "f1", status: "ny", rutinTitel: "Sepsis" },
          { id: "f2", status: "infort", rutinTitel: "Redan klar" },
        ],
      },
      behorighet: { "kliniskt-stod": true },
    });
    expect(resultat.forslag.map((f) => f.id)).toEqual(["f1"]);
    expect(resultat.antal).toBe(1);
  });

  it("returnerar tomt utan någon data alls", () => {
    expect(byggGodkannandeKo({})).toEqual({ utkast: [], forslag: [], antal: 0 });
  });
});
