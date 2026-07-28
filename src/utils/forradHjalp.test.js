import { describe, it, expect } from "vitest";
import { gerUtInom30Dagar, arUtgangenArtikel } from "./forradHjalp";

function isoOmDagar(antal) {
  const d = new Date();
  d.setDate(d.getDate() + antal);
  return d.toISOString().slice(0, 10);
}

describe("gerUtInom30Dagar", () => {
  it("är falskt utan utgångsdatum", () => {
    expect(gerUtInom30Dagar({})).toBe(false);
  });

  it("är falskt om det är långt kvar (100 dagar)", () => {
    expect(gerUtInom30Dagar({ utgangsdatum: isoOmDagar(100) })).toBe(false);
  });

  it("är sant inom 30-dagarsfönstret (10 dagar kvar)", () => {
    expect(gerUtInom30Dagar({ utgangsdatum: isoOmDagar(10) })).toBe(true);
  });

  it("är falskt om det redan gått ut (redan förfallen räknas separat, se arUtgangenArtikel)", () => {
    expect(gerUtInom30Dagar({ utgangsdatum: isoOmDagar(-5) })).toBe(false);
  });
});

describe("arUtgangenArtikel", () => {
  it("är falskt utan utgångsdatum", () => {
    expect(arUtgangenArtikel({})).toBe(false);
  });

  it("är sant för ett utgångsdatum i det förflutna", () => {
    expect(arUtgangenArtikel({ utgangsdatum: isoOmDagar(-1) })).toBe(true);
  });

  it("är falskt för ett utgångsdatum i framtiden", () => {
    expect(arUtgangenArtikel({ utgangsdatum: isoOmDagar(1) })).toBe(false);
  });
});
