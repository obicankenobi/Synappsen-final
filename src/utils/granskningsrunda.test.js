import { describe, it, expect } from "vitest";
import { berakningRundaFramsteg } from "./granskningsrunda";

function tidsstampel(datum) {
  return { toMillis: () => datum.getTime() };
}

function dagarSedan(antal) {
  const d = new Date();
  d.setDate(d.getDate() - antal);
  return d;
}

describe("berakningRundaFramsteg", () => {
  it("räknar en rutin som granskad om granskadDatum ligger EFTER att rundan startade", () => {
    const runda = { skapad: tidsstampel(dagarSedan(10)), rutinIds: ["r1"] };
    const rutiner = [{ id: "r1", titel: "Rutin 1", omrade: "kliniskt-stod", granskadDatum: tidsstampel(dagarSedan(2)) }];
    const resultat = berakningRundaFramsteg(runda, rutiner);
    expect(resultat.total).toBe(1);
    expect(resultat.granskade).toBe(1);
    expect(resultat.kvarstar).toHaveLength(0);
  });

  it("räknar en rutin som EJ granskad om granskadDatum ligger FÖRE att rundan startade", () => {
    const runda = { skapad: tidsstampel(dagarSedan(10)), rutinIds: ["r1"] };
    const rutiner = [{ id: "r1", titel: "Rutin 1", omrade: "kliniskt-stod", granskadDatum: tidsstampel(dagarSedan(20)) }];
    const resultat = berakningRundaFramsteg(runda, rutiner);
    expect(resultat.granskade).toBe(0);
    expect(resultat.kvarstar).toHaveLength(1);
    expect(resultat.kvarstar[0].titel).toBe("Rutin 1");
  });

  it("hoppar över en rutin som tagits bort sedan rundan startade (inte i denominatorn)", () => {
    const runda = { skapad: tidsstampel(dagarSedan(10)), rutinIds: ["r1", "rBorttagen"] };
    const rutiner = [{ id: "r1", titel: "Rutin 1", omrade: "kliniskt-stod", granskadDatum: tidsstampel(dagarSedan(2)) }];
    const resultat = berakningRundaFramsteg(runda, rutiner);
    expect(resultat.total).toBe(1);
  });

  it("en rutin utan granskadDatum alls räknas som kvarstående", () => {
    const runda = { skapad: tidsstampel(dagarSedan(10)), rutinIds: ["r1"] };
    const rutiner = [{ id: "r1", titel: "Rutin 1", omrade: "kliniskt-stod" }];
    const resultat = berakningRundaFramsteg(runda, rutiner);
    expect(resultat.granskade).toBe(0);
    expect(resultat.kvarstar).toHaveLength(1);
  });

  it("kvarstar innehåller inga personuppgifter, bara rutin/område (krav 14)", () => {
    const runda = { skapad: tidsstampel(dagarSedan(10)), rutinIds: ["r1"] };
    const rutiner = [{ id: "r1", titel: "Rutin 1", omrade: "kliniskt-stod" }];
    const resultat = berakningRundaFramsteg(runda, rutiner);
    expect(Object.keys(resultat.kvarstar[0]).sort()).toEqual(["granskad", "id", "omrade", "titel"]);
  });
});
