import { describe, it, expect } from "vitest";
import { borGranskas, narmarSigGranskning, arUtgangen, arArkiverad, andradSedanLasning } from "./rutinHjalp";

function tidsstampel(datum) {
  return { toDate: () => datum };
}

function dagarSedan(antal) {
  const d = new Date();
  d.setDate(d.getDate() - antal);
  return d;
}

describe("borGranskas", () => {
  it("är falskt utan granskadDatum", () => {
    expect(borGranskas(undefined)).toBe(false);
  });

  it("är falskt för en nyligen granskad rutin (10 dagar sedan)", () => {
    expect(borGranskas(tidsstampel(dagarSedan(10)))).toBe(false);
  });

  it("är falskt precis innan 180-dagarsgränsen (179 dagar)", () => {
    expect(borGranskas(tidsstampel(dagarSedan(179)))).toBe(false);
  });

  it("är sant precis efter 180-dagarsgränsen (181 dagar)", () => {
    expect(borGranskas(tidsstampel(dagarSedan(181)))).toBe(true);
  });
});

describe("narmarSigGranskning", () => {
  it("är falskt utan granskadDatum", () => {
    expect(narmarSigGranskning(undefined)).toBe(false);
  });

  it("är falskt långt innan påminnelsefönstret (100 dagar sedan)", () => {
    expect(narmarSigGranskning(tidsstampel(dagarSedan(100)))).toBe(false);
  });

  it("är sant inom de sista 14 dagarna innan gränsen (170 dagar sedan)", () => {
    expect(narmarSigGranskning(tidsstampel(dagarSedan(170)))).toBe(true);
  });

  it("är falskt efter att rutinen redan bör granskas (181 dagar sedan)", () => {
    expect(narmarSigGranskning(tidsstampel(dagarSedan(181)))).toBe(false);
  });
});

describe("arUtgangen", () => {
  it("är falskt utan utgångsdatum", () => {
    expect(arUtgangen({})).toBe(false);
  });

  it("är falskt för ett utgångsdatum i framtiden", () => {
    const imorgon = new Date();
    imorgon.setDate(imorgon.getDate() + 1);
    expect(arUtgangen({ utgangsdatum: imorgon.toISOString().slice(0, 10) })).toBe(false);
  });

  it("är sant för ett utgångsdatum i det förflutna", () => {
    expect(arUtgangen({ utgangsdatum: "2020-01-01" })).toBe(true);
  });
});

describe("arArkiverad", () => {
  it("är falskt utan arkiverad-fält alls", () => {
    expect(arArkiverad({})).toBe(false);
  });

  it("är falskt när arkiverad uttryckligen är false", () => {
    expect(arArkiverad({ arkiverad: false })).toBe(false);
  });

  it("är sant när arkiverad är true", () => {
    expect(arArkiverad({ arkiverad: true })).toBe(true);
  });

  it("hanterar ett odefinierat/null-rutin utan att kasta", () => {
    expect(arArkiverad(null)).toBe(false);
    expect(arArkiverad(undefined)).toBe(false);
  });
});

describe("andradSedanLasning", () => {
  it("är falskt utan senasteVasentligaAndring", () => {
    expect(andradSedanLasning({}, tidsstampel(dagarSedan(10)))).toBe(false);
  });

  it("är falskt utan en egen kvitteringstidpunkt", () => {
    expect(andradSedanLasning({ senasteVasentligaAndring: tidsstampel(dagarSedan(1)) }, undefined)).toBe(false);
  });

  it("är sant när den väsentliga ändringen är EFTER min kvittering", () => {
    const rutin = { senasteVasentligaAndring: tidsstampel(dagarSedan(1)) };
    expect(andradSedanLasning(rutin, tidsstampel(dagarSedan(10)))).toBe(true);
  });

  it("är falskt när den väsentliga ändringen är FÖRE min kvittering", () => {
    const rutin = { senasteVasentligaAndring: tidsstampel(dagarSedan(10)) };
    expect(andradSedanLasning(rutin, tidsstampel(dagarSedan(1)))).toBe(false);
  });
});
