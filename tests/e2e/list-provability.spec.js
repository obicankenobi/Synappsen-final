// Etapp 31b: regressionstest för en buggklass som ingen enhets-/regeltest fångar (upptäckt två
// gånger den här sessionen – andringsforslag/{forslagId} i Etapp 26, bristanmalningar/{bristId}
// i Etapp 29): om en collections läsregel refererar ett resource.data-fält som klientens
// where()-fråga inte konstant kan bevisa, nekar Firestore HELA list-operationen (inte bara
// enskilda dokument) – en tyst permission-denied som bara syns som ett fel i webbläsarens
// konsol när en RIKTIG onSnapshot-lyssnare körs. tests/rules/*.test.mjs testar bara
// create/getDoc med kända fältvärden, aldrig den här vägen.
import { test, expect } from "@playwright/test";

async function loggaIn(page, email) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', "test1234");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

test("en vanlig roll (ingen redaktörsroll alls) får inga permission-denied vid normal navigering", async ({ page }) => {
  const permissionDenied = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /permission-denied/i.test(msg.text())) {
      permissionDenied.push(msg.text());
    }
  });

  await loggaIn(page, "e2e-personalA@orga.test");

  // Sidor som prenumererar på andringsforslag/bristanmalningar i bakgrunden (notiser, m.m.)
  // eller direkt (Logistik/ForradVy) – navigera runt som en helt vanlig medarbetare gör.
  // Positivkontroll: assertionen nedan är rent negativ ("inga permission-denied") och
  // passerar därför också om appen aldrig monterade – ett trasigt bygge eller en misslyckad
  // inloggning ger noll konsolfel av just den sorten och ser ut som ett godkänt test.
  // Kontrollera därför att varje sida verkligen laddades och inte kraschade.
  for (const vag of ["/kliniskt-stod", "/logistik", "/logistik/sterilforradet"]) {
    await page.goto(vag, { waitUntil: "load", timeout: 15_000 });
    expect(
      new URL(page.url()).pathname,
      `hamnade inte på ${vag} – lyssnarna hann aldrig köra, testet bevisar ingenting`
    ).toBe(vag);
    await expect(page.locator(".error-boundary"), `${vag}: sidan kraschade (ErrorBoundary)`).toHaveCount(0);
  }
  await page.waitForTimeout(1500); // ge onSnapshot-lyssnare tid att hinna felmeddela om de nekas

  expect(permissionDenied, `Oväntade permission-denied-fel:\n${permissionDenied.join("\n")}`).toHaveLength(0);
});
