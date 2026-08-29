import { describe, expect, test } from "vitest";
import { ANDRINGSLOGG } from "../../src/data/andringslogg.js";

// Etapp L1l (intern/ETAPPLAN-INTERN-1.md): src/data/andringslogg.js bundlas i klienten och
// visas för varje kund på /nyheter. Intern utveckling (leverantörspanelen, driftverktyg,
// plattformsadministration) får ALDRIG hamna där – se genomgående krav 36 i
// intern/ETAPPLAN-INTERN-1.md och intern/ANDRINGSLOGG-INTERN.md, som är den rätta platsen.
//
// ÄRLIG ANMÄRKNING (varför testet är versionsavgränsat, inte absolut): filen innehåller
// REDAN fyra poster (v5.108.0, v5.110.0, v5.111.0, v5.112.0) som uteslutande handlar om
// leverantörsvyn, skrivna innan den här regeln fanns. Ändringsloggens egen regel säger att
// den aldrig skrivs om retroaktivt (se filens huvudkommentar) – testet gäller därför bara
// FRAMÅT, från och med den version som stod i package.json när regeln skrevs. Höj aldrig
// GRANSVERSION i efterhand för att få ett test att passera – det är exakt det mönster som
// redan kostat det här projektet sex separata dokumentglidningar (se CLAUDE.md).
const GRANSVERSION = "5.132.0";

const FORBJUDNA_TERMER = ["leverantörsvyn", "leverantörspanel", "leverantörskonto", "plattformsadmin"];

function versionTuple(version) {
  const del = version.split(".").map(Number);
  if (del.length !== 3 || del.some(Number.isNaN)) {
    throw new Error(`Ogiltigt versionsnummer: "${version}"`);
  }
  return del;
}

function nyareAn(a, b) {
  const [aMajor, aMinor, aPatch] = versionTuple(a);
  const [bMajor, bMinor, bPatch] = versionTuple(b);
  if (aMajor !== bMajor) return aMajor > bMajor;
  if (aMinor !== bMinor) return aMinor > bMinor;
  return aPatch > bPatch;
}

describe("src/data/andringslogg.js nämner aldrig leverantörsfunktioner efter Etapp L1l", () => {
  const poster = ANDRINGSLOGG.filter((post) => nyareAn(post.version, GRANSVERSION));

  test.each(poster.length > 0 ? poster : [{ version: "(inga poster nyare än gränsen ännu)", andringar: [] }])(
    "post $version innehåller ingen leverantörsterm",
    (post) => {
      if (post.andringar.length === 0) return;
      const text = post.andringar.join(" ").toLowerCase();
      const traff = FORBJUDNA_TERMER.filter((term) => text.includes(term));
      expect(
        traff,
        `Posten för v${post.version} i src/data/andringslogg.js nämner ${traff.join(", ")} – ` +
          "det är intern leverantörsutveckling och hör hemma i intern/ANDRINGSLOGG-INTERN.md, " +
          "aldrig i den kundvända ändringsloggen (genomgående krav 36, intern/ETAPPLAN-INTERN-1.md)."
      ).toEqual([]);
    }
  );

  test("de fyra kända, grandfatherade posterna (v5.108.0–v5.112.0) rörs inte av gränsen", () => {
    const kanda = ["5.108.0", "5.110.0", "5.111.0", "5.112.0"];
    for (const v of kanda) {
      expect(nyareAn(v, GRANSVERSION), `${v} ska räknas som äldre än gränsen ${GRANSVERSION}`).toBe(false);
    }
  });
});
