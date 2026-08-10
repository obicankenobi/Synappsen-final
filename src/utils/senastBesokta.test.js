// @vitest-environment happy-dom
// Etapp 61b (ETAPPLAN12.md): ren UX-bekvämlighet (ingen dataförlustrisk i sig, till skillnad
// från offlineKo/checklistFramsteg), men testad i samma svep eftersom planen grupperar dem –
// och en trasig MAX_ANTAL-gräns eller dubblettbugg är precis den sortens fel en snabb
// enhetstest fångar direkt.
import { describe, it, expect, beforeEach } from "vitest";
import { lasSenastBesokta, registreraBesok } from "./senastBesokta";

beforeEach(() => {
  localStorage.clear();
});

describe("lasSenastBesokta", () => {
  it("returnerar en tom lista utan tidigare besök", () => {
    expect(lasSenastBesokta()).toEqual([]);
  });

  it("returnerar en tom lista (kraschar inte) om lagrat innehåll är trasig JSON", () => {
    localStorage.setItem("synappsen_senast_besokta", "{trasig");
    expect(lasSenastBesokta()).toEqual([]);
  });
});

describe("registreraBesok", () => {
  it("lägger till ett besök överst i listan", () => {
    registreraBesok({ id: "r1", titel: "Rutin 1", sokvag: "/kliniskt-stod#r1" });
    expect(lasSenastBesokta()).toEqual([{ id: "r1", titel: "Rutin 1", sokvag: "/kliniskt-stod#r1" }]);
  });

  it("ett återbesök av samma rutin flyttar den överst istället för att skapa en dubblett", () => {
    registreraBesok({ id: "r1", titel: "Rutin 1", sokvag: "/a#r1" });
    registreraBesok({ id: "r2", titel: "Rutin 2", sokvag: "/a#r2" });
    registreraBesok({ id: "r1", titel: "Rutin 1", sokvag: "/a#r1" });
    const lista = lasSenastBesokta();
    expect(lista).toHaveLength(2);
    expect(lista[0].id).toBe("r1");
    expect(lista[1].id).toBe("r2");
  });

  it("saknas id/titel/sokvag → ingenting sparas", () => {
    registreraBesok({ id: "", titel: "Rutin", sokvag: "/a" });
    registreraBesok({ id: "r1", titel: "", sokvag: "/a" });
    registreraBesok({ id: "r1", titel: "Rutin", sokvag: "" });
    expect(lasSenastBesokta()).toEqual([]);
  });

  it("håller max 8 poster, äldst faller bort när en nionde läggs till", () => {
    for (let i = 1; i <= 9; i++) {
      registreraBesok({ id: `r${i}`, titel: `Rutin ${i}`, sokvag: `/a#r${i}` });
    }
    const lista = lasSenastBesokta();
    expect(lista).toHaveLength(8);
    expect(lista[0].id).toBe("r9");
    expect(lista.map((p) => p.id)).not.toContain("r1");
  });
});
