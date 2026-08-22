// Etapp 45c: TILLGANGLIGHETSREDOGORELSE.md byggde tidigare på en engångsgranskning av fem
// flöden (2026-07-26), gjord innan Etapp 42/43 byggde om navigeringen, adminpanelen och lade
// till flera nya sidor/globala komponenter. Det här är en PERMANENT regressionsspärr, inte
// bara den engångsrevision som gav underlaget till redogörelsen – körs för två roller
// (superadmin och personal) eftersom en riktig genomkörning under bygget visade att samma
// sida kan ha OLIKA rubrikstruktur beroende på rollens data (se Kompetensmatris.jsx/
// Papperskorg.jsx-fynden nedan), inte bara olika behörighet.
//
// Etapp 69g (ETAPPLAN18.md): körs sedan 2026-08-22 i BÅDA teman, inte bara ljust. Playwrights
// standard är `colorScheme: "light"`, och det är exakt hur en app-övergripande defekt kunde
// ligga kvar i produktion (se Etapp 69h): appen saknade helt en global länkfärg, 72 länkar
// föll tillbaka på webbläsarens standardblå, och det mätte 9,40:1 mot vitt (osynligt för
// axe) men 1,90–2,06:1 i mörkt läge (en riktig WCAG-överträdelse, aldrig körd). Dubblar
// sviten (2 roller × 2 teman istället för × 1) - bredd hanteras separat i rokprov.spec.js
// istället för att korsa alla fyra kombinationerna här, vilket hade fyrdubblat den redan
// tyngsta specen i sviten (43–51s per körning) för marginell extra nytta: en layout-krasch
// vid en viss bredd är rökprovets jobb, inte axe:s.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ALLA_ROUTES } from "./rutter.mjs";

const LOSENORD = "test1234";

const ROLLER = [
  { roll: "superadmin", epost: "e2e-superA@orga.test" },
  { roll: "personal", epost: "e2e-personalA@orga.test" },
];

const TEMAN = ["light", "dark"];

async function loggaIn(page, epost) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', epost);
  await page.fill('input[type="password"]', LOSENORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

for (const tema of TEMAN) {
  for (const { roll, epost } of ROLLER) {
    test(`tillgänglighet (${roll}, ${tema}): axe-core mot samtliga ${ALLA_ROUTES.length} routes`, async ({
      page,
    }) => {
      test.setTimeout(180_000);

      await page.emulateMedia({ colorScheme: tema });

      const problem = [];

      await loggaIn(page, epost);

      for (const route of ALLA_ROUTES) {
        // En sväljd navigeringsfel (tidigare `.catch(() => {})`) gjorde testet falskt grönt:
        // misslyckades navigeringen kördes axe-core mot FÖREGÅENDE sida (eller about:blank),
        // hittade noll överträdelser, och sviten passerade utan att någon route granskats.
        // Samma hantering som rökprovssviten (45b) redan har – lyft felet till `problem`.
        const navigeringsfel = await page
          .goto(route, { waitUntil: "load", timeout: 15_000 })
          .then(() => null)
          .catch((fel) => fel.message);
        if (navigeringsfel) {
          problem.push(`${route}: navigering misslyckades (${navigeringsfel}) – ingen axe-granskning gjord`);
          continue;
        }
        // Längre väntan än i rökprovssviten (45b) – ett verkligt fynd under bygget var att en
        // för kort väntan gav ett falskt "page-has-heading-one" på Hem eftersom sidan (lazy-
        // laddad) inte hunnit rendera klart innan axe-core kördes, inte en riktig bugg.
        await page.waitForTimeout(900);

        const { violations } = await new AxeBuilder({ page }).analyze();
        if (violations.length > 0) {
          const beskrivning = violations
            .map((v) => `${v.id} [${v.impact}] (${v.nodes.length} noder): ${v.help}`)
            .join(" | ");
          problem.push(`${route}: ${beskrivning}`);
        }
      }

      expect(problem, `Roll: ${roll}, tema: ${tema}\n${problem.join("\n")}`).toEqual([]);
    });
  }
}
