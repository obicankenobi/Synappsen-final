import { describe, it, expect } from "vitest";
import { berakLeverantorSignaler, berakAtagandeSignaler, SIGNAL_ALLVARLIGHET } from "./leverantorSignaler";

const NU = new Date("2026-08-16T12:00:00.000Z");

function org(overrides) {
  return {
    orgId: "orgA",
    namn: "Org A",
    status: "aktiv",
    arDemo: false,
    avtalsstatus: "aktiv",
    provperiodSlut: null,
    raderingSchemalagdTill: null,
    supportAtkomstTill: null,
    sokkvotIdag: 0,
    sokkvotTakPerDygn: null,
    skapad: null,
    avtalsstatusAndrad: null,
    ...overrides,
  };
}

describe("berakLeverantorSignaler", () => {
  it("ger ingen signal för en helt frisk organisation", () => {
    expect(berakLeverantorSignaler([org({})], { orgTakStandard: 50 }, NU)).toEqual([]);
  });

  it("demo-organisationen ger ALDRIG en signal, oavsett hur illa den ser ut (krav 29)", () => {
    const signaler = berakLeverantorSignaler(
      [
        org({
          arDemo: true,
          status: "pausad",
          provperiodSlut: "2026-01-01",
          raderingSchemalagdTill: "2026-08-01T00:00:00.000Z",
        }),
      ],
      { orgTakStandard: 50 },
      NU
    );
    expect(signaler).toEqual([]);
  });

  it("provperiod som går ut inom 14 dagar ger MEDEL", () => {
    const [signal] = berakLeverantorSignaler([org({ provperiodSlut: "2026-08-25" })], null, NU);
    expect(signal.typ).toBe("provperiod_slutar_snart");
    expect(signal.allvarlighet).toBe(SIGNAL_ALLVARLIGHET.MEDEL);
  });

  it("provperiod som redan gått ut ger HÖG, inte MEDEL", () => {
    const [signal] = berakLeverantorSignaler([org({ provperiodSlut: "2026-08-01" })], null, NU);
    expect(signal.typ).toBe("provperiod_utgangen");
    expect(signal.allvarlighet).toBe(SIGNAL_ALLVARLIGHET.HOG);
  });

  it("provperiod långt i framtiden ger ingen signal", () => {
    expect(berakLeverantorSignaler([org({ provperiodSlut: "2027-01-01" })], null, NU)).toEqual([]);
  });

  it("nära sökkvottaket (eget tak) ger en signal, under tröskeln gör det inte", () => {
    const nara = berakLeverantorSignaler([org({ sokkvotIdag: 40, sokkvotTakPerDygn: 50 })], null, NU);
    expect(nara).toHaveLength(1);
    expect(nara[0].typ).toBe("sokkvot_nara_tak");

    const langtIfran = berakLeverantorSignaler([org({ sokkvotIdag: 10, sokkvotTakPerDygn: 50 })], null, NU);
    expect(langtIfran).toEqual([]);
  });

  it("saknas eget tak används standardtaket från sokkvot-objektet", () => {
    const signaler = berakLeverantorSignaler([org({ sokkvotIdag: 45 })], { orgTakStandard: 50 }, NU);
    expect(signaler).toHaveLength(1);
    expect(signaler[0].typ).toBe("sokkvot_nara_tak");
  });

  it("aktivt supportfönster ger LÅG, ett utgånget fönster ger ingen signal", () => {
    const aktivt = berakLeverantorSignaler(
      [org({ supportAtkomstTill: "2026-08-20T00:00:00.000Z" })],
      null,
      NU
    );
    expect(aktivt).toHaveLength(1);
    expect(aktivt[0].allvarlighet).toBe(SIGNAL_ALLVARLIGHET.LAG);

    const utgånget = berakLeverantorSignaler(
      [org({ supportAtkomstTill: "2026-08-01T00:00:00.000Z" })],
      null,
      NU
    );
    expect(utgånget).toEqual([]);
  });

  it("pausad utan schemalagd radering ger en signal, pausad MED radering ger bara raderingssignalen", () => {
    const glomd = berakLeverantorSignaler([org({ status: "pausad" })], null, NU);
    expect(glomd.map((s) => s.typ)).toEqual(["pausad_utan_radering"]);

    const raderas = berakLeverantorSignaler(
      [org({ status: "pausad", raderingSchemalagdTill: "2026-08-20T00:00:00.000Z" })],
      null,
      NU
    );
    expect(raderas.map((s) => s.typ)).toEqual(["radering_schemalagd"]);
  });

  it("stillastående offert (≥30 dagar sedan avtalsstatusAndrad) ger en signal", () => {
    const signaler = berakLeverantorSignaler(
      [org({ avtalsstatus: "offert", avtalsstatusAndrad: "2026-07-01T00:00:00.000Z" })],
      null,
      NU
    );
    expect(signaler.map((s) => s.typ)).toEqual(["offert_stillastaende"]);
  });

  it("en färsk offert (< 30 dagar) ger INGEN signal", () => {
    const signaler = berakLeverantorSignaler(
      [org({ avtalsstatus: "offert", avtalsstatusAndrad: "2026-08-10T00:00:00.000Z" })],
      null,
      NU
    );
    expect(signaler).toEqual([]);
  });

  it("saknas avtalsstatusAndrad används skapad som fallback", () => {
    const signaler = berakLeverantorSignaler(
      [org({ avtalsstatus: "offert", avtalsstatusAndrad: null, skapad: "2026-06-01T00:00:00.000Z" })],
      null,
      NU
    );
    expect(signaler.map((s) => s.typ)).toEqual(["offert_stillastaende"]);
  });

  it("en offert utan VARKEN avtalsstatusAndrad eller skapad ger ingen signal (inget att jämföra mot)", () => {
    const signaler = berakLeverantorSignaler(
      [org({ avtalsstatus: "offert", avtalsstatusAndrad: null, skapad: null })],
      null,
      NU
    );
    expect(signaler).toEqual([]);
  });

  it("en organisation med flera problem ger flera signaler, sorterade HÖG före MEDEL före LÅG", () => {
    const signaler = berakLeverantorSignaler(
      [
        org({
          supportAtkomstTill: "2026-08-20T00:00:00.000Z", // LÅG
          status: "pausad", // MEDEL (pausad_utan_radering)
          provperiodSlut: "2026-08-01", // HÖG (redan utgången)
        }),
      ],
      null,
      NU
    );
    expect(signaler.map((s) => s.allvarlighet)).toEqual([
      SIGNAL_ALLVARLIGHET.HOG,
      SIGNAL_ALLVARLIGHET.MEDEL,
      SIGNAL_ALLVARLIGHET.LAG,
    ]);
  });
});

describe("berakAtagandeSignaler (Etapp L1o)", () => {
  function atagande(overrides) {
    return {
      id: "test-atagande",
      vad: "Teståtagande",
      intervallManader: 6,
      senastUtfort: null,
      ...overrides,
    };
  }

  it("ett åtagande utan senastUtfort är omedelbart förfallet", () => {
    const signaler = berakAtagandeSignaler([atagande({})], NU);
    expect(signaler).toHaveLength(1);
    expect(signaler[0].orgId).toBeNull();
    expect(signaler[0].text).toContain("aldrig registrerat");
  });

  it("ett nyligen utfört åtagande ger ingen signal", () => {
    const signaler = berakAtagandeSignaler(
      [atagande({ senastUtfort: "2026-08-20T00:00:00.000Z", intervallManader: 6 })],
      NU
    );
    expect(signaler).toEqual([]);
  });

  it("slår exakt vid intervallets utgång, inte tidigare", () => {
    // NU = 2026-08-16. 6 månader före är 2026-02-16 – en dag senare ska INTE förfalla än.
    const strax_innan = berakAtagandeSignaler(
      [atagande({ senastUtfort: "2026-02-17T12:00:00.000Z", intervallManader: 6 })],
      NU
    );
    expect(strax_innan).toEqual([]);

    const exakt = berakAtagandeSignaler(
      [atagande({ senastUtfort: "2026-02-16T12:00:00.000Z", intervallManader: 6 })],
      NU
    );
    expect(exakt).toHaveLength(1);
  });

  it("flera åtaganden ger flera oberoende signaler", () => {
    const signaler = berakAtagandeSignaler(
      [atagande({ id: "a", vad: "A" }), atagande({ id: "b", vad: "B" })],
      NU
    );
    expect(signaler).toHaveLength(2);
    expect(signaler.map((s) => s.typ)).toEqual(["atagande_forfallet_a", "atagande_forfallet_b"]);
  });

  it("tom eller saknad kalender ger inga signaler, kraschar inte", () => {
    expect(berakAtagandeSignaler([], NU)).toEqual([]);
    expect(berakAtagandeSignaler(undefined, NU)).toEqual([]);
  });
});
