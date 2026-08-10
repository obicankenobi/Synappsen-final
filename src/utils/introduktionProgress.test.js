// Etapp 61b (ETAPPLAN12.md): berakraIntroduktionsProgress/liggerEfter driver introduktions-
// spårets "ligger efter"-flaggning – en felräkning här skulle antingen dölja att en nyanställd
// faktiskt halkat efter, eller falskt flagga någon som redan är ikapp.
import { describe, it, expect } from "vitest";
import { berakraIntroduktionsProgress, dagarSedan, liggerEfter } from "./introduktionProgress";

function tidsstampel(dagarSedanNu) {
  const ms = Date.now() - dagarSedanNu * 24 * 60 * 60 * 1000;
  return { toDate: () => new Date(ms) };
}

describe("berakraIntroduktionsProgress", () => {
  const ETAPPER = [
    { namn: "Dag 1", poster: [{ typ: "rutin", id: "r1" }, { typ: "rutin", id: "r2" }] },
    { namn: "Vecka 1", poster: [{ typ: "anslag", id: "a1" }] },
  ];

  it("0 % och tom detaljlista för ett spår utan etapper", () => {
    const resultat = berakraIntroduktionsProgress([], "uid1", new Map());
    expect(resultat).toEqual({ detaljer: [], klara: 0, totalt: 0, procent: 0 });
  });

  it("räknar en post som klar bara om MIN uid finns i dess lasteAv", () => {
    const karta = new Map([
      ["rutin:r1", { titel: "R1", sokvag: "/x#r1", lasteAv: [{ uid: "uid1" }] }],
      ["rutin:r2", { titel: "R2", sokvag: "/x#r2", lasteAv: [{ uid: "annanAnvandare" }] }],
      ["anslag:a1", { titel: "A1", sokvag: "/anslag", lasteAv: [] }],
    ]);
    const resultat = berakraIntroduktionsProgress(ETAPPER, "uid1", karta);
    expect(resultat.klara).toBe(1);
    expect(resultat.totalt).toBe(3);
    expect(resultat.procent).toBe(33);
    const r1 = resultat.detaljer.find((d) => d.id === "r1");
    const r2 = resultat.detaljer.find((d) => d.id === "r2");
    expect(r1.klar).toBe(true);
    expect(r2.klar).toBe(false);
  });

  it("innehåll som saknas i kartan (borttaget) markeras tydligt, kraschar inte", () => {
    const resultat = berakraIntroduktionsProgress(
      [{ namn: "Dag 1", poster: [{ typ: "rutin", id: "borttagen" }] }],
      "uid1",
      new Map()
    );
    expect(resultat.detaljer[0]).toMatchObject({ titel: "(borttaget innehåll)", sokvag: null, klar: false });
  });

  it("100 % när alla poster är kvitterade av uid", () => {
    const karta = new Map([
      ["rutin:r1", { titel: "R1", sokvag: "/x", lasteAv: [{ uid: "uid1" }] }],
      ["rutin:r2", { titel: "R2", sokvag: "/x", lasteAv: [{ uid: "uid1" }] }],
      ["anslag:a1", { titel: "A1", sokvag: "/anslag", lasteAv: [{ uid: "uid1" }] }],
    ]);
    expect(berakraIntroduktionsProgress(ETAPPER, "uid1", karta).procent).toBe(100);
  });
});

describe("dagarSedan", () => {
  it("0 för en tilldelning utan giltig timestamp", () => {
    expect(dagarSedan(null)).toBe(0);
    expect(dagarSedan(undefined)).toBe(0);
    expect(dagarSedan({})).toBe(0);
  });

  it("räknar hela dagar sedan tilldelningen (avrundat nedåt)", () => {
    expect(dagarSedan(tidsstampel(5))).toBe(5);
    expect(dagarSedan(tidsstampel(0.5))).toBe(0);
  });
});

describe("liggerEfter", () => {
  it("false om alla poster är klara, oavsett rekommenderadDag", () => {
    const detaljer = [{ klar: true, rekommenderadDag: 1 }, { klar: true, rekommenderadDag: 2 }];
    expect(liggerEfter(detaljer, 30)).toBe(false);
  });

  it("true om en OKLAR post har passerat sin rekommenderade dag", () => {
    const detaljer = [{ klar: false, rekommenderadDag: 3 }];
    expect(liggerEfter(detaljer, 10)).toBe(true);
  });

  it("false om en oklar posts rekommenderade dag ännu inte passerat", () => {
    const detaljer = [{ klar: false, rekommenderadDag: 10 }];
    expect(liggerEfter(detaljer, 3)).toBe(false);
  });

  it("en post utan rekommenderadDag (default 0) räknas som förfallen direkt om oklar", () => {
    const detaljer = [{ klar: false }];
    expect(liggerEfter(detaljer, 1)).toBe(true);
  });
});
