import { describe, it, expect } from "vitest";
import { filtreraOchSorteraOrganisationer, SORT_FALT } from "./leverantorFilter";

function org(overrides) {
  return {
    orgId: "org",
    namn: "Namn",
    status: "aktiv",
    avtalsstatus: "aktiv",
    arDemo: false,
    huvudman: null,
    moduler: {},
    antalAnvandare: 0,
    avtaladArsavgiftKr: null,
    senasteKostnad: null,
    provperiodSlut: null,
    ...overrides,
  };
}

describe("filtreraOchSorteraOrganisationer", () => {
  it("utan filter returneras alla, sorterade på namn stigande som standard", () => {
    const resultat = filtreraOchSorteraOrganisationer(
      [org({ orgId: "b", namn: "Björk" }), org({ orgId: "a", namn: "Alfa" })],
      {}
    );
    expect(resultat.map((o) => o.orgId)).toEqual(["a", "b"]);
  });

  it("visaDemo:false döljer demo-organisationen", () => {
    const lista = [org({ orgId: "riktig" }), org({ orgId: "demo", arDemo: true })];
    expect(filtreraOchSorteraOrganisationer(lista, { visaDemo: false }).map((o) => o.orgId)).toEqual(["riktig"]);
    expect(filtreraOchSorteraOrganisationer(lista, { visaDemo: true }).map((o) => o.orgId).sort()).toEqual([
      "demo",
      "riktig",
    ]);
  });

  it("filtrerar på status (drift) och avtalsstatus oberoende av varandra", () => {
    const lista = [
      org({ orgId: "a", status: "aktiv", avtalsstatus: "offert" }),
      org({ orgId: "b", status: "pausad", avtalsstatus: "aktiv" }),
    ];
    expect(filtreraOchSorteraOrganisationer(lista, { status: "pausad" }).map((o) => o.orgId)).toEqual(["b"]);
    expect(filtreraOchSorteraOrganisationer(lista, { avtalsstatus: "offert" }).map((o) => o.orgId)).toEqual(["a"]);
  });

  it("filtrerar på modul", () => {
    const lista = [
      org({ orgId: "a", moduler: { operations: true } }),
      org({ orgId: "b", moduler: { intelligence: true } }),
    ];
    expect(filtreraOchSorteraOrganisationer(lista, { modul: "operations" }).map((o) => o.orgId)).toEqual(["a"]);
  });

  it("fritextsök matchar namn ELLER huvudman, oavsett versaler", () => {
    const lista = [
      org({ orgId: "a", namn: "Akutmottagningen Väst" }),
      org({ orgId: "b", namn: "Annat", huvudman: "Väst-regionen" }),
      org({ orgId: "c", namn: "Ovidkommande" }),
    ];
    const resultat = filtreraOchSorteraOrganisationer(lista, { sok: "väst" });
    expect(resultat.map((o) => o.orgId).sort()).toEqual(["a", "b"]);
  });

  it("snabbfilter 'atgard' matchar bara orgId i den injicerade mängden, och utesluter alltid demo", () => {
    const lista = [
      org({ orgId: "a" }),
      org({ orgId: "b" }),
      org({ orgId: "c", arDemo: true }),
    ];
    const resultat = filtreraOchSorteraOrganisationer(lista, { snabbfilter: "atgard" }, new Set(["a", "c"]));
    expect(resultat.map((o) => o.orgId)).toEqual(["a"]);
  });

  it("sortField 'anvandare' med desc-riktning, saknade värden alltid sist", () => {
    const lista = [
      org({ orgId: "a", antalAnvandare: 5 }),
      org({ orgId: "b", antalAnvandare: 20 }),
      org({ orgId: "c", antalAnvandare: 10 }),
    ];
    const resultat = filtreraOchSorteraOrganisationer(lista, { sortField: SORT_FALT.ANVANDARE, sortRiktning: "desc" });
    expect(resultat.map((o) => o.orgId)).toEqual(["b", "c", "a"]);
  });

  it("saknat avtalat pris hamnar sist BÅDE vid asc och desc", () => {
    const lista = [
      org({ orgId: "utanpris", avtaladArsavgiftKr: null }),
      org({ orgId: "dyr", avtaladArsavgiftKr: 100000 }),
      org({ orgId: "billig", avtaladArsavgiftKr: 10000 }),
    ];
    expect(
      filtreraOchSorteraOrganisationer(lista, { sortField: SORT_FALT.PRIS, sortRiktning: "asc" }).map((o) => o.orgId)
    ).toEqual(["billig", "dyr", "utanpris"]);
    expect(
      filtreraOchSorteraOrganisationer(lista, { sortField: SORT_FALT.PRIS, sortRiktning: "desc" }).map((o) => o.orgId)
    ).toEqual(["dyr", "billig", "utanpris"]);
  });

  it("flera filter kombineras med OCH, inte ELLER", () => {
    const lista = [
      org({ orgId: "matchar-bada", status: "aktiv", modul: undefined, moduler: { operations: true } }),
      org({ orgId: "bara-status", status: "aktiv", moduler: {} }),
      org({ orgId: "bara-modul", status: "pausad", moduler: { operations: true } }),
    ];
    const resultat = filtreraOchSorteraOrganisationer(lista, { status: "aktiv", modul: "operations" });
    expect(resultat.map((o) => o.orgId)).toEqual(["matchar-bada"]);
  });
});
