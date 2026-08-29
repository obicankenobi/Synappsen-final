import { describe, it, expect } from "vitest";
import { STANDARD_ORG, PLATTFORMSORGANISATION } from "./organisation";

// Etapp L1m (intern/ETAPPLAN-INTERN-1.md): "_plattform" ska ALDRIG kunna förekomma som ett
// giltigt organisationId i organisationslistan. Det är sant redan idag av konstruktion, inte
// bara av konvention – skapaOrganisation (functions/organisationslivscykel.js) använder
// `db.collection("organisationer").doc()` (Firestores AUTO-genererade ID, 20 slumpmässiga
// tecken), aldrig ett klientvalt namn. Ingen kod låter en kund eller en leverantör välja
// "_plattform" som en organisations id. Det här testet läser inte skarpt mot Firestore – det
// låser bara de två konstanterna mot varandra, så en framtida ändring som råkar sätta dem
// lika (eller sätter PLATTFORMSORGANISATION till "default") upptäcks omedelbart.
describe("PLATTFORMSORGANISATION kan aldrig förväxlas med en riktig organisation", () => {
  it("skiljer sig från STANDARD_ORG", () => {
    expect(PLATTFORMSORGANISATION).not.toBe(STANDARD_ORG);
  });

  it("är det förväntade sentinelvärdet, med \"_\"-prefixet som redan används i functions/*.js", () => {
    expect(PLATTFORMSORGANISATION).toBe("_plattform");
    expect(PLATTFORMSORGANISATION.startsWith("_")).toBe(true);
  });
});
