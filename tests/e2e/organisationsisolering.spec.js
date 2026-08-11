// Etapp 31b: bevisar organisationsisolering i det RIKTIGA UI:t, inte bara i regel-lagret
// (tests/rules/organisationsisolering.test.mjs täcker redan regelnivån utförligt – den här
// filen kompletterar med "syns det faktiskt aldrig på skärmen").
import { test, expect } from "@playwright/test";

async function loggaIn(page, email) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "test1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

// Positivkontroll: en ren `not.toContainText`-assertion passerar också när sidan ALDRIG
// renderades (inloggningen tyst misslyckad, omdirigering till /logga-in, ErrorBoundary-
// krasch) – då finns texten förstås inte där, men testet har inte bevisat någon isolering.
// Kontrollera därför först att vi faktiskt står inloggade på rätt sida och att sidan lever.
async function bekraftaAttSidanFaktisktRenderade(page, forvantadVag) {
  expect(
    new URL(page.url()).pathname,
    "hamnade inte på förväntad sida – inloggningen eller navigeringen misslyckades, isoleringen är därmed inte bevisad"
  ).toBe(forvantadVag);
  await expect(
    page.locator(".error-boundary"),
    "sidan kraschade (ErrorBoundary) – isoleringen är inte bevisad av ett tomt sidinnehåll"
  ).toHaveCount(0);
}

test("en användare i organisation B ser aldrig organisation A:s rutininnehåll", async ({ page }) => {
  await loggaIn(page, "e2e-superB@orgb.test");
  await page.goto("/kliniskt-stod");
  await bekraftaAttSidanFaktisktRenderade(page, "/kliniskt-stod");
  await expect(page.locator("body")).not.toContainText("E2E-hemlig rutin ORG-A-ENDAST");

  // Direktlänk via samma URL-mönster som QR-koder/sökresultat använder (#rutin-<id>) – ska
  // inte plocka fram innehållet bara för att man känner till id:t.
  await page.goto("/kliniskt-stod#rutin-e2eRutinA");
  await bekraftaAttSidanFaktisktRenderade(page, "/kliniskt-stod");
  await expect(page.locator("body")).not.toContainText("Detta innehåll ska ENDAST synas för organisation A");
});

test("en användare i organisation A ser sin egen organisations rutin", async ({ page }) => {
  await loggaIn(page, "e2e-volA@orga.test");
  await page.goto("/kliniskt-stod");
  await expect(page.locator("body")).toContainText("E2E-hemlig rutin ORG-A-ENDAST");
});
