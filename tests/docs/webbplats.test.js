// Vakter för den publika marknadsplatsen (synappsen-web/).
//
// Varför sajten behöver egna vakter, utöver dem i dokumentpastaenden.test.js:
//
//   1. MDR art. 2(12) gör "avsett ändamål" till en funktion av vad tillverkaren säger
//      "in promotional or sales materials or statements". En publik webbplats är den mest
//      exponerade delen av det underlaget – mer exponerad än en onepager som går till en
//      namngiven mottagare. Ord som drar produkten mot MDR:s tillämpningsområde får därför
//      inte kunna smyga in genom en copyredigering.
//   2. Sajten har en EGEN kopia av varumärkestillgångarna, eftersom den ligger på en egen
//      hosting-site och inte kan läsa appens /fonts. Två kopior som ska vara lika är exakt
//      den konstruktion som glider i tysthet. Här jämförs de byte för byte.
//   3. Sajten skrevs första gången 2026-08-11, alltså FÖRE Etapp 68b/68d, och bar därför
//      gamla färgvärden – ett av dem (#cbd5e1 som kant-stark) var en defekt som fanns i
//      produktion. Vakten hindrar en återgång.
import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROT = fileURLToPath(new URL("../../", import.meta.url));
const las = (p) => readFileSync(join(ROT, p), "utf8");
const lasBinart = (p) => readFileSync(join(ROT, p));

const HTML = "synappsen-web/index.html";
const CSS = "synappsen-web/stil.css";

describe("Webbplatsen håller MDR-avgränsningen", () => {
  // granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md listar orden som aldrig får
  // användas om klinikstöd-sökningen. granskningar/JURIDISK-GRANSKNING.md § 6.4 förklarar
  // varför: en formulering som "beslutsstöd – ersätter aldrig klinisk bedömning" friskriver
  // och PÅSTÅR i samma andetag, och det är påståendet som väger i en kvalificeringsbedömning.
  const FORBJUDNA = [
    [/beslutsstöd/i, "beslutsstöd"],
    [/triageringsstöd/i, "triageringsstöd"],
  ];

  test.each(FORBJUDNA)("sidan använder aldrig ordet %s", (monster, ord) => {
    const traff = las(HTML)
      .split("\n")
      .find((rad) => monster.test(rad));
    expect(
      traff,
      `${HTML} innehåller "${ord}":\n  ${traff?.trim()}\n\nOrdet står på listan över ord som ` +
        "aldrig får användas om produkten (AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md). MDR " +
        "art. 2(12) gör säljmaterial till en del av kvalificeringsunderlaget – beskriv " +
        "funktionen utan att tillskriva den en klinisk roll."
    ).toBeUndefined();
  });

  test("sidan redovisar öppet att ingen enhet är i skarp drift", () => {
    // Så länge det saknas betalande kunder är den här skrivningen paketets starkaste
    // förtroendeargument, och den försvinner lättast av alla vid en copyputsning.
    expect(
      las(HTML),
      `${HTML} ska öppet redovisa att ingen enhet är i skarp drift. När första kunden finns ` +
        "ska den här raden uppdateras tillsammans med HAR_BETALANDE_KUND i " +
        "dokumentpastaenden.test.js."
    ).toMatch(/ingen enhet i skarp drift|ingen kund|ingen pilot/i);
  });
});

describe("Webbplatsens faktapåståenden stämmer med koden", () => {
  test("antalet godkända källdomäner stämmer med functions/klinikstod.js", () => {
    const domaner = las("functions/klinikstod.js")
      .match(/const GODKANDA_KALLDOMANER = \[([^\]]*)\]/s)[1]
      .split(",")
      .filter((d) => d.trim().startsWith('"')).length;

    const traff = las(HTML).match(/begränsad till (\w+) svenska källor/);
    expect(traff, `Hittade ingen källdomänangivelse i ${HTML}.`).not.toBeNull();
    const ord = { sex: 6, sju: 7, atta: 8, åtta: 8 };
    expect(
      ord[traff[1].toLowerCase()] ?? Number(traff[1]),
      `${HTML} anger ${traff[1]} källdomäner men functions/klinikstod.js definierar ${domaner}. ` +
        "Samma fel har redan inträffat en gång i avtal/UNDERBITRADEN.md."
    ).toBe(domaner);
  });
});

describe("Webbplatsen följer den antagna grafiska profilen", () => {
  // produkt/GRAFISK-PROFIL.md §2. Båda värdena byttes på MÄTNING, inte smak, och det gamla
  // --kant-stark var en faktisk defekt i produktion (1,48:1 mot krävda 3:1).
  const UTGANGNA = [
    ["#2563eb", "--primar", "bytt i Etapp 68b: 5,17:1 -> 5,63:1 mot vit yta"],
    ["#cbd5e1", "--kant-stark", "bytt i Etapp 68d: gav 1,48:1, WCAG 1.4.11 kräver 3:1"],
  ];

  // Kommentarer strippas först. Filens egen huvudkommentar DOKUMENTERAR bytet och citerar
  // därför båda de gamla värdena – den förklaringen är poängen och ska inte behöva tas bort
  // för att vakten ska gå igenom. Det är deklarationerna som ska vara fria från dem.
  const cssUtanKommentarer = () => las(CSS).replace(/\/\*[\s\S]*?\*\//g, "");

  test.each(UTGANGNA)("använder inte det utgångna värdet %s (%s)", (hex, token, skal) => {
    expect(
      cssUtanKommentarer().toLowerCase().includes(hex),
      `${CSS} innehåller ${hex} i en deklaration. Det ersattes som ${token} (${skal}). ` +
        "Se GRAFISK-PROFIL.md §2 innan du lägger tillbaka det."
    ).toBe(false);
  });

  test("primärfärgen är profilens varumärkesblå", () => {
    expect(las(CSS)).toMatch(/--primar:\s*#2f5fd6/i);
  });

  test("laddar inga externa resurser", () => {
    // Sajtens CSP är `default-src 'none'` med allt annat låst till 'self'. En <link> mot
    // fonts.googleapis.com eller ett CDN-skript skulle blockeras tyst av webbläsaren och
    // sidan falla tillbaka på systemtypsnittet. Samma regel som appen (krav 32).
    const externa = [...las(HTML).matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
      .map((m) => m[1])
      // og:url och canonical pekar ut sidans egen adress och laddar ingenting.
      .filter((u) => !u.startsWith("https://synappsen.se"));
    expect(
      externa,
      `${HTML} laddar externa resurser: ${externa.join(", ")}. Sajtens CSP blockerar dem – ` +
        "bädda in eller självhosta i stället."
    ).toEqual([]);
  });

  test("sidan deklarerar svenskt språk", () => {
    expect(las(HTML)).toMatch(/<html lang="sv">/);
  });
});

describe("VARUMARKE.md påstår inte att källdokumenten saknas i repot", () => {
  // Verkligt fel, rättat 2026-09-05: dokumentets läsanvisning påstod att MARKNADSANALYS.md,
  // KOSTNADSKALKYL-OCH-PRISSATTNING.md, KANDIDATLISTA-PRIVAT-VARD.md, GRAFISK-PROFIL.md och
  // synappsen-web/ fanns "enbart i Claude-projektet, inte i git-repot". Fyra av dem hade
  // committats under tiden utan att raden följde med, och den femte committades samma dag.
  // Påståendet gjorde att en läsare inte ens försökte följa pekarna.
  test("raden om att pekarna inte går att följa är borta", () => {
    expect(
      las("produkt/VARUMARKE.md"),
      "produkt/VARUMARKE.md påstår att källdokumenten ligger utanför git-repot. Samtliga " +
        "ligger i repot sedan 2026-09-05 – rätta läsanvisningen i stället för att ta bort " +
        "det här testet."
    ).not.toMatch(/enbart i\s*>?\s*Claude-projektet, inte i git-repot/);
  });
});

describe("Webbplatsens varumärkestillgångar är identiska med appens", () => {
  // Sajten ligger på en egen hosting-site och kan inte läsa appens /fonts. Kopiorna måste
  // därför finnas – men två kopior som ska vara lika glider i tysthet om ingen tittar.
  const KOPIOR = [
    ["public/fonts/public-sans-400.woff2", "synappsen-web/fonts/public-sans-400.woff2"],
    ["public/fonts/public-sans-600.woff2", "synappsen-web/fonts/public-sans-600.woff2"],
    // OFL kräver att licensnotisen följer med fontfilerna. Följer fonten med, följer denna med.
    ["public/fonts/OFL.txt", "synappsen-web/fonts/OFL.txt"],
    ["public/icons/symbol-axon.svg", "synappsen-web/icons/symbol-axon.svg"],
    ["public/favicon.svg", "synappsen-web/icons/favicon.svg"],
  ];

  test.each(KOPIOR)("%s är identisk med %s", (kalla, kopia) => {
    expect(
      lasBinart(kopia).equals(lasBinart(kalla)),
      `${kopia} skiljer sig från ${kalla}. Uppdatera kopian i samma commit som originalet – ` +
        "annars visar webbplatsen ett annat märke eller ett annat typsnitt än produkten."
    ).toBe(true);
  });
});
