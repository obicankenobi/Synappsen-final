import { describe, it, expect } from "vitest";
import { berakningHalsa, sammanstallHalsa, HALSOFLAGGOR } from "./innehallshalsa";

function tidsstampel(datum) {
  return { toDate: () => datum };
}

function dagarSedan(antal) {
  const d = new Date();
  d.setDate(d.getDate() - antal);
  return d;
}

function godkandRutin(overrides = {}) {
  return {
    id: "r1",
    titel: "Test",
    omrade: "kliniskt-stod",
    status: "godkand",
    granskadDatum: tidsstampel(dagarSedan(10)),
    agare: { typ: "roll", roll: "vol" },
    lasteAv: [{ uid: "u1", tidpunkt: tidsstampel(dagarSedan(5)) }],
    kallVarning: false,
    ...overrides,
  };
}

describe("berakningHalsa", () => {
  it("en frisk rutin har inga flaggor", () => {
    const flaggor = berakningHalsa(godkandRutin());
    expect(Object.values(flaggor).every((v) => v === false)).toBe(true);
  });

  it("flaggar en rutin som bör granskas", () => {
    const flaggor = berakningHalsa(godkandRutin({ granskadDatum: tidsstampel(dagarSedan(200)) }));
    expect(flaggor.passeratGranskningsdatum).toBe(true);
  });

  it("flaggar en rutin utan ägare", () => {
    const flaggor = berakningHalsa(godkandRutin({ agare: null }));
    expect(flaggor.saknarAgare).toBe(true);
  });

  it("flaggar en rutin som ingen kvitterat", () => {
    const flaggor = berakningHalsa(godkandRutin({ lasteAv: [] }));
    expect(flaggor.aldrigKvitterad).toBe(true);
  });

  it("behandlar saknad lasteAv-array som aldrig kvitterad", () => {
    const flaggor = berakningHalsa(godkandRutin({ lasteAv: undefined }));
    expect(flaggor.aldrigKvitterad).toBe(true);
  });

  it("flaggar en obesvarad källvarning", () => {
    const flaggor = berakningHalsa(godkandRutin({ kallVarning: true }));
    expect(flaggor.obesvaradKallvarning).toBe(true);
  });

  it("flaggar en utgången rutin", () => {
    const flaggor = berakningHalsa(godkandRutin({ utgangsdatum: "2020-01-01" }));
    expect(flaggor.utgangen).toBe(true);
  });
});

describe("sammanstallHalsa", () => {
  it("returnerar null-siffra (inte 0) när det inte finns några godkända rutiner", () => {
    const resultat = sammanstallHalsa([]);
    expect(resultat.halsosiffra).toBeNull();
    expect(resultat.total).toBe(0);
  });

  it("ignorerar utkast helt", () => {
    const resultat = sammanstallHalsa([
      godkandRutin({ id: "utkast1", status: "utkast", agare: null }),
    ]);
    expect(resultat.total).toBe(0);
    expect(resultat.halsosiffra).toBeNull();
  });

  it("räknar 100% när alla rutiner är friska", () => {
    const resultat = sammanstallHalsa([godkandRutin({ id: "a" }), godkandRutin({ id: "b" })]);
    expect(resultat.halsosiffra).toBe(100);
    expect(resultat.utanFlaggor).toBe(2);
  });

  it("räknar en korrekt kvot när hälften har minst en flagga", () => {
    const resultat = sammanstallHalsa([
      godkandRutin({ id: "frisk" }),
      godkandRutin({ id: "sjuk", agare: null }),
    ]);
    expect(resultat.halsosiffra).toBe(50);
  });

  it("nedbrytningen summerar korrekt per flagga, oberoende av siffran", () => {
    const resultat = sammanstallHalsa([
      godkandRutin({ id: "a", agare: null }),
      godkandRutin({ id: "b", agare: null }),
      godkandRutin({ id: "c", kallVarning: true }),
    ]);
    expect(resultat.nedbrytning.saknarAgare).toBe(2);
    expect(resultat.nedbrytning.obesvaradKallvarning).toBe(1);
    for (const flagga of HALSOFLAGGOR) {
      expect(resultat.nedbrytning).toHaveProperty(flagga);
    }
  });

  it("sorterar posterna med flest flaggor först", () => {
    const resultat = sammanstallHalsa([
      godkandRutin({ id: "frisk" }),
      godkandRutin({ id: "flera-flaggor", agare: null, kallVarning: true, lasteAv: [] }),
    ]);
    expect(resultat.poster[0].id).toBe("flera-flaggor");
    expect(resultat.poster[0].antalFlaggor).toBe(3);
  });
});
