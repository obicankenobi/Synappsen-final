// Etapp 69c (ETAPPLAN18.md): sidomenyn på en datorskärm. Genomgående krav 34 säger att
// bottenraden (BottomNav.jsx) och sidomenyn (Sidomeny.jsx) ALDRIG får synas samtidigt - de
// är samma navigering i två skepnader, och två synliga huvudnavigeringar samtidigt är både
// förvirrande och ett WCAG 2.4.1-problem (två konkurrerande landmärken). Det här testet
// bevisar det genom att faktiskt mäta synlighet vid två bredder, inte genom att lita på att
// CSS:en säger rätt sak.
import { test, expect } from "@playwright/test";
import { vantaPaSidinnehall } from "./sidvantan.mjs";

const LOSENORD = "test1234";
const MOBIL = { width: 390, height: 844 };
const DATOR = { width: 1440, height: 900 };

async function loggaIn(page, epost) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', epost);
  await page.fill('input[type="password"]', LOSENORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

test.describe("sidomeny kontra bottenrad", () => {
  test("dator (1440px): sidomenyn syns, bottenraden gör det inte", async ({ page }) => {
    await page.setViewportSize(DATOR);
    await loggaIn(page, "e2e-superA@orga.test");
    await expect(page.getByRole("navigation", { name: "Huvudnavigering" })).toBeVisible();
    await expect(page.locator(".sidomeny")).toBeVisible();
    await expect(page.locator(".bottom-nav")).toBeHidden();
  });

  test("mobil (390px): bottenraden syns, sidomenyn gör det inte", async ({ page }) => {
    await page.setViewportSize(MOBIL);
    await loggaIn(page, "e2e-superA@orga.test");
    await expect(page.locator(".bottom-nav")).toBeVisible();
    await expect(page.locator(".sidomeny")).toBeHidden();
  });

  test("endast EN huvudnavigering är synlig samtidigt, i båda bredderna", async ({ page }) => {
    await loggaIn(page, "e2e-superA@orga.test");
    // waitForURL("**/") löser ut innan SkyddadRoute/layouten hunnit rendera navigeringen, och
    // evaluateAll väntar inte - en ögonblicksbild av en tom sida gav 0 i stället för 1. Vänta
    // på sidans innehåll (se sidvantan.mjs) och mät sedan med en återförsökande assertion.
    await vantaPaSidinnehall(page);
    for (const storlek of [MOBIL, DATOR]) {
      await page.setViewportSize(storlek);
      // offsetParent funkar INTE som synlighetstest här - position: fixed ger offsetParent:
      // null i Chromium oavsett om elementet faktiskt syns. getComputedStyle().display är
      // det som CSS:ens display:none-regler faktiskt styr.
      await expect
        .poll(
          () =>
            page
              .getByRole("navigation", { name: "Huvudnavigering" })
              .evaluateAll((element) => element.filter((el) => getComputedStyle(el).display !== "none").length),
          { message: `${storlek.width}px: förväntade exakt 1 synlig huvudnavigering` }
        )
        .toBe(1);
    }
  });

  test("navigering via sidomenyn fungerar och markerar aktiv sida", async ({ page }) => {
    await page.setViewportSize(DATOR);
    await loggaIn(page, "e2e-superA@orga.test");
    await page.locator(".sidomeny").getByRole("link", { name: "Kliniskt" }).click();
    await page.waitForURL("**/kliniskt-stod");
    await expect(page.locator(".sidomeny__lank.active")).toHaveText(/Kliniskt/);
  });

  test("kiosk: sidomenyn visar Lämna kioskläge, och den öppnar PIN-dialogen", async ({ page }) => {
    await page.setViewportSize(DATOR);
    await loggaIn(page, "e2e-kioskA@orga.test");
    await page.locator(".sidomeny").getByRole("button", { name: "Lämna kioskläge" }).click();
    await expect(page.getByRole("heading", { name: "Lämna kioskläge" })).toBeVisible();
  });

  test("Mer-menyn öppnad på mobil förblir dold om fönstret sedan breddas förbi brytpunkten", async ({ page }) => {
    await page.setViewportSize(MOBIL);
    await loggaIn(page, "e2e-superA@orga.test");
    await page.getByRole("button", { name: "Mer" }).click();
    await expect(page.getByRole("dialog", { name: "Mer" })).toBeVisible();
    await page.setViewportSize(DATOR);
    await expect(page.getByRole("dialog", { name: "Mer" })).toBeHidden();
    await expect(page.locator(".sidomeny")).toBeVisible();
  });
});
