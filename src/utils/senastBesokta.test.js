// @vitest-environment happy-dom
// Etapp 61b (ETAPPLAN12.md): ren UX-bekvämlighet (ingen dataförlustrisk i sig, till skillnad
// från offlineKo/checklistFramsteg), men testad i samma svep eftersom planen grupperar dem –
// och en trasig MAX_ANTAL-gräns eller dubblettbugg är precis den sortens fel en snabb
// enhetstest fångar direkt.
//
// Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.2): samtliga anrop tar numera uid som första
// argument. Nyckeln var tidigare global per enhet, vilket läckte föregående användares
// besökshistorik till nästa person på en delad dator – se senastBesokta.js för hela kedjan.
import { describe, it, expect, beforeEach } from "vitest";
import {
  lasSenastBesokta,
  registreraBesok,
  rensaGammalDelalNyckel,
  rensaAllaSenastBesokta,
} from "./senastBesokta";

const A = "uidA";
const B = "uidB";

beforeEach(() => {
  localStorage.clear();
});

describe("lasSenastBesokta", () => {
  it("returnerar en tom lista utan tidigare besök", () => {
    expect(lasSenastBesokta(A)).toEqual([]);
  });

  it("returnerar en tom lista (kraschar inte) om lagrat innehåll är trasig JSON", () => {
    localStorage.setItem(`synappsen_senast_besokta_${A}`, "{trasig");
    expect(lasSenastBesokta(A)).toEqual([]);
  });

  it("returnerar en tom lista utan uid (utloggad) i stället för något delat", () => {
    expect(lasSenastBesokta(undefined)).toEqual([]);
  });
});

describe("registreraBesok", () => {
  it("lägger till ett besök överst i listan", () => {
    registreraBesok(A, { id: "r1", titel: "Rutin 1", sokvag: "/kliniskt-stod#r1" });
    expect(lasSenastBesokta(A)).toEqual([{ id: "r1", titel: "Rutin 1", sokvag: "/kliniskt-stod#r1" }]);
  });

  it("ett återbesök av samma rutin flyttar den överst istället för att skapa en dubblett", () => {
    registreraBesok(A, { id: "r1", titel: "Rutin 1", sokvag: "/a#r1" });
    registreraBesok(A, { id: "r2", titel: "Rutin 2", sokvag: "/a#r2" });
    registreraBesok(A, { id: "r1", titel: "Rutin 1", sokvag: "/a#r1" });
    const lista = lasSenastBesokta(A);
    expect(lista).toHaveLength(2);
    expect(lista[0].id).toBe("r1");
    expect(lista[1].id).toBe("r2");
  });

  it("saknas id/titel/sokvag → ingenting sparas", () => {
    registreraBesok(A, { id: "", titel: "Rutin", sokvag: "/a" });
    registreraBesok(A, { id: "r1", titel: "", sokvag: "/a" });
    registreraBesok(A, { id: "r1", titel: "Rutin", sokvag: "" });
    expect(lasSenastBesokta(A)).toEqual([]);
  });

  it("saknas uid → ingenting sparas (ingen delad enhetsnyckel)", () => {
    registreraBesok(undefined, { id: "r1", titel: "Rutin", sokvag: "/a" });
    expect(Object.keys(localStorage)).toHaveLength(0);
  });

  it("håller max 8 poster, äldst faller bort när en nionde läggs till", () => {
    for (let i = 1; i <= 9; i++) {
      registreraBesok(A, { id: `r${i}`, titel: `Rutin ${i}`, sokvag: `/a#r${i}` });
    }
    const lista = lasSenastBesokta(A);
    expect(lista).toHaveLength(8);
    expect(lista[0].id).toBe("r9");
    expect(lista.map((p) => p.id)).not.toContain("r1");
  });
});

// Fynd 3.2 – de tre testerna nedan MISSLYCKADES före patchen (nyckeln var global, så A:s och
// B:s listor var samma lista, och den gamla nyckeln städades aldrig bort).
describe("delad enhet (fynd 3.2)", () => {
  it("två användare på samma enhet ser inte varandras besökshistorik", () => {
    registreraBesok(A, { id: "r1", titel: "A:s rutin", sokvag: "/a#r1" });
    expect(lasSenastBesokta(B)).toEqual([]);

    registreraBesok(B, { id: "r2", titel: "B:s rutin", sokvag: "/a#r2" });
    expect(lasSenastBesokta(A).map((p) => p.id)).toEqual(["r1"]);
    expect(lasSenastBesokta(B).map((p) => p.id)).toEqual(["r2"]);
  });

  it("den gamla kontolösa nyckeln tas bort från enheten, inte bara ignoreras", () => {
    localStorage.setItem(
      "synappsen_senast_besokta",
      JSON.stringify([{ id: "gammal", titel: "Föregående persons rutin", sokvag: "/a#gammal" }])
    );
    rensaGammalDelalNyckel();
    expect(localStorage.getItem("synappsen_senast_besokta")).toBeNull();
  });

  it("utloggningsstädningen tömmer alla användares listor på enheten", () => {
    registreraBesok(A, { id: "r1", titel: "A", sokvag: "/a#r1" });
    registreraBesok(B, { id: "r2", titel: "B", sokvag: "/a#r2" });
    localStorage.setItem("synappsen_senast_besokta", "[]");
    localStorage.setItem("tema", "morkt");

    rensaAllaSenastBesokta();

    expect(lasSenastBesokta(A)).toEqual([]);
    expect(lasSenastBesokta(B)).toEqual([]);
    expect(localStorage.getItem("synappsen_senast_besokta")).toBeNull();
    // Enhetsinställningar är medvetet kvar – de innehåller ingen användardata.
    expect(localStorage.getItem("tema")).toBe("morkt");
  });
});
