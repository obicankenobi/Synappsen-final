import { describe, it, expect } from "vitest";
import { hittaMisstankaDubbletter } from "./dubblettdetektion";

function rutin(overrides) {
  return { status: "godkand", innehall: "", ...overrides };
}

describe("hittaMisstankaDubbletter", () => {
  it("returnerar tomt för färre än två rutiner", () => {
    expect(hittaMisstankaDubbletter([rutin({ id: "a", titel: "Enda rutinen" })])).toEqual([]);
    expect(hittaMisstankaDubbletter([])).toEqual([]);
  });

  it("flaggar två nästan identiska rutiner", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Handhavande av central venkateter", innehall: "Steg ett, steg två, steg tre, avsluta." }),
      rutin({ id: "b", titel: "Handhavande av central venkateter (kopia)", innehall: "Steg ett, steg två, steg tre, avsluta." }),
    ];
    const par = hittaMisstankaDubbletter(rutiner, 0.3);
    expect(par).toHaveLength(1);
    expect([par[0].a.id, par[0].b.id].sort()).toEqual(["a", "b"]);
  });

  it("flaggar INTE två tydligt olika rutiner", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Handhavande av central venkateter", innehall: "Steg för intravenös infart." }),
      rutin({ id: "b", titel: "Brandlarm och utrymning", innehall: "Vid brand: utrym lokalen och samla vid uppsamlingsplatsen." }),
    ];
    expect(hittaMisstankaDubbletter(rutiner, 0.2)).toEqual([]);
  });

  it("rapporterar ett par bara EN gång, inte en gång per riktning", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Samma innehåll", innehall: "Exakt samma text i båda." }),
      rutin({ id: "b", titel: "Samma innehåll", innehall: "Exakt samma text i båda." }),
      rutin({ id: "c", titel: "Helt annorlunda rutin om något helt annat", innehall: "Inget gemensamt alls här." }),
    ];
    const par = hittaMisstankaDubbletter(rutiner, 0.3);
    expect(par).toHaveLength(1);
  });

  it("utesluter utkast helt", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Samma titel", innehall: "Samma text", status: "godkand" }),
      rutin({ id: "b", titel: "Samma titel", innehall: "Samma text", status: "utkast" }),
    ];
    expect(hittaMisstankaDubbletter(rutiner, 0.3)).toEqual([]);
  });

  it("en högre maxPoang flaggar fler, mindre säkra par", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Provtagning venöst blodprov", innehall: "Sticka i armvecket, fyll rören." }),
      rutin({ id: "b", titel: "Provtagning kapillärt blodprov", innehall: "Sticka i fingertoppen, fyll röret." }),
    ];
    const strikt = hittaMisstankaDubbletter(rutiner, 0.05);
    const generos = hittaMisstankaDubbletter(rutiner, 0.9);
    expect(generos.length).toBeGreaterThanOrEqual(strikt.length);
  });

  it("resultatet är sorterat med lägst (mest lika) poäng först", () => {
    const rutiner = [
      rutin({ id: "a", titel: "Rutin om blodprov", innehall: "Text A" }),
      rutin({ id: "b", titel: "Rutin om blodprov", innehall: "Text A" }),
      rutin({ id: "c", titel: "Rutin om blodprov, något annorlunda formulerad", innehall: "Text B, delvis annat" }),
    ];
    const par = hittaMisstankaDubbletter(rutiner, 0.9);
    for (let i = 1; i < par.length; i++) {
      expect(par[i].poang).toBeGreaterThanOrEqual(par[i - 1].poang);
    }
  });
});
