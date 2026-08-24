// Projektets återkommande felmönster: ett dokument påstår något som inte längre stämmer, och
// ingen märker det på månader. Sex dokumenterade fall (SAKERHETSRAPPORT.md 46–51 releaser,
// FRAMTIDSPLAN.md/MODULPLAN.md 38–43, src/version.js 19, CLAUDE_STATUS.md två, PITCH.md 48).
// Svaret har varje gång varit en ny prosaregel i CLAUDE.md, och prosareglerna har varje gång
// misslyckats igen.
//
// Det som HAR hållit är de två fall där drift gjordes mekaniskt omöjlig eller mekaniskt
// upptäckt: src/version.js importerar versionen i stället för att upprepa den, och
// pitch-version.test.js failar om PITCH.md:s versionsrubrik glider. Den här filen
// generaliserar den principen till dokumentbeståndet som helhet.
//
// Testet kontrollerar STRUKTUR (finns dokumentet? är det indexerat? har statusfilen svällt?).
// Faktiska SAKPÅSTÅENDEN kontrolleras i dokumentpastaenden.test.js.
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const ROT = fileURLToPath(new URL("../../", import.meta.url));
const REGISTER = "DOKUMENTREGISTER.md";

// Kataloger som aldrig innehåller projektdokumentation.
const IGNORERA_KATALOG = new Set([
  "node_modules",
  ".git",
  "dist",
  "dev-dist",
  "coverage",
  "playwright-report",
  "test-results",
  ".firebase",
]);

// Enskilda filer som medvetet står utanför registret, med skäl. Håll listan KORT – varje rad
// här är ett dokument som kan ruttna utan att någon märker det. Lägg hellre in dokumentet i
// registret än på den här listan.
const IGNORERA_FIL = new Set([
  // (tom med flit – se kommentaren ovan)
]);

function samlaDokument(katalog = ROT, traff = []) {
  for (const post of readdirSync(katalog)) {
    if (IGNORERA_KATALOG.has(post)) continue;
    const full = join(katalog, post);
    if (statSync(full).isDirectory()) {
      samlaDokument(full, traff);
      continue;
    }
    const rel = relative(ROT, full).split("\\").join("/");
    if (IGNORERA_FIL.has(rel)) continue;
    // .md överallt, plus de kundvända HTML-källfilerna – de senare är de dokument där ett
    // felaktigt påstående faktiskt kostar pengar (de går till kund, DSO och i anbud).
    if (rel.endsWith(".md") || rel.startsWith("saljmaterial/kallfiler/")) traff.push(rel);
  }
  return traff;
}

const registerText = readFileSync(join(ROT, REGISTER), "utf8");
// Varje dokument står som `sökväg` i en tabellcell. Plocka ut allt som ser ut som en sökväg
// till en fil vi bryr oss om, oavsett vilken tabell det står i.
const registrerade = new Set(
  [...registerText.matchAll(/`([^`]+\.(?:md|html))`/g)].map((m) => m[1])
);

const paDisk = samlaDokument().sort();

describe("Dokumentregistret speglar verkligheten", () => {
  test("varje dokument på disk är indexerat i DOKUMENTREGISTER.md", () => {
    const saknas = paDisk.filter((f) => !registrerade.has(f));
    expect(
      saknas,
      `Följande dokument finns på disk men saknas i ${REGISTER}:\n  ${saknas.join("\n  ")}\n\n` +
        "Lägg in dem i rätt tabell (levande / referens / mall / historisk). Det här testet " +
        "finns för att ett nytt dokument aldrig ska kunna tillkomma utan att någon tar " +
        "ställning till om det måste hållas uppdaterat – exakt det som hände när " +
        "säljmaterialpaketet lades in 2026-08-23 utan att indexeras."
    ).toEqual([]);
  });

  test("varje dokument i registret finns faktiskt på disk", () => {
    // Regexen ovan plockar bara .md/.html, så kodfiler som nämns i brödtexten
    // (src/version.js, tests/docs/pitch-version.test.js) kommer aldrig hit.
    const paDiskSet = new Set(paDisk);
    const spoken = [...registrerade].filter((f) => !paDiskSet.has(f)).sort();
    expect(
      spoken,
      `Följande står i ${REGISTER} men finns inte på disk:\n  ${spoken.join("\n  ")}\n\n` +
        "Antingen är filen flyttad eller raderad utan att registret följde med, eller så är " +
        "sökvägen felstavad. Det här fångar samma klass av fel som mappflytten 2026-08-23 " +
        "kunde ha orsakat."
    ).toEqual([]);
  });
});

describe("CLAUDE_STATUS.md hålls läsbar", () => {
  // Filen växte till 4 352 rader (~75 600 tokens) med 120 uppföljningssektioner medan
  // CLAUDE.md instruerade varje ny session att läsa den FÖRST. Ett dokument som ingen orkar
  // läsa skyddar ingenting. Underhållsregeln ("flytta äldre sektioner till arkivet") är i sig
  // en prosaregel och skulle misslyckas likadant – det här testet är bromsen som gör att den
  // faktiskt utlöses.
  const MAX_RADER = 400;

  test(`är högst ${MAX_RADER} rader – annars ska äldsta uppföljningarna arkiveras`, () => {
    const rader = readFileSync(join(ROT, "CLAUDE_STATUS.md"), "utf8").split("\n").length;
    expect(
      rader,
      `CLAUDE_STATUS.md är ${rader} rader. Flytta de äldsta "## Uppföljning"-sektionerna till ` +
        "etapplaner/STATUSARKIV.md (sist i filen, så kronologin förblir obruten) tills den är " +
        `under ${MAX_RADER}. Höj INTE gränsen i stället – det var precis så filen växte till ` +
        "4 352 rader förra gången."
    ).toBeLessThanOrEqual(MAX_RADER);
  });

  test("pekar ut var historiken tagit vägen", () => {
    const text = readFileSync(join(ROT, "CLAUDE_STATUS.md"), "utf8");
    expect(
      text,
      "CLAUDE_STATUS.md måste nämna etapplaner/STATUSARKIV.md, annars hittar en ny session " +
        "aldrig historiken den behöver för att förstå VARFÖR något gjordes."
    ).toContain("etapplaner/STATUSARKIV.md");
  });
});
