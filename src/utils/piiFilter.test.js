import { describe, it, expect } from "vitest";
import { hittaPersonnummer, hittaMisstankaNamn } from "./piiFilter";

describe("hittaPersonnummer", () => {
  it("hittar ett giltigt personnummer (korrekt datum + Luhn-checksumma)", () => {
    // 900101-0017 är Skatteverkets kända test-personnummer.
    expect(hittaPersonnummer("Patienten har personnummer 900101-0017 enligt journalen.")).toEqual([
      "900101-0017",
    ]);
  });

  it("hittar ett personnummer utan bindestreck", () => {
    expect(hittaPersonnummer("nr 9001010017 noterat")).toEqual(["9001010017"]);
  });

  it("hittar ett giltigt samordningsnummer (dag + 60)", () => {
    // 850381-0023: 21:a i mars 1985, dag angiven som 81 (21+60).
    expect(hittaPersonnummer("samordningsnummer 850381-0023")).toEqual(["850381-0023"]);
  });

  // Säkerhetsgranskning 2026-08-17 (Del 3 – fynd 3.1). De två testerna nedan MISSLYCKADES
  // före patchen: mönstret saknade århundradeprefix, så den tolvsiffriga formen – den som
  // svenska journalsystem visar, och som personal alltså klistrar in – passerade filtret helt.
  it("hittar ett tolvsiffrigt personnummer med bindestreck", () => {
    expect(hittaPersonnummer("pat 19900101-0017 inskriven")).toEqual(["19900101-0017"]);
  });

  it("hittar ett tolvsiffrigt personnummer utan bindestreck", () => {
    expect(hittaPersonnummer("nr 199001010017 noterat")).toEqual(["199001010017"]);
  });

  it("hittar ett tolvsiffrigt samordningsnummer (dag + 60)", () => {
    expect(hittaPersonnummer("samordningsnummer 198503810023")).toEqual(["198503810023"]);
  });

  it("flaggar inte en längre siffersekvens som råkar innehålla ett giltigt mönster", () => {
    // 16 siffror i rad (t.ex. ett kortnummer/artikelnummer) ska inte ge en träff – \b i båda
    // ändarna kräver att sekvensen är fristående.
    expect(hittaPersonnummer("ref 1990010100171234 i systemet")).toEqual([]);
  });

  it("ignorerar en siffersekvens med fel checksumma", () => {
    expect(hittaPersonnummer("nummer 900101-0018")).toEqual([]);
  });

  it("ignorerar en siffersekvens med ogiltig månad", () => {
    expect(hittaPersonnummer("ordernummer 901301-1234")).toEqual([]);
  });

  it("ignorerar en siffersekvens med ogiltig dag", () => {
    expect(hittaPersonnummer("kod 900199-1237")).toEqual([]);
  });

  it("ignorerar vanliga tal som inte liknar ett datum", () => {
    expect(hittaPersonnummer("artikelnummer 1234567890 i lager")).toEqual([]);
  });

  it("hittar inget i tom eller saknad text", () => {
    expect(hittaPersonnummer("")).toEqual([]);
    expect(hittaPersonnummer(undefined)).toEqual([]);
  });
});

describe("hittaMisstankaNamn", () => {
  it("flaggar två versalinledda ord i följd", () => {
    expect(hittaMisstankaNamn("Patienten heter Anna Andersson och söker för...")).toEqual([
      "Anna Andersson",
    ]);
  });

  it("flaggar inget i text utan sådant mönster", () => {
    expect(hittaMisstankaNamn("slut på sutur-set i förråd 3")).toEqual([]);
  });
});
