import { describe, it, expect } from "vitest";
import { expanderaNyckelord } from "./synonymer";

describe("expanderaNyckelord", () => {
  it("lägger till gruppens övriga ord när ett förkortat ord förekommer i innehållet", () => {
    const resultat = expanderaNyckelord(["patient"], "Sätt en PVK innan provtagning.");
    expect(resultat).toContain("perifer venkateter");
    expect(resultat).toContain("venflon");
  });

  it("lägger till gruppens övriga ord när den fullständiga termen förekommer i innehållet", () => {
    const resultat = expanderaNyckelord([], "Kontrollera att den perifera venkatetern sitter kvar.");
    expect(resultat).toContain("pvk");
    expect(resultat).toContain("venflon");
  });

  it("är okänsligt för versalisering", () => {
    const resultat = expanderaNyckelord([], "KAD sattes vid ankomst.");
    expect(resultat).toContain("foley-kateter");
  });

  it("lägger inte till dubbletter av ord som redan finns i nyckelordslistan", () => {
    const resultat = expanderaNyckelord(["pvk"], "Sätt en PVK.");
    expect(resultat.filter((o) => o === "pvk")).toHaveLength(1);
  });

  it("lämnar nyckelordslistan orörd när inget synonymord förekommer i innehållet", () => {
    const resultat = expanderaNyckelord(["patient"], "En text utan några kända förkortningar.");
    expect(resultat).toEqual(["patient"]);
  });

  it("hanterar saknat/tomt innehåll utan att kasta", () => {
    expect(expanderaNyckelord(["a"], "")).toEqual(["a"]);
    expect(expanderaNyckelord(["a"], undefined)).toEqual(["a"]);
  });

  it("muterar inte den ursprungliga nyckelordslistan", () => {
    const original = ["patient"];
    expanderaNyckelord(original, "PVK");
    expect(original).toEqual(["patient"]);
  });
});
