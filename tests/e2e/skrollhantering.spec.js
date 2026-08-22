// Etapp 69f (ETAPPLAN18.md): bevisar de två beteenden ScrollHantering.jsx ska ge.
// Nyheter (/nyheter) används som "lång sida att skrolla ner i" - den renderar hela
// src/data/andringslogg.js (131 poster vid skrivande stund), så den är garanterat
// skrollbar oavsett vad som råkar finnas seedat i emulatorn.
//
// Navigeringen bort från /nyheter sker via SIDOMENYNS "Hem"-länk (`position: fixed`, alltid
// synlig), INTE via sidans egen "← Hem"-länk högst upp i innehållet. Det spelar roll: den
// sistnämnda ligger ovanför den skrollbara listan, så Playwrights `.click()` (precis som en
// riktig användares finger/muspekare) måste skrolla UPP till länken för att kunna klicka på
// den - vilket i sig NOLLSTÄLLER "aktuell position" innan navigeringen ens sker. Det är inte
// ett fel i skrollåterställningen, det är hur webbläsare fungerar när målet man klickar på
// bara finns längst upp. Upptäckt genom att logga hela sekvensen och se ett oväntat andra
// "scroll"-event (till 0) omedelbart INNAN navigeringen, från just det klicket.
import { test, expect } from "@playwright/test";

const LOSENORD = "test1234";

async function loggaIn(page) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', "e2e-superA@orga.test");
  await page.fill('input[type="password"]', LOSENORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

test("framåtnavigering börjar överst, även om föregående sida var skrollad", async ({ page }) => {
  await loggaIn(page);
  await page.goto("/nyheter");
  await page.locator(".nyheter-post").nth(20).waitFor();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);

  await page.locator(".sidomeny").getByRole("link", { name: "Hem" }).click();
  await page.waitForURL("**/");

  // ScrollHantering.jsx:s återställning körs i en useEffect, som React kör asynkront efter
  // målning - en synkron kontroll direkt efter waitForURL hinner ibland före den.
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("bakåtnavigering återställer skrollpositionen, inte toppen", async ({ page }) => {
  await loggaIn(page);
  await page.goto("/nyheter");
  await page.locator(".nyheter-post").nth(20).waitFor();
  await page.evaluate(() => window.scrollTo(0, 1200));
  const skrolladPosition = await page.evaluate(() => window.scrollY);
  expect(skrolladPosition).toBeGreaterThan(500);
  // ScrollHantering.jsx sparar positionen via en `scroll`-lyssnare, inte i navigeringens
  // cleanup (se komponentens kommentar för varför cleanup INTE går att lita på här) - ge
  // webbläsaren en chans att faktiskt dispatcha händelsen innan vi navigerar bort.
  await page.waitForTimeout(100);

  await page.locator(".sidomeny").getByRole("link", { name: "Hem" }).click();
  await page.waitForURL("**/");

  await page.goBack();
  await page.waitForURL("**/nyheter");

  // ScrollHantering.jsx:s EGEN återställning (navigationType "POP") - inte webbläsarens,
  // som är avstängd med flit (history.scrollRestoration = "manual", se komponenten).
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
});

test("en djuplänk med hash skrollar till ankaret, inte toppen", async ({ page }) => {
  await loggaIn(page);
  await page.goto("/kliniskt-stod");
  const forstaRutinId = await page.locator("[id^='rutin-']").first().getAttribute("id");
  test.skip(!forstaRutinId, "Ingen rutin seedad för den här rollen - inget att skrolla till");

  await page.goto(`/kliniskt-stod#${forstaRutinId}`);
  await page.waitForTimeout(400);
  await expect(page.locator(`#${forstaRutinId}`)).toBeInViewport();
});
