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
import { DOKUMENT } from "../../synappsen-web/verktyg/bygg-underlag.mjs";

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
    // Tillagd 2026-09-05: den publika webbplatsen ärvde felet "Sex roller" från sin första
    // version (2026-08-11), alltså exakt samma fel som PITCH.md gjorde efter Etapp 55,
    // och det på en sida som samtidigt beskriver kioskläget i egen sektion.
    ["synappsen-web/index.html", /(\w+) roller\./],
  ])("%s anger rätt antal roller", (fil, monster) => {
    const traff = las(fil).match(monster);
    expect(traff, `Hittade ingen rollangivelse i ${fil} (mönster: ${monster})`).not.toBeNull();
    const angivet = traff[1].toLowerCase() === "sju" ? 7 : Number(traff[1]);
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
    "synappsen-web/index.html",
    "synappsen-web/foretag.html",
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

  test("varje avvikelse som är ofixad i tabellen räknas upp i sammanfattningen – eller så säger sammanfattningen uttryckligen att inga finns", () => {
    // Bara FORMELLA kravbrott (nivå A eller AA) räknas. Avvikelse #11 (emoji i rubriker) har
    // nivå "–" och är uttryckligen "formellt inget kravbrott" – den ska inte tvingas in i
    // sammanfattningens lista över kvarstående brister.
    const kvarstaende = [...text.matchAll(/^\|\s*(\d+)\s*\|.*?\|\s*(?:\*\*)?(A{1,2})(?:\*\*)?\s*\|.*$/gm)]
      .filter((rad) => !/ÅTGÄRDAD|Åtgärdat/i.test(rad[0]))
      .map((rad) => Number(rad[1]));

    if (kvarstaende.length === 0) {
      // Samtliga brister åtgärdade 2026-09-10 – testet ska då INTE tvinga fram ett påstått
      // kvarstående fel. I stället måste dokumentet uttryckligen säga att inget känt återstår,
      // så att en framtida NY brist som läggs till i tabellen utan att nämnas här fångas av
      // grenen nedan i stället för att tyst falla igenom.
      expect(
        text,
        "Tabellen har noll kvarstående nivå A/AA-avvikelser, men dokumentet säger inte " +
          "uttryckligen att inget känt återstår – uppdatera 'Uppdatering 2026-09-10'-stycket."
      ).toMatch(/ingen känd kvarstående\s+avvikelse mot WCAG/i);
      return;
    }

    // Sammanfattningens rättelse 2026-08-23 räknar upp de faktiskt kvarstående punkterna.
    const rattelse = text.match(/Faktiskt kvarstående (?:är|var) \*\*(.+?)\*\*/s);
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

describe("Produktdefinitionens diskrepansavsnitt speglar faktisk kod", () => {
  // PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md § 9 listar två ställen där koden INTE gör det
  // projektets övriga dokument påstår. Ett sådant avsnitt har en inbyggd förfallotid: den dag
  // koden rättas blir dokumentet fel åt andra hållet – det skulle då påstå att en brist finns
  // som inte längre gör det, i ett underlag som lämnas till en anlitad jurist.
  //
  // Assertionerna nedan är därför VILLKORADE: de läser koden först och kräver att dokumentet
  // säger samma sak. De är gröna i dag (bristerna finns) och blir röda i samma sekund som
  // någon rättar koden utan att skriva om § 9. Det är exakt den drift registret i övrigt
  // bevakar, fast tillämpad på ett dokument som beskriver brister i stället för förmågor.
  const DEF = "granskningar/PRODUKTDEFINITION-REGULATORISKT-UNDERLAG.md";

  test("§ 9.1 gäller så länge gränssnittet säger 'Beslutsstöd'", () => {
    const uiSagerBeslutsstod = /Beslutsstöd/.test(las("src/components/KlinikfragaSok.jsx"));
    const dokPastarBristen = /9\.1 Gränssnittet säger fortfarande "Beslutsstöd"/.test(las(DEF));

    expect(
      dokPastarBristen,
      uiSagerBeslutsstod
        ? `${DEF} § 9.1 har tagits bort, men KlinikfragaSok.jsx säger fortfarande ` +
            '"Beslutsstöd". Diskrepansen finns kvar och ska stå kvar i underlaget.'
        : 'KlinikfragaSok.jsx säger inte längre "Beslutsstöd" – bra. Skriv då om ' +
            `${DEF} § 9.1 så att den beskriver rättelsen i stället för bristen, och ta bort ` +
            "raden ur OPPNA-PUNKTER.md. Ett underlag till en jurist får inte påstå en brist " +
            "som inte längre finns."
    ).toBe(uiSagerBeslutsstod);
  });

  test("§ 9.2 gäller så länge steg-arrayen saknar nyckelspärr i regellagret", () => {
    // Fyndet: firestore.rules begränsar ANTALET steg och personnummer i stegens text, men
    // ingen regel begränsar vilka NYCKLAR ett stegobjekt får ha. Sanningskällan är att inget
    // hasOnly() i regelfilen nämner något av checklistsegets fält.
    const regler = las("firestore.rules");
    const stegHarNyckelsparr = /hasOnly\(\[[^\]]*timerSekunder/.test(regler);
    const dokPastarBristen = /9\.2 Checklistsegets fältuppsättning är inte spärrad/.test(las(DEF));

    expect(
      dokPastarBristen,
      stegHarNyckelsparr
        ? "firestore.rules har nu en nyckelspärr för checklistegen – skriv om " +
            `${DEF} § 9.2, och notera att MDR-argumentet därmed FAKTISKT kan framföras som ` +
            "strukturellt. Det är en förstärkning värd att dokumentera, inte radera."
        : `${DEF} § 9.2 har tagits bort, men firestore.rules saknar fortfarande en ` +
            "nyckelspärr för checklistegen. Diskrepansen finns kvar och bär MDR-slutsatsen."
    ).toBe(!stegHarNyckelsparr);
  });
});

describe("Webbplatsens bevissiffror stämmer med testsviterna", () => {
  // Tillagt 2026-09-06. Webbplatsen anger sedan dess konkreta antal – antal
  // behörighetstester, antal isoleringstester, antal säkerhetsgenomgångar – i stället för
  // formuleringen "verifierad med automatiska tester". Ett tal är ett starkare argument än
  // en adjektivform, men det är också exakt den sortens påstående som glider i tysthet:
  // saljmaterial/MARKNADSANALYS.md bär redan felet (149 regeltester och fyra
  // säkerhetsgenomgångar, se P3 i produkt/VARUMARKE.md §14) sedan månader tillbaka.
  //
  // Assertionerna nedan RÄKNAR källan och kräver att sidan säger samma sak. De blir röda när
  // någon lägger till ett regeltest utan att uppdatera webbplatsen – vilket är meningen:
  // siffran ska antingen stämma eller inte stå där.
  const INDEX = "synappsen-web/index.html";
  const UNDERLAG = "synappsen-web/underlag.html";

  /** Antal `await test(...)`-anrop i en regeltestfil. Varje sådant anrop är ett test. */
  const antalTester = (fil) => [...las(fil).matchAll(/^\s*await test\(/gm)].length;

  const regelfiler = readdirSync(join(ROT, "tests/rules"))
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => `tests/rules/${f}`);
  const totalt = regelfiler.reduce((summa, f) => summa + antalTester(f), 0);
  const isolering = antalTester("tests/rules/organisationsisolering.test.mjs");

  test("det totala antalet behörighetstester stämmer på båda sidorna", () => {
    for (const fil of [INDEX, UNDERLAG]) {
      const traff = las(fil).match(/(\d+) automatiska behörighetstester|(\d+) behörighetstester/);
      expect(traff, `Hittade ingen angivelse av antal behörighetstester i ${fil}.`).not.toBeNull();
      expect(
        Number(traff[1] ?? traff[2]),
        `${fil} anger ${traff[1] ?? traff[2]} behörighetstester, men tests/rules/ innehåller ` +
          `${totalt} stycken fördelade på ${regelfiler.length} filer. Rätta sidan – siffran ` +
          "ska antingen stämma eller inte stå där."
      ).toBe(totalt);
    }
  });

  test("antalet isoleringstester stämmer på båda sidorna", () => {
    for (const fil of [INDEX, UNDERLAG]) {
      const traff = las(fil).match(/(\d+) av dem/);
      expect(traff, `Hittade ingen angivelse av antal isoleringstester i ${fil}.`).not.toBeNull();
      expect(
        Number(traff[1]),
        `${fil} anger ${traff[1]} isoleringstester, men ` +
          `tests/rules/organisationsisolering.test.mjs innehåller ${isolering}.`
      ).toBe(isolering);
    }
  });

  test("antalet säkerhetsgenomgångar stämmer med granskningar/SAKERHETSRAPPORT.md", () => {
    // Varje genomgång skrivs in som ett eget "## Tillägg (datum, version): …"-block, se
    // CLAUDE.md:s regel om återkommande säkerhetsgenomgång vid varje större release.
    const antal = [...las("granskningar/SAKERHETSRAPPORT.md").matchAll(/^## Tillägg/gm)].length;
    const traff = las(UNDERLAG).match(/(\d+) säkerhetsgenomgångar/);
    expect(traff, `Hittade ingen angivelse av antal säkerhetsgenomgångar i ${UNDERLAG}.`).not.toBeNull();
    expect(
      Number(traff[1]),
      `${UNDERLAG} anger ${traff[1]} säkerhetsgenomgångar, men ` +
        `granskningar/SAKERHETSRAPPORT.md innehåller ${antal} tilläggsblock.`
    ).toBe(antal);
  });

  test("incidentresponsplanens version stämmer med planens egen rubrik", () => {
    // underlag.html listar planen som "lämnas på begäran" med versionsnummer. Planens
    // versionsnummer ska höjas vid varje sakändring (CLAUDE.md), vilket gör en utskriven
    // version på en publik sida till en drifthärd om den inte binds.
    const traff = las("avtal/INCIDENTRESPONSPLAN.md").match(/^\*\*Version:\*\* ([\d.]+)/m);
    expect(traff, "Hittade inget versionsnummer i avtal/INCIDENTRESPONSPLAN.md.").not.toBeNull();
    expect(
      las(UNDERLAG),
      `${UNDERLAG} anger inte version ${traff[1]} för incidentresponsplanen, som planen själv ` +
        "uppger. Höjs planens version ska sidan följa med i samma commit."
    ).toContain(`Version ${traff[1]}`);
  });
});

describe("CLAUDE_STATUS.md räknar arkivets uppföljningar rätt", () => {
  // Verkligt fel, upptäckt 2026-09-07 vid en merge: läsanvisningen uppgav 131 uppföljningar
  // medan etapplaner/STATUSARKIV.md innehöll 151. Siffran glider varje gång 400-radersgränsen
  // tvingar fram en arkivering, alltså med jämna mellanrum och alltid tyst - precis det
  // mönster registret i övrigt finns för att fånga.
  test("antalet stämmer med etapplaner/STATUSARKIV.md", () => {
    const faktiskt = [...las("etapplaner/STATUSARKIV.md").matchAll(/^## Uppföljning/gm)].length;
    const traff = las("CLAUDE_STATUS.md").match(/\((\d+) uppföljningar från/);
    expect(traff, "Hittade ingen antalsuppgift i CLAUDE_STATUS.md:s läsanvisning.").not.toBeNull();
    expect(
      Number(traff[1]),
      `CLAUDE_STATUS.md uppger ${traff[1]} uppföljningar, men etapplaner/STATUSARKIV.md ` +
        `innehåller ${faktiskt}. Rätta siffran när du arkiverar - det är då den glider.`
    ).toBe(faktiskt);
  });
});

describe("Uppstartsavgiften ges inte bort (BESLUTSLOGG.md 2026-08-23 och 2026-10-22)", () => {
  // Beslutet fattades 2026-08-23 och prislistan sades rättad, men både prislistan och
  // startsidan lovade fortfarande att avgiften "utgår helt för de tre första
  // referenskunderna" när det upptäcktes 2026-10-22. Referenskunder får 50 % på
  // abonnemanget år 1, aldrig på uppstarten.
  test.each(["synappsen-web/index.html", "saljmaterial/kallfiler/Synappsen-prislista.html"])(
    "%s lovar inte att uppstartsavgiften utgår eller halveras",
    (fil) => {
      const text = las(fil);
      expect(text, `${fil} säger att uppstartsavgiften utgår`).not.toMatch(/utgår helt/i);
      expect(text, `${fil} halverar uppstartsavgiften`).not.toMatch(/Halva avgiften/i);
    }
  );
});

describe("Piloten är betald i allt kundvänt material (BESLUTSLOGG.md 2026-10-22)", () => {
  // Startsidan sa betald pilot medan prislistan, tre onepagers, upphandlingssvaret,
  // e-postmallarna och demomanuset fortfarande sa "kostnadsfri pilot, 0 kr". Ägaren avgjorde
  // 2026-10-22: pilotperioden betalas av alla vårdköpare. Piloten gäller bara vårdsystemet.
  const KUNDVANT = [
    "synappsen-web/index.html",
    "saljmaterial/kallfiler/Synappsen-prislista.html",
    "saljmaterial/kallfiler/Synappsen-upphandlingssvar.html",
    "saljmaterial/kallfiler/Synappsen-onepager-KOMMUNAL-VARD-OCH-OMSORG.html",
    "saljmaterial/kallfiler/Synappsen-onepager-REGION-OCH-SJUKHUS.html",
    "saljmaterial/kallfiler/Synappsen-onepager-PRIVAT-VARDGIVARE.html",
    "saljmaterial/Synappsen-epostmallar.md",
    "saljmaterial/Synappsen-demomanus.md",
  ];
  test.each(KUNDVANT)("%s beskriver inte piloten som kostnadsfri", (fil) => {
    const text = las(fil).replace(/\s+/g, " ");
    expect(text, `${fil} säger kostnadsfri pilot`).not.toMatch(/kostnadsfri,? (tidsbegränsad )?pilot/i);
    expect(text, `${fil} säger pilot till 0 kr`).not.toMatch(/pilot[^.]{0,40}\b0 kr/i);
    expect(text, `${fil} säger att piloten är kostnadsfri`).not.toMatch(/piloten är kostnadsfri/i);
  });

  test("företagssidan erbjuder ingen pilot (den gäller bara vårdsystemet)", () => {
    expect(las("synappsen-web/foretag.html")).not.toMatch(/pilot/i);
  });
});

describe("Startsidan säger rätt om vilka upphandlingsdokument som är publicerade", () => {
  // Verkligt fel, rättat 2026-10-22: avsnittet "Upphandlingsklart" räknade upp PUB-avtalsmall,
  // underbiträdesförteckning, DPIA-underlag och tekniskt faktablad och sa "Tre av dem ligger
  // publicerade". Bara två av de fyra är publicerade; den tredje publicerade sidan är
  // tillgänglighetsredogörelsen, som inte fanns i uppräkningen. Sanningskällan är listan över
  // genererade dokument i synappsen-web/verktyg/bygg-underlag.mjs.
  const text = las("synappsen-web/index.html")
    .replace(/<[^>]+>/g, "")
    .replace(/[\s\u00a0]+/g, " ");
  const stycke = text.slice(text.indexOf("Upphandlingsklart"), text.indexOf("Upphandlingsklart") + 600);
  const publicerade = DOKUMENT.map((d) => d.titel);

  test("påstår inte ett antal publicerade dokument som inte stämmer", () => {
    expect(stycke).not.toMatch(/Tre av dem ligger/);
  });

  test("de dokument stycket kallar publicerade finns i generatorns lista, och de övriga gör det inte", () => {
    expect(publicerade).toContain("Underbiträdesförteckning");
    expect(publicerade).toContain("Tekniskt faktablad");
    expect(publicerade).not.toContain("PUB-avtalsmall");
    expect(publicerade).not.toContain("DPIA-underlag");
    expect(stycke).toMatch(/Underbiträdesförteckningen och faktabladet ligger publicerade/);
    expect(stycke).toMatch(/PUB-avtalsmallen och DPIA-underlaget skickar jag på begäran/);
  });
});
