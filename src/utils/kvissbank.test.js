// Sammanslagningen är frågebankens mest felbenägna del: den avgör vad personal faktiskt får
// se, och ett fel här kan antingen visa en fråga kunden dolt eller tysta hela banken. Den
// centrala egenskapen – att en ORÖRD fråga automatiskt får leverantörens senaste version –
// är dessutom hela skälet till att modellen valdes (se
// granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §5.1) och måste vara bunden i test.
import { describe, expect, it } from "vitest";
import { PAKET, byggKvissbank, paketAktivt, paketMedInnehall, slaIhopFraga } from "./kvissbank";

function global_(overrides = {}) {
  return {
    id: "g1",
    paket: PAKET.YRKESKUNSKAP,
    fraga: "Originalfrågan?",
    alternativ: ["rätt", "fel", "fel2"],
    rattIndex: 0,
    hanvisning: "Originalhänvisning",
    kategori: "sekretess",
    kalla: "Patientdatalagen",
    kallaDatum: "2026-08-27",
    ...overrides,
  };
}

describe("paketAktivt", () => {
  it("är på när ingen sagt något alls", () => {
    expect(paketAktivt(PAKET.YRKESKUNSKAP, {}, {})).toBe(true);
  });

  it("är av när kunden stängt av det", () => {
    expect(paketAktivt(PAKET.YRKESKUNSKAP, { yrkeskunskap: false }, {})).toBe(false);
  });

  it("är av när leverantören nödstoppat det globalt, även om kunden slagit på det", () => {
    expect(
      paketAktivt(PAKET.KLINISKT, { kliniskt: true }, { kliniskt: { avstangt: true } })
    ).toBe(false);
  });

  it("ett globalt stopp som satts tillbaka till false blockerar inte", () => {
    expect(paketAktivt(PAKET.KLINISKT, {}, { kliniskt: { avstangt: false } })).toBe(true);
  });
});

describe("slaIhopFraga", () => {
  it("utan överlagring returneras originalet orört", () => {
    const ut = slaIhopFraga(global_(), undefined);
    expect(ut.fraga).toBe("Originalfrågan?");
    expect(ut.overlagrad).toBe(false);
  });

  it("en dold fråga försvinner helt", () => {
    expect(slaIhopFraga(global_(), { dold: true })).toBeNull();
  });

  it("kundens fält vinner över originalets", () => {
    const ut = slaIhopFraga(global_(), { fraga: "Vår egen formulering?" });
    expect(ut.fraga).toBe("Vår egen formulering?");
    expect(ut.alternativ).toEqual(["rätt", "fel", "fel2"]); // orörda fält behålls
    expect(ut.overlagrad).toBe(true);
  });

  it("källa och källdatum behålls ALLTID från originalet", () => {
    // En omskriven fråga får inte se ut att ha en källa den inte längre följer – men källan
    // ska heller inte försvinna bara för att texten justerats.
    const ut = slaIhopFraga(global_(), { fraga: "Omskriven?", kalla: "Påhittad källa" });
    expect(ut.kalla).toBe("Patientdatalagen");
    expect(ut.kallaDatum).toBe("2026-08-27");
  });

  it("en tom överlagring (bara metadata) räknas inte som en ändring", () => {
    const ut = slaIhopFraga(global_(), { dold: false, andradAv: "uid", andrad: 123 });
    expect(ut.overlagrad).toBe(false);
    expect(ut.fraga).toBe("Originalfrågan?");
  });
});

describe("byggKvissbank", () => {
  it("en orörd fråga följer med leverantörens senaste version", () => {
    // Kärnegenskapen i hela modellen: ingen överlagring = central rättelse slår igenom.
    const bank = byggKvissbank({ globalaFragor: [global_({ fraga: "Rättad text?" })] });
    expect(bank).toHaveLength(1);
    expect(bank[0].fraga).toBe("Rättad text?");
  });

  it("frågor i ett avstängt paket kommer inte med", () => {
    const bank = byggKvissbank({
      globalaFragor: [global_()],
      kundensVal: { yrkeskunskap: false },
    });
    expect(bank).toEqual([]);
  });

  it("det globala nödstoppet tystar paketet oavsett kundens val", () => {
    const bank = byggKvissbank({
      globalaFragor: [global_({ paket: PAKET.KLINISKT })],
      kundensVal: { kliniskt: true },
      globaltStopp: { kliniskt: { avstangt: true } },
    });
    expect(bank).toEqual([]);
  });

  it("dolda frågor filtreras bort men resten av paketet blir kvar", () => {
    const bank = byggKvissbank({
      globalaFragor: [global_({ id: "g1" }), global_({ id: "g2" })],
      overlagringar: { g1: { dold: true } },
    });
    expect(bank.map((f) => f.id)).toEqual(["g2"]);
  });

  it("kundens egna frågor kommer med i paketet 'eget'", () => {
    const bank = byggKvissbank({
      egnaFragor: [{ id: "e1", fraga: "Vår fråga?", alternativ: ["a", "b", "c"], rattIndex: 0 }],
    });
    expect(bank).toHaveLength(1);
    expect(bank[0].paket).toBe(PAKET.EGET);
  });

  it("egna frågor kan stängas av som ett eget paket", () => {
    const bank = byggKvissbank({
      egnaFragor: [{ id: "e1", fraga: "?", alternativ: ["a", "b", "c"], rattIndex: 0 }],
      kundensVal: { eget: false },
    });
    expect(bank).toEqual([]);
  });

  it("en överlagring vars original tagits bort ignoreras utan att kasta", () => {
    // taBortGlobalKvissfraga städar medvetet inte kundernas överlagringar – de blir
    // föräldralösa och måste vara ofarliga.
    const bank = byggKvissbank({
      globalaFragor: [],
      overlagringar: { borttagen: { fraga: "Spöke?" } },
    });
    expect(bank).toEqual([]);
  });

  it("helt tomma indata ger en tom bank i stället för att kasta", () => {
    expect(byggKvissbank()).toEqual([]);
  });
});

describe("paketMedInnehall", () => {
  it("räknar bara paket som faktiskt har en synlig fråga", () => {
    const bank = byggKvissbank({
      globalaFragor: [global_({ id: "a", paket: PAKET.YRKESKUNSKAP })],
      egnaFragor: [{ id: "e1", fraga: "?", alternativ: ["a", "b", "c"], rattIndex: 0 }],
    });
    expect(paketMedInnehall(bank).sort()).toEqual([PAKET.EGET, PAKET.YRKESKUNSKAP].sort());
  });

  it("ger tomt för en tom bank", () => {
    expect(paketMedInnehall([])).toEqual([]);
  });
});
