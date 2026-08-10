#!/usr/bin/env node
// Etapp 60a (ETAPPLAN12.md): mäter tid till interaktiv startsida, överförd datamängd och
// Fuse-indexbyggtid för en INLOGGAD superadmin mot en redan seedad emulator-organisation
// (scripts/prestandaseed.mjs). Engångsverktyg för mätning, inte en del av testsviten – ingen
// optimering görs här, bara siffror. Kräver: emulatorerna (firestore+auth) och `npm run dev`
// (VITE_USE_EMULATOR=true, port 5183) redan igång.
import { chromium } from "playwright";

const URL = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1] ?? "http://localhost:5183";

async function main() {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const context = await browser.newContext();
  const page = await context.newPage();

  // VIKTIGT (upptäckt under de första körningarna, i tur och ordning):
  //   1. Att summera "content-length"-headern missar Firestores Listen/Write-kanaler helt
  //      (transfer-encoding: chunked, ingen content-length-header alls).
  //   2. Att istället läsa response.body() missar OCKSÅ det – Firestores WebChannel håller
  //      en enda långlivad GET-anslutning öppen för realtidsdata, och response.body() löser
  //      sig aldrig (eller bara med en ofullständig del) förrän/om den anslutningen stängs,
  //      vilket den medvetet inte gör under en session.
  // Den enda tillförlitliga metoden (samma som Chrome DevTools Network-flikens "Transferred"-
  // kolumn) är CDP:s Network.dataReceived, som eldar löpande i takt med att bytes faktiskt
  // anländer på förbindelsen, oavsett om/när den stänger.
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  let totalBytes = 0;
  let antalDataEvent = 0;
  cdp.on("Network.dataReceived", (ev) => {
    totalBytes += ev.encodedDataLength;
    antalDataEvent++;
  });

  await page.goto(`${URL}/logga-in`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', "prestanda0@exempel.se");
  await page.fill('input[type="password"]', "test1234");

  const start = Date.now();
  await Promise.all([
    page.waitForURL("**/", { timeout: 30000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  // "Interaktiv" = sökfältet (alltid högst upp på Hem, kräver useSokindex färdigbyggt att
  // faktiskt kunna svara) är synligt OCH klickbart.
  await page.waitForSelector('input[type="search"], input[placeholder*="ök" i]', { timeout: 30000 });
  const tidTillInteraktiv = Date.now() - start;

  // Fuse-byggtiden mäts genom att be sidan själv slå upp navigationens performance-marks
  // (useSokindex.js instrumenterades TILLFÄLLIGT med performance.mark/measure för just den
  // här mätningen, se ETAPPLAN12.md §60a – ingen sådan kod finns kvar i det committade läget).
  const fuseTid = await page.evaluate(() => {
    const m = performance.getEntriesByName("fuse-build")[0];
    return m ? m.duration : null;
  });

  // Firestores initiala snapshot för en stor collection strömmas över flera sekunder efter
  // att "interaktiv" (sökfältet klart) redan uppnåtts – vänta in det innan den överförda
  // datamängden läses av, annars mäts bara en ofullständig delmängd.
  await page.waitForTimeout(6000);

  const minnesanvandning = await page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);

  console.log(JSON.stringify({
    url: URL,
    tidTillInteraktivMs: tidTillInteraktiv,
    fuseByggtidMs: fuseTid,
    overfordDataBytes: totalBytes,
    overfordDataKB: Math.round(totalBytes / 1024),
    antalDataReceivedEvent: antalDataEvent,
    jsHeapMB: minnesanvandning ? Math.round(minnesanvandning / 1024 / 1024) : null,
  }, null, 2));

  await browser.close();
}

main().catch((fel) => {
  console.error("Mätningen misslyckades:", fel);
  process.exit(1);
});
