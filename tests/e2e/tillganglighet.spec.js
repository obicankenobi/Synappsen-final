// Etapp 45c: TILLGANGLIGHETSREDOGORELSE.md byggde tidigare på en engångsgranskning av fem
// flöden (2026-07-26), gjord innan Etapp 42/43 byggde om navigeringen, adminpanelen och lade
// till flera nya sidor/globala komponenter. Det här är en PERMANENT regressionsspärr, inte
// bara den engångsrevision som gav underlaget till redogörelsen – körs för två roller
// (superadmin och personal) eftersom en riktig genomkörning under bygget visade att samma
// sida kan ha OLIKA rubrikstruktur beroende på rollens data (se Kompetensmatris.jsx/
// Papperskorg.jsx-fynden nedan), inte bara olika behörighet.
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { ALLA_ROUTES } from "./rutter.mjs";

const LOSENORD = "test1234";

const ROLLER = [
  { roll: "superadmin", epost: "e2e-superA@orga.test" },
  { roll: "personal", epost: "e2e-personalA@orga.test" },
];

async function loggaIn(page, epost) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', epost);
  await page.fill('input[type="password"]', LOSENORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

for (const { roll, epost } of ROLLER) {
  test(`tillgänglighet (${roll}): axe-core mot samtliga ${ALLA_ROUTES.length} routes`, async ({ page }) => {
    test.setTimeout(180_000);

    const problem = [];

    await loggaIn(page, epost);

    for (const route of ALLA_ROUTES) {
      await page.goto(route, { waitUntil: "load", timeout: 15_000 }).catch(() => {});
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

    expect(problem, `Roll: ${roll}\n${problem.join("\n")}`).toEqual([]);
  });
}
