// Renderar webbplatsens delningsbilder (og:image, 1200 × 630 px) ur mallen
// delningsbild.html, med sajtens egna fonter och symbol. Bilderna ritas alltså inte för hand
// och kan göras om när en text ändras:
//
//   node synappsen-web/verktyg/delningsbilder.mjs
//
// Kräver @playwright/test (finns i repots devDependencies). Sätt PLAYWRIGHT_CHROMIUM_PATH om
// den förinstallerade Chromium-revisionen inte matchar, samma villkor som i
// playwright.config.js.
//
// Filerna i synappsen-web/ serveras genom en uppfångad adress (https://delning.invalid/) i
// stället för file://: Chromium vägrar ladda en font från file:// in i en sida, och då hade
// bilden tyst fått systemtypsnittet.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const WEBB = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(join(WEBB, "../package.json"));
const { chromium } = require("@playwright/test");

export const BILDER = [
  {
    fil: "bilder/dela-vard.png",
    typ: "Digital kunskapsbank för vården",
    budskap: "Rätt information, direkt i handen, när det är bråttom.",
    rad: "Rutiner, förråd och kontakter sökbara på sekunder",
    adress: "synappsen.se",
  },
  {
    fil: "bilder/dela-foretag.png",
    typ: "Företagslösningar",
    budskap: "Färre tomma tider. Mindre kvällsjobb.",
    rad: "Hemsidor med bokning och automatiska SMS",
    adress: "synappsen.se/foretag",
  },
];

const TYPER = { ".svg": "image/svg+xml", ".woff2": "font/woff2", ".html": "text/html; charset=utf-8" };
const escapa = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const webblasare = await chromium.launch(
  process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {}
);
const sida = await webblasare.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const mall = readFileSync(join(WEBB, "verktyg/delningsbild.html"), "utf8");
let aktuell = "";

await sida.route("https://delning.invalid/**", (route) => {
  const vag = new URL(route.request().url()).pathname;
  if (vag === "/") return route.fulfill({ contentType: TYPER[".html"], body: aktuell });
  return route.fulfill({
    contentType: TYPER[extname(vag)] ?? "application/octet-stream",
    body: readFileSync(join(WEBB, vag)),
  });
});

for (const b of BILDER) {
  aktuell = mall
    .replace("{{TYP}}", escapa(b.typ))
    .replace("{{BUDSKAP}}", escapa(b.budskap))
    .replace("{{RAD}}", escapa(b.rad))
    .replace("{{ADRESS}}", escapa(b.adress));
  await sida.goto("https://delning.invalid/");
  await sida.evaluate(() => document.fonts.ready);
  const fonter = await sida.evaluate(() => document.fonts.check('600 46px "Public Sans"'));
  if (!fonter) throw new Error("Public Sans laddades inte – bilden hade fått systemtypsnittet.");
  const png = await sida.screenshot({ type: "png" });
  writeFileSync(join(WEBB, b.fil), png);
  console.log(`skrev synappsen-web/${b.fil} (${Math.round(statSync(join(WEBB, b.fil)).size / 1024)} kB)`);
}

await webblasare.close();
