import { describe, it, expect } from "vitest";
import { beraknaEkonomiOversikt } from "./leverantorEkonomi";

function org(overrides) {
  return {
    orgId: "orgA",
    namn: "Org A",
    arDemo: false,
    avtaladArsavgiftKr: null,
    senasteKostnad: null,
    kostnadshistorikSenaste: [],
    ...overrides,
  };
}

describe("beraknaEkonomiOversikt", () => {
  it("en tom lista ger noll överallt, kraschar inte", () => {
    const resultat = beraknaEkonomiOversikt([]);
    expect(resultat.arrSummaKr).toBe(0);
    expect(resultat.antalMedPris).toBe(0);
    expect(resultat.antalUtanPris).toBe(0);
    expect(resultat.perKund).toEqual([]);
  });

  it("demo-organisationen räknas aldrig med", () => {
    const resultat = beraknaEkonomiOversikt([org({ arDemo: true, avtaladArsavgiftKr: 100000 })]);
    expect(resultat.perKund).toHaveLength(0);
  });

  it("summerar ARR bara för organisationer med satt pris", () => {
    const resultat = beraknaEkonomiOversikt([
      org({ orgId: "a", avtaladArsavgiftKr: 60000 }),
      org({ orgId: "b", avtaladArsavgiftKr: 120000 }),
      org({ orgId: "c", avtaladArsavgiftKr: null }),
    ]);
    expect(resultat.arrSummaKr).toBe(180000);
    expect(resultat.antalMedPris).toBe(2);
    expect(resultat.antalUtanPris).toBe(1);
    expect(resultat.snittArrKr).toBe(90000);
    expect(resultat.orgUtanPris.map((o) => o.orgId)).toEqual(["c"]);
  });

  it("räknar marginal = årsavgift/12 minus senaste månadens kostnad", () => {
    const resultat = beraknaEkonomiOversikt([
      org({ avtaladArsavgiftKr: 120000, senasteKostnad: { anvantOre: 500000 } }), // 5000 kr
    ]);
    // 120000/12 = 10000, minus 5000 = 5000
    expect(resultat.perKund[0].marginalKr).toBe(5000);
  });

  it("marginal är null när priset saknas, aldrig en gissning", () => {
    const resultat = beraknaEkonomiOversikt([org({ avtaladArsavgiftKr: null, senasteKostnad: { anvantOre: 500000 } })]);
    expect(resultat.perKund[0].marginalKr).toBeNull();
  });

  it("flaggar negativ marginal separat", () => {
    const resultat = beraknaEkonomiOversikt([
      org({ orgId: "dyr", avtaladArsavgiftKr: 12000, senasteKostnad: { anvantOre: 500000 } }), // 1000/mån mot 5000 kostnad
      org({ orgId: "ok", avtaladArsavgiftKr: 120000, senasteKostnad: { anvantOre: 100000 } }),
    ]);
    expect(resultat.negativMarginal.map((k) => k.orgId)).toEqual(["dyr"]);
  });

  it("trend: up/down/stable/null beroende på de två senaste månaderna", () => {
    const upp = beraknaEkonomiOversikt([
      org({ kostnadshistorikSenaste: [{ anvantOre: 200 }, { anvantOre: 100 }] }),
    ]);
    const ner = beraknaEkonomiOversikt([
      org({ kostnadshistorikSenaste: [{ anvantOre: 50 }, { anvantOre: 100 }] }),
    ]);
    const stabil = beraknaEkonomiOversikt([
      org({ kostnadshistorikSenaste: [{ anvantOre: 100 }, { anvantOre: 100 }] }),
    ]);
    const okand = beraknaEkonomiOversikt([org({ kostnadshistorikSenaste: [{ anvantOre: 100 }] })]);

    expect(upp.perKund[0].trend).toBe("up");
    expect(ner.perKund[0].trend).toBe("down");
    expect(stabil.perKund[0].trend).toBe("stable");
    expect(okand.perKund[0].trend).toBeNull();
  });

  it("sorterar fallande på årsavgift, organisationer utan pris sist", () => {
    const resultat = beraknaEkonomiOversikt([
      org({ orgId: "liten", avtaladArsavgiftKr: 50000 }),
      org({ orgId: "utanpris", avtaladArsavgiftKr: null }),
      org({ orgId: "stor", avtaladArsavgiftKr: 200000 }),
    ]);
    expect(resultat.perKund.map((k) => k.orgId)).toEqual(["stor", "liten", "utanpris"]);
  });
});
