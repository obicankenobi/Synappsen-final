// Etapp 45b: en extern dokumentationsgranskning (2026-08-04) pekade ut att samma enkla
// mekanism – ladda varje sida som varje roll, kontrollera att den renderar utan krasch –
// hade fångat tre av projektets mest citerade defekter (Etapp 31b:s tomma listor för
// `personal`-rollen, Korvy-knappens flex-läckage, Leverantörsvyns null-krasch vid ett
// nätverksfel) INNAN de hittades genom punktvis manuell granskning. Det här är den
// mekanismen: varje route i App.jsx, för varje roll i src/firebase/roles.js.
//
// Testet kontrollerar bara tre saker per sida (medvetet minimalt, "rökprov" – inte en
// funktionstest): sidan renderar, ingen ErrorBoundary-krasch, inga konsolfel. En roll som
// saknar behörighet till en route (RollSkyddadRoute) omdirigeras tyst till startsidan – det
// är korrekt, förväntat beteende, inte ett testfel, och kräver ingen särskild hantering här.
import { test, expect } from "@playwright/test";
import { ALLA_ROUTES } from "./rutter.mjs";

const LOSENORD = "test1234";

// Samtliga sju roller i src/firebase/roles.js. "plattformsadmin" (styr /leverantor-åtkomst
// server-side) är MEDVETET UTANFÖR den här sviten – det är en separat Firestore-collection,
// inte ett rollfält, och kräver en egen seedningsmekanism. Se OPPNA-PUNKTER.md om det ska
// läggas till senare.
//
// Etapp 61c (ETAPPLAN12.md): kiosk lades till sist (Etapp 45b täckte bara de sex roller som
// fanns då) – för kiosk är "renderar utan krasch" fortfarande rätt mått, trots att
// KioskBevakning.jsx aktivt studsar bort från de flesta av dessa routes: sidan hinner
// rendera innan omdirigeringen sker, och en tyst navigate() är exakt lika förväntat här som
// en RollSkyddadRoute-omdirigering redan är för övriga roller (se filens inledande kommentar).
const ROLLER = [
  { roll: "superadmin", epost: "e2e-superA@orga.test" },
  { roll: "vol", epost: "e2e-volA@orga.test" },
  { roll: "sektionsledare", epost: "e2e-sektionsledareA@orga.test" },
  { roll: "vec", epost: "e2e-vecA@orga.test" },
  { roll: "forradesansvarig", epost: "e2e-forradA@orga.test" },
  { roll: "personal", epost: "e2e-personalA@orga.test" },
  { roll: "kiosk", epost: "e2e-kioskA@orga.test" },
];

// `test:e2e` startar bara auth/firestore/storage-emulatorerna (se package.json), INTE
// functions – ett medvetet val för de två redan existerande specfilerna, som aldrig anropar
// en Cloud Function. /leverantor gör det (listaOrganisationer()) redan vid montering, vilket
// därför ALLTID ger en nätverksnivå-konsolrad ("Failed to load resource") oavsett miljö –
// inte en app-bugg. Sidan kraschar INTE (ErrorBoundary triggas inte) tack vare Etapp 43e:s
// `organisationer ?? []`-fix, vilket är precis det den här sviten faktiskt ska bevisa. Att
// lägga till en functions-emulator i test:e2e enbart för den här ena sidan är utanför 45b:s
// omfattning – filtrera bort just den kända, förväntade raden istället för att göra hela
// sviten mindre strikt.
const KANDA_MILJOBEGRANSNINGAR = {
  "/leverantor": [/Failed to load resource.*ERR_CONNECTION_REFUSED/i],
};

function arKantMiljobegransning(route, konsolrad) {
  const monster = KANDA_MILJOBEGRANSNINGAR[route] ?? [];
  return monster.some((m) => m.test(konsolrad));
}

async function loggaIn(page, epost) {
  await page.goto("/logga-in");
  await page.fill('input[type="email"]', epost);
  await page.fill('input[type="password"]', LOSENORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/", { timeout: 15_000 });
}

for (const { roll, epost } of ROLLER) {
  test(`rökprov (${roll}): samtliga ${ALLA_ROUTES.length} routes renderar utan krasch`, async ({ page }) => {
    // 25 sekventiella sidladdningar med inloggning ryms inte inom Playwrights standard-
    // testtimeout (30s) – särskilt eftersom "networkidle" (se nedan) annars kan vänta länge
    // på grund av Firestores ihållande realtidslyssnare (websocket), inte för att sidan
    // faktiskt hänger.
    test.setTimeout(120_000);

    const problem = [];
    let aktuellRoute = null;
    let konsolfelForRoute = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") konsolfelForRoute.push(msg.text());
    });
    page.on("pageerror", (fel) => {
      konsolfelForRoute.push(`pageerror: ${fel.message}`);
    });

    await loggaIn(page, epost);

    for (const route of ALLA_ROUTES) {
      aktuellRoute = route;
      konsolfelForRoute = [];

      // "load" istället för "networkidle": Firestores realtidslyssnare håller en ihållande
      // websocket-anslutning öppen, vilket kan hindra "networkidle" från att någonsin
      // upplösas – inte för att sidan faktiskt hänger. En kort extra väntan låter React/
      // Firestore hinna rendera första datan.
      await page.goto(route, { waitUntil: "load", timeout: 15_000 }).catch((fel) => {
        problem.push(`${route}: navigering misslyckades (${fel.message})`);
      });
      await page.waitForTimeout(400);

      const antalKrascher = await page.locator(".error-boundary").count();
      if (antalKrascher > 0) {
        problem.push(`${route}: ErrorBoundary visades (sidan kraschade vid rendering)`);
      }
      const oventadeKonsolfel = konsolfelForRoute.filter((rad) => !arKantMiljobegransning(route, rad));
      if (oventadeKonsolfel.length > 0) {
        problem.push(`${route}: konsolfel – ${oventadeKonsolfel.join(" | ")}`);
      }
    }

    expect(problem, `Roll: ${roll} (senast besökta route innan avslut: ${aktuellRoute})\n${problem.join("\n")}`).toEqual(
      []
    );
  });
}
