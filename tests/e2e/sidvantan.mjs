// Delad väntan för e2e-sviterna som går igenom många routes (tillganglighet.spec.js,
// rokprov.spec.js, sidomeny.spec.js). Ersätter de fasta `waitForTimeout(900)`/`(400)` som
// gjorde tillgänglighetssviten slumpvis röd i CI (PR #37, #39, #41 – `landmark-one-main` +
// `page-has-heading-one` på en route som varierade mellan körningar): efter en hel
// `page.goto` laddas appen om, SkyddadRoute väntar på Auth och sidan är lazy-laddad, så under
// CI-last hade varken `<main>` eller `<h1>` alltid hunnit renderas inom den fasta väntan –
// axe-core granskade ett tomt skal. Att höja väntetiden hade bara flyttat gränsen.
//
// Väntar i stället på att sidans faktiska innehåll finns: en synlig `<h1>` i `<main>`. Varje
// inloggad route har en sådan (det är just vad `page-has-heading-one`/`landmark-one-main`
// kräver). ErrorBoundary renderar en `<h2>`, så en kraschad sida matchas via `extraSelektor`
// där anroparen vill upptäcka kraschen direkt (rökprovet).
//
// Saknar en route legitimt `<h1>` i `<main>` sväljs bara timeouten – anroparen kör sin
// granskning ändå, och då är axe:s fynd verkligt. Returnerar false i det fallet så att
// anroparen kan skilja "innehållet kom aldrig" från "innehållet finns".
export const SIDINNEHALL = "main h1, [role=main] h1";

export async function vantaPaSidinnehall(page, { extraSelektor = null, timeout = 10_000 } = {}) {
  const selektor = extraSelektor ? `${SIDINNEHALL}, ${extraSelektor}` : SIDINNEHALL;
  try {
    await page.locator(selektor).first().waitFor({ state: "visible", timeout });
    return true;
  } catch (fel) {
    // Endast en timeout är ett "sidan saknar h1"-utfall. Allt annat (stängd sida, krasch i
    // webbläsaren) ska upp till testet, inte döljas här.
    if (fel?.name === "TimeoutError") return false;
    throw fel;
  }
}
