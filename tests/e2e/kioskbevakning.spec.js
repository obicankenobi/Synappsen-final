// Etapp 61c (ETAPPLAN12.md): kioskläget (Etapp 55b, `KioskBevakning.jsx`/`BottomNav.jsx`)
// hade noll e2e-täckning – bara enhetstester av `satKioskPin`/`verifieraKioskPin` (Cloud
// Functions, se tests/functions/kioskrestriktioner.test.cjs) och regeltester av
// firestore.rules (tests/rules/kioskrestriktioner.test.mjs). Ingendera bevisar att den
// FAKTISKA ruttbegränsningen och "lämna kioskläge"-vägen fungerar i en riktig webbläsare.
//
// `test:e2e` startar bara auth/firestore/storage-emulatorerna (se package.json), INTE
// functions – samma medvetna gräns som redan gäller /leverantor (se rokprov.spec.js). En
// riktig PIN-verifiering (verifieraKioskPin) kan alltså inte köras här; testet nedan stannar
// vid att dialogen öppnas med rätt fält, inte ett lyckat upplåsningsförsök.
import { test, expect } from "@playwright/test";

async function loggaInSomKiosk(page) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', "e2e-kioskA@orga.test");
  await page.fill('input[type="password"]', "test1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

test("kiosk kan nå /akutlage och stannar där", async ({ page }) => {
  await loggaInSomKiosk(page);
  await page.goto("/akutlage");
  await page.waitForTimeout(500); // ge KioskBevakning.jsx:s useEffect en chans att ev. studsa
  expect(new URL(page.url()).pathname).toBe("/akutlage");
});

test("kiosk studsar tillbaka till startsidan från en otillåten sida (/profil)", async ({ page }) => {
  await loggaInSomKiosk(page);
  await page.goto("/profil");
  await page.waitForURL("**/", { timeout: 5_000 });
  expect(new URL(page.url()).pathname).toBe("/");
});

test("kiosk kan nå de tillåtna sidorna (kliniskt stöd, logistik, administration)", async ({ page }) => {
  await loggaInSomKiosk(page);
  for (const vag of ["/kliniskt-stod", "/logistik", "/administration"]) {
    await page.goto(vag);
    await page.waitForTimeout(300);
    expect(new URL(page.url()).pathname).toBe(vag);
  }
});

test("PIN-dialogen för att lämna kioskläge öppnas från Mer-menyn", async ({ page }) => {
  await loggaInSomKiosk(page);
  await page.getByRole("button", { name: "Mer" }).click();
  await page.getByRole("button", { name: "Lämna kioskläge" }).click();
  await expect(page.getByRole("heading", { name: "Lämna kioskläge" })).toBeVisible();
  await expect(page.getByLabel("PIN-kod")).toBeVisible();
  await expect(page.getByRole("button", { name: "Lås upp" })).toBeDisabled();
});

test("PIN-dialogen går att avbryta utan att lämna kioskläget", async ({ page }) => {
  await loggaInSomKiosk(page);
  await page.getByRole("button", { name: "Mer" }).click();
  await page.getByRole("button", { name: "Lämna kioskläge" }).click();
  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page.getByLabel("PIN-kod")).toBeHidden();
  // Fortfarande inloggad som kiosk, inte kastad till /logga-in.
  await page.goto("/akutlage");
  expect(new URL(page.url()).pathname).toBe("/akutlage");
});
