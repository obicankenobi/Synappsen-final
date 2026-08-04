import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Etapp 45a: PITCH.md är produktens enda dokument som möter en KÖPARE, men saknade tidigare
// varje mekanism som skyddar mot att glida ur takt med koden – och gjorde det, 48 releaser
// (v5.25.0 mot v5.73.0), innan en extern granskning (2026-08-04) upptäckte det. Samma
// "kan inte återkomma"-princip som redan löste motsvarande problem för src/version.js
// (importerar versionen direkt istället för att hållas synkad manuellt) tillämpas här som
// ett test istället, eftersom PITCH.md är prosa och inte kan importera ett versionsnummer.
//
// Testet tvingar INTE en omskrivning vid varje patch – bara att glappet aldrig tillåts växa
// obemärkt till mer än MAX_MINOR_DRIFT minorversioner. Höj gränsen om den känns för snäv i
// praktiken, men höj den aldrig utan att samtidigt skriva om PITCH.md:s innehåll.
const MAX_MINOR_DRIFT = 15;

function lasVersion(sokvag, monster) {
  const innehall = readFileSync(sokvag, "utf8");
  const traff = innehall.match(monster);
  if (!traff) {
    throw new Error(`Hittade inget versionsnummer i ${sokvag} (mönster: ${monster})`);
  }
  return { major: Number(traff[1]), minor: Number(traff[2]), patch: Number(traff[3]) };
}

describe("PITCH.md får inte glida ur takt med produktens version", () => {
  test(`versionsrubriken ligger max ${MAX_MINOR_DRIFT} minorversioner efter package.json`, () => {
    const rot = fileURLToPath(new URL("../../", import.meta.url));
    const pakets = lasVersion(`${rot}package.json`, /"version":\s*"(\d+)\.(\d+)\.(\d+)"/);
    const pitch = lasVersion(`${rot}PITCH.md`, /Version (\d+)\.(\d+)\.(\d+)/);

    expect(
      pitch.major,
      "PITCH.md:s major-version stämmer inte längre överens med package.json:s – kontrollera manuellt, det här är inte bara en vanlig eftersläpning"
    ).toBe(pakets.major);

    const drift = pakets.minor - pitch.minor;
    expect(
      drift,
      `PITCH.md står på version ${pitch.major}.${pitch.minor}.${pitch.patch} men produkten är på ` +
        `${pakets.major}.${pakets.minor}.${pakets.patch} (${drift} minorversioner efter, gränsen är ` +
        `${MAX_MINOR_DRIFT}). Skriv om PITCH.md:s innehåll och uppdatera versionsraden.`
    ).toBeLessThanOrEqual(MAX_MINOR_DRIFT);
  });
});
