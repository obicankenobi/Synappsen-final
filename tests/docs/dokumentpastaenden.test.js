// Varje assertion här motsvarar ett påstående som FAKTISKT visade sig felaktigt i ett
// dokument, och som ingen upptäckte förrän någon råkade läsa noga. Testet binder påståendet
// till sin sanningskälla i koden, så att samma fel inte kan uppstå igen tyst.
//
// Varför just den här formen. Projektet har provat prosaregler ("uppdatera dokumentet i samma
// commit") sex gånger och de har misslyckats sex gånger. Ett alternativ som övervägdes var en
// färskhetsstämpel per dokument ("verifierad mot v5.128.0") – den förkastades av två skäl:
//
//   1. Den är spelbar. När testet failar är den billigaste åtgärden att bumpa stämpeln utan
//      att läsa dokumentet, vilket omvandlar SYNLIG inaktualitet till DOLD. Ett dokument som
//      ärligt säger "2026-07-28" är mer användbart än ett som ljuger att det är verifierat.
//   2. Den hade fångat 2 av de 6 verkliga felen nedan. Assertioner fångar 6 av 6, kostar noll
//      löpande ritual, och kan inte göras gröna utan att antingen dokumentet eller koden
//      faktiskt rättas.
//
// ATT LÄGGA TILL EN ASSERTION: när du hittar ett felaktigt påstående i ett dokument, rätta
// texten OCH lägg till en assertion här i samma commit. Det är så listan växer.
import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROT = fileURLToPath(new URL("../../", import.meta.url));
const las = (p) => readFileSync(join(ROT, p), "utf8");

/** Läser alla filer under en katalog rekursivt och returnerar deras sammanslagna innehåll. */
function lasKatalog(katalog, filter = () => true) {
  let ut = "";
  for (const post of readdirSync(join(ROT, katalog))) {
    const rel = `${katalog}/${post}`;
    if (statSync(join(ROT, rel)).isDirectory()) {
      ut += lasKatalog(rel, filter);
    } else if (filter(post)) {
      ut += las(rel);
    }
  }
  return ut;
}

describe("Rollantalet i dokumenten stämmer med koden", () => {
  // Verkligt fel: PITCH.md sa "6 roller" i flera veckor efter att kioskrollen byggts i
  // Etapp 55. Upptäcktes 2026-08-23 vid en granskning, inte av något test.
  const rollerJs = las("src/firebase/roles.js");
  const antalRoller = [...rollerJs.matchAll(/^\s{2}[A-Z_]+:\s*"[a-z]+",/gm)].length;

  test("koden definierar det antal roller vi tror", () => {
    expect(antalRoller).toBe(7);
  });

  test.each([
    ["saljmaterial/PITCH.md", /\((\d+) roller\)/],
    ["saljmaterial/kallfiler/Synappsen-teknisk-beskrivning.html", /(\w+) roller —/],
  ])("%s anger rätt antal roller", (fil, monster) => {
    const traff = las(fil).match(monster);
    expect(traff, `Hittade ingen rollangivelse i ${fil} (mönster: ${monster})`).not.toBeNull();
    const angivet = traff[1] === "sju" ? 7 : Number(traff[1]);
    expect(
      angivet,
      `${fil} anger ${traff[1]} roller men src/firebase/roles.js definierar ${antalRoller}.`
    ).toBe(antalRoller);
  });
});

describe("Påståenden om AI-märkning enligt AI-förordningens artikel 50", () => {
  // Verkligt fel: upphandlingssvarets svar E2 påstod ordagrant att "Transparenskravet i
  // artikel 50 hanteras genom att AI-genererat innehåll märks för läsaren". Ingen sådan
  // märkning fanns i koden. Ett aktivt felaktigt påstående i ett dokument avsett att klippas
  // in i skarpa anbud – allvarligare än ett inaktuellt, eftersom det aldrig varit sant.
  const kallkod = lasKatalog("src", (f) => f.endsWith(".jsx") || f.endsWith(".js"));
  const markningFinns = /aiMarkning|AI-genererat innehåll|ai-genererad|artikel 50/i.test(kallkod);

  test("upphandlingssvaret beskriver märkningen som byggd endast om den är det", () => {
    const svar = las("saljmaterial/kallfiler/Synappsen-upphandlingssvar.html");
    const pastarByggt = /artikel 50 hanteras genom att/i.test(svar);
    expect(
      pastarByggt && !markningFinns,
      "Upphandlingssvar E2 påstår att artikel 50-märkningen är implementerad, men ingen " +
        "märkning hittades i src/. Antingen bygg märkningen eller behåll den ärliga " +
        "formuleringen. Skicka aldrig ett anbudssvar som påstår en funktion som inte finns."
    ).toBe(false);
  });

  test("så länge märkningen saknas ska den redovisas som ej byggd", () => {
    if (markningFinns) return; // Märkningen är byggd – då gäller inte kravet nedan.
    const svar = las("saljmaterial/kallfiler/Synappsen-upphandlingssvar.html");
    expect(
      svar,
      "Märkningen saknas i koden, då måste upphandlingssvaret redovisa det öppet " +
        '(sök efter "ännu inte implementerad").'
    ).toMatch(/ännu inte implementerad/i);
  });
});

describe("Antalet godkända källdomäner för klinikstöd-sökningen stämmer", () => {
  // Verkligt fel, upptäckt 2026-08-30: avtal/UNDERBITRADEN.md sa "fem godkända medicinska
  // källdomäner" medan functions/klinikstod.js GODKANDA_KALLDOMANER hade sju sedan
  // källbevakningen byggdes ut. Ett dokument som lämnas till kundens dataskyddsombud
  // beskrev därmed en mindre behandling än den faktiska.
  const kallkod = las("functions/klinikstod.js");
  const traff = kallkod.match(/const GODKANDA_KALLDOMANER = \[([\s\S]*?)\];/);
  const antalDomaner = traff ? traff[1].split(",").filter((r) => r.trim().startsWith('"')).length : 0;

  test("koden har det antal källdomäner vi tror", () => {
    expect(antalDomaner).toBe(7);
  });

  test("avtal/UNDERBITRADEN.md anger rätt antal källdomäner", () => {
    const svar = las("avtal/UNDERBITRADEN.md");
    expect(svar).not.toMatch(/fem godkända medicinska källdomäner/i);
    expect(svar).toMatch(/sju godkända medicinska källdomäner/i);
  });
});

describe("Inga påståenden om kundbeteende utan kunder", () => {
  // Verkligt fel: prislistan märkte Drift-nivån "VANLIGASTE VALET", presentationerna
  // upprepade det, och demomanuset instruerade säljaren att säga "Drift, som är det de flesta
  // väljer". Med noll betalande kunder har ingen valt någonting. Det var den enda direkta
  // osanningen i det kundvända materialet, och den satt i ett paket vars hela säljproposition
  // är radikal ärlighet.
  const kundvant = [
    "saljmaterial/kallfiler/Synappsen-prislista.html",
    "saljmaterial/kallfiler/Synappsen-onepager-PRIVAT-VARDGIVARE.html",
    "saljmaterial/kallfiler/Synappsen-onepager-KOMMUNAL-VARD-OCH-OMSORG.html",
    "saljmaterial/kallfiler/Synappsen-onepager-REGION-OCH-SJUKHUS.html",
    "saljmaterial/Synappsen-demomanus.md",
    "saljmaterial/PITCH.md",
  ];

  test.each(kundvant)("%s påstår inget om vad kunder väljer", (fil) => {
    const fraser = [/VANLIGASTE VALET/i, /de flesta väljer/i, /populäraste valet/i];
    // Rader som uttryckligen FÖRBJUDER frasen ("Säg aldrig …") är inte påståenden utan
    // instruktioner, och måste få innehålla den. Filtrera bort dem rad för rad i stället för
    // att söka i hela filen.
    const pastaenden = las(fil)
      .split("\n")
      .filter((rad) => !/(aldrig|inte)\s.*(säg|påstå|skriv)|säg\s+(aldrig|inte)/i.test(rad));

    for (const fras of fraser) {
      const traff = pastaenden.find((rad) => fras.test(rad));
      expect(
        traff,
        `${fil} innehåller ett påstående om kundbeteende:\n  ${traff}\n\nProdukten har noll ` +
          "betalande kunder – ingen har valt något. Rekommendera nivån i eget namn i stället."
      ).toBeUndefined();
    }
  });
});

describe("Underbiträdesförteckningen beskriver klinikstödet korrekt", () => {
  // Verkligt fel: avtal/UNDERBITRADEN.md beskrev klinikstöd-sökningen som "pausad i UI" i
  // knappt fyra veckor efter att den återaktiverats. Ett dokument som lämnas till kundens
  // dataskyddsombud beskrev alltså en behandling som MINDRE omfattande än den faktiskt är –
  // fel riktning att ha fel åt i en underbiträdesförteckning.
  test("beskriver inte funktionen som pausad medan den är i drift", () => {
    const underbitraden = las("avtal/UNDERBITRADEN.md");
    const sakerhetsrapport = las("granskningar/SAKERHETSRAPPORT.md");
    const arAktiv = /INTE längre pausad/i.test(sakerhetsrapport);
    expect(arAktiv, "Förväntade att SAKERHETSRAPPORT.md anger klinikstödet som aktivt").toBe(true);

    // Tabellraden och detaljavsnittet får inte påstå att funktionen är pausad i UI.
    expect(
      underbitraden,
      "avtal/UNDERBITRADEN.md beskriver klinikstöd-sökningen som pausad, men " +
        "granskningar/SAKERHETSRAPPORT.md anger att den är i drift. Dokumentet lämnas till " +
        "kundens dataskyddsombud och måste beskriva den faktiska behandlingen."
    ).not.toMatch(/funktionen pausad i UI|är pausad i användargränssnittet\*\* sedan/i);
  });
});

describe("Tillgänglighetsredogörelsens sammanfattning stämmer med dess egen tabell", () => {
  // Verkligt fel: sammanfattningstexten sa att brist #8 och #9 kvarstod, medan tabellen längre
  // ner i SAMMA fil redovisade båda som åtgärdade i Etapp 68. Ett dokument som motsäger sig
  // självt är svårare att upptäcka än ett som är inaktuellt mot koden.
  const text = las("granskningar/TILLGANGLIGHETSREDOGORELSE.md");

  test("varje avvikelse som sammanfattningen kallar kvarstående är ofixad i tabellen", () => {
    // Bara FORMELLA kravbrott (nivå A eller AA) räknas. Avvikelse #11 (emoji i rubriker) har
    // nivå "–" och är uttryckligen "formellt inget kravbrott" – den ska inte tvingas in i
    // sammanfattningens lista över kvarstående brister.
    const kvarstaende = [...text.matchAll(/^\|\s*(\d+)\s*\|.*?\|\s*(?:\*\*)?(A{1,2})(?:\*\*)?\s*\|.*$/gm)]
      .filter((rad) => !/ÅTGÄRDAD|Åtgärdat/i.test(rad[0]))
      .map((rad) => Number(rad[1]));
    expect(kvarstaende.length, "Förväntade minst en kvarstående nivå A-avvikelse").toBeGreaterThan(0);

    // Sammanfattningens rättelse 2026-08-23 räknar upp de faktiskt kvarstående punkterna.
    const rattelse = text.match(/Faktiskt kvarstående är \*\*(.+?)\*\*/s);
    expect(rattelse, "Hittade ingen sammanfattning av kvarstående brister").not.toBeNull();

    for (const nr of kvarstaende) {
      expect(
        rattelse[1],
        `Tabellen redovisar avvikelse #${nr} som ofixad, men sammanfattningen räknar inte ` +
          "upp den. Sammanfattning och tabell måste stämma – de låg isär i tre veckor 2026."
      ).toMatch(new RegExp(`#${nr}\\b`));
    }
  });
});

describe("Modulplanen beskriver kioskläget som byggt", () => {
  // Verkligt fel: produkt/MODULPLAN.md listade kioskläget som ⬜ obyggt i fyra månader efter
  // att det byggts i Etapp 55, och blev därmed underlag för en köparanalys som drog slutsatser
  // om modulgränserna ur en felaktig bild.
  test("påstår inte att inget gränssnitt kontrollerar KIOSK_MODE", () => {
    const features = las("src/config/features.js");
    expect(features).toMatch(/KIOSK_MODE/);
    const kioskByggt = readdirSync(join(ROT, "src/components")).some((f) => /Kiosk/i.test(f));
    expect(kioskByggt, "Förväntade en kioskkomponent i src/components").toBe(true);

    expect(
      las("produkt/MODULPLAN.md"),
      "produkt/MODULPLAN.md påstår att inget gränssnitt kontrollerar KIOSK_MODE, men " +
        "kioskkomponenter finns i src/components. Planen låg fyra månader efter koden på " +
        "just den här raden."
    ).not.toMatch(/inget gränssnitt kontrollerar den ännu/i);
  });
});

describe("Påståenden om att det saknas betalande kunder", () => {
  // Så länge detta är sant ska det stå öppet i det kundvända materialet – det är paketets
  // starkaste förtroendeargument. Den dagen första kunden finns ska ALLA dessa ställen
  // uppdateras, och då failar testet och talar om exakt vilka filer det gäller.
  const HAR_BETALANDE_KUND = false;

  test.runIf(!HAR_BETALANDE_KUND)("redovisas öppet i de dokument som lovar det", () => {
    const filer = [
      "saljmaterial/kallfiler/Synappsen-prislista.html",
      "saljmaterial/kallfiler/Synappsen-teknisk-beskrivning.html",
      "saljmaterial/kallfiler/Synappsen-upphandlingssvar.html",
    ];
    for (const fil of filer) {
      expect(
        las(fil),
        `${fil} ska redovisa öppet att det inte finns någon kund ännu. När första kunden ` +
          "finns: sätt HAR_BETALANDE_KUND = true i det här testet och uppdatera samtliga filer."
      ).toMatch(/ingen kund|inte finns någon kund|ingen befintlig kund|ingen pilot/i);
    }
  });
});
