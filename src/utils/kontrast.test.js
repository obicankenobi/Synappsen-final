import { describe, it, expect } from "vitest";
import { kontrastforhallande, blandaFarger, valideraAccentfarg } from "./kontrast";

describe("kontrastforhallande", () => {
  it("svart mot vitt ger maximal kontrast (21:1)", () => {
    expect(kontrastforhallande("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("samma färg mot sig själv ger 1:1", () => {
    expect(kontrastforhallande("#2563eb", "#2563eb")).toBeCloseTo(1, 1);
  });

  it("är symmetrisk oavsett argumentordning", () => {
    const a = kontrastforhallande("#2563eb", "#ffffff");
    const b = kontrastforhallande("#ffffff", "#2563eb");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("blandaFarger", () => {
  it("andel 0 ger ursprungsfärgen oförändrad", () => {
    expect(blandaFarger("#123456", "#ffffff", 0)).toBe("#123456");
  });

  it("andel 1 ger målfärgen", () => {
    expect(blandaFarger("#123456", "#ffffff", 1)).toBe("#ffffff");
  });
});

describe("valideraAccentfarg", () => {
  it("avvisar ogiltig text (inte en hexfärg)", () => {
    expect(valideraAccentfarg("blå").giltig).toBe(false);
    expect(valideraAccentfarg("").giltig).toBe(false);
    expect(valideraAccentfarg("#fff").giltig).toBe(false); // korthex stöds inte, kräver 6 siffror
  });

  it("godkänner appens egen befintliga primärfärg (#2563eb)", () => {
    expect(valideraAccentfarg("#2563eb").giltig).toBe(true);
  });

  it("avvisar en mycket ljus/pastellfärg (för svag kontrast mot vit knapptext)", () => {
    const resultat = valideraAccentfarg("#fef9c3");
    expect(resultat.giltig).toBe(false);
    expect(resultat.fel).toMatch(/ljust läge/);
  });

  it("godkänner en mörk, mättad färg som klarar båda lägena", () => {
    expect(valideraAccentfarg("#7c3aed").giltig).toBe(true);
  });
});
