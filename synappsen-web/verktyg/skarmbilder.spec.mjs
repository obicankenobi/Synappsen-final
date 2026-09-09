// Fångar webbplatsens skärmbilder ur den RIKTIGA appen, med demodata ur demodata.mjs.
//
// Mobil viewport med avsikt: produktens position är "sökbart på sekunder, i mobilen, mitt i
// ett arbetspass" (produkt/VARUMARKE.md §2). En skrivbordsskärmbild hade visat en situation
// kunden inte känner igen sig i. deviceScaleFactor 2 så bilden är skarp på en retina-skärm.
//
// /kliniskt-stod fotograferas nu (sedan 2026-09-09). Orden "Beslutsstöd" (KlinikfragaSok.jsx)
// och "triageringsstöd" (KlinisktStod.jsx) rättades 2026-09-08 (se granskningar/
// PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md § 9.1/§ 9.3, BESLUTSLOGG.md), så
// tests/docs/webbplats.test.js:s ordvakt gäller inte längre den här vyn. Bilden ersätter den
// tidigare /administration-substitutionen (se historiken i git för den ursprungliga
// motiveringen) – rutan "Kliniskt stöd" i index.html visar nu en skärmbild från rätt domän,
// med klinikstöd-sökrutan synlig men OSKICKAD: sökfunktionen anropar en extern källa (Google
// Programmable Search + Gemini via Vertex AI) som varken emulatorn eller den här bildtagningen
// har åtkomst till, och ett riktigt sökresultat ska ändå aldrig hårdkodas i en marknadsbild.
import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DEMO } from "./demodata.mjs";

const BILDER = fileURLToPath(new URL("../bilder/", import.meta.url));

test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });

async function loggaIn(page) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', DEMO.redaktor);
  await page.fill('input[type="password"]', DEMO.losenord);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 20_000 });
  await page.waitForTimeout(1500);
}

async function fanga(page, namn, alternativ = {}) {
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${BILDER}${namn}.png`, ...alternativ });
}

test("fångar skärmbilder till webbplatsen", async ({ page }) => {
  mkdirSync(BILDER, { recursive: true });
  const konsolfel = [];
  page.on("pageerror", (fel) => konsolfel.push(fel.message));

  await loggaIn(page);

  // 1. Sökningen. Ersätter den handritade attrapp som stod i hjältesektionen – den stavade
  //    dessutom fel på "urinkateter", vilket är hela skälet till att bilderna nu fotograferas.
  const sokfalt = page.getByPlaceholder("Sök rutin, diagnos eller nyckelord...");
  await sokfalt.fill("kad");
  await page.waitForTimeout(1200);
  await fanga(page, "app-sok");

  // 2. Rutinlistan med ägare och granskningsdatum, i den kliniska domänen – samma domän som
  //    hjältebildens sökträff "Urinkateter (KAD)" hör hemma i. Klinikstöd-sökrutan syns i
  //    samma bild, se filens inledande kommentar om varför den aldrig fylls i eller skickas.
  await page.goto("/kliniskt-stod", { waitUntil: "load" });
  await fanga(page, "app-rutiner");

  // 3. Förrådet med skåp- och hyllplats.
  await page.goto("/logistik/sterilforradet", { waitUntil: "load" });
  await fanga(page, "app-forrad");

  // 4. Ledningsrapporten med kvitteringsgrad.
  await page.goto("/ledningsrapport", { waitUntil: "load" });
  await fanga(page, "app-ledningsrapport");

  // En trasig sida ska aldrig kunna bli en marknadsbild.
  expect(konsolfel, `Appen kastade fel under bildtagningen:\n${konsolfel.join("\n")}`).toEqual([]);
});
