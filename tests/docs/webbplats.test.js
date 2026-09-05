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

describe("Webbplatsens säkerhetsheaders finns kvar", () => {
  // Sajten har ingen server, ingen inmatning och ingen databas – hela dess försvar ligger i
  // svarsheadrarna. De är därför den enda säkerhetskontroll som FINNS här, och en header som
  // tyst försvinner vid en omstrukturering av firebase.json märks inte förrän någon skannar.
  const web = () => {
    const konf = JSON.parse(las("firebase.json"));
    const plats = konf.hosting.find((h) => h.target === "web");
    return plats.headers.find((b) => b.source === "**").headers;
  };
  const varde = (nyckel) => web().find((h) => h.key === nyckel)?.value;

  test.each([
    ["Content-Security-Policy", /default-src 'none'/],
    ["Strict-Transport-Security", /max-age=31536000/],
    ["X-Content-Type-Options", /nosniff/],
    ["X-Frame-Options", /DENY/],
    ["Referrer-Policy", /strict-origin/],
  ])("%s är satt", (nyckel, monster) => {
    expect(varde(nyckel), `hosting:web saknar ${nyckel} i firebase.json.`).toMatch(monster);
  });

  test("CSP:n tillåter varken inline-skript eller externa källor", () => {
    const csp = varde("Content-Security-Policy");
    for (const forbjudet of ["'unsafe-inline'", "'unsafe-eval'", "http://", "*"]) {
      expect(
        csp,
        `hosting:web-CSP:n innehåller ${forbjudet}. Sidan har inga inline-skript och laddar ` +
          "inget externt – policyn ska förbli lika strikt som verkligheten."
      ).not.toContain(forbjudet);
    }
  });
});

describe("Webbplatsens priser stämmer med prislistan", () => {
  // Priser på två ställen är en drifthärd. Prislistan är sanningskällan (den går i anbud);
  // webbplatsen upprepar dem för att prisöppenhet är en uttalad del av positioneringen
  // (produkt/VARUMARKE.md rad 38: "ett publicerat pris"). Den här vakten gör upprepningen
  // ofarlig – ändras prislistan utan att sidan följer med, failar testet.
  const PRISLISTA = "saljmaterial/kallfiler/Synappsen-prislista.html";
  // Prislistan sätter beloppet och enheten i skilda element ("39 000" respektive "kr per
  // enhet och år"), så jämförelsen görs på beloppet där och på hela strängen på webbplatsen,
  // vars markup vi själva äger.
  const NIVAER = [
    ["Kärna", "39 000"],
    ["Drift", "59 000"],
    ["Full", "89 000"],
  ];

  test.each(NIVAER)("%s kostar %s kr på båda ställena", (niva, belopp) => {
    expect(
      las(PRISLISTA),
      `${PRISLISTA} anger inte längre ${belopp} för ${niva}.`
    ).toContain(belopp);
    expect(
      las(HTML),
      `${HTML} anger inte ${belopp} kr för ${niva}, men ${PRISLISTA} gör det. Priserna måste ` +
        "vara överens – prislistan är sanningskällan."
    ).toContain(`${belopp} kr`);
  });

  test("de fyra tilläggen finns med samma pris som i prislistan", () => {
    for (const pris of ["6 000 kr", "350 kr", "3 000 kr", "25 000 kr"]) {
      expect(
        las(HTML),
        `${HTML} saknar tilläggspriset ${pris} som står i ${PRISLISTA}.`
      ).toContain(pris);
    }
  });

  test("sidan använder prislistans nivånamn, inte modulnamnen", () => {
    // Kärna/Drift/Full är vad kunden KÖPER. Core/Operations/Intelligence är de tekniska
    // modulnycklarna i functions/gemensamt.js och produkt/MODULPLAN.md. Sidan bar länge de
    // senare, vilket gjorde att en läsare mötte andra ord i prislistan än på webbplatsen.
    for (const modulnamn of ["Operations", "Intelligence"]) {
      expect(
        las(HTML),
        `${HTML} använder modulnamnet "${modulnamn}" i kundvänd text. Använd prislistans ` +
          "nivånamn (Kärna/Drift/Full) – modulnamnen är intern teknisk struktur."
      ).not.toContain(`>${modulnamn}<`);
    }
  });
});

describe("Integritetspolicyn stämmer med vad sidan faktiskt gör", () => {
  // En integritetspolicy som beskriver en behandling som inte sker är lika fel som en som
  // utelämnar en som sker – och den här påstår något ovanligt starkt (inga kakor, ingen
  // analys, inget externt). Det påståendet ska vara mekaniskt sant, inte bara välmenat.
  const POLICY = "synappsen-web/integritet.html";
  const SIDOR = ["synappsen-web/index.html", POLICY];

  test("ingen sida sätter kakor eller lagrar något i webbläsaren", () => {
    const kallor = [...SIDOR, "synappsen-web/sida.js"].map(las).join("\n");
    for (const monster of [/document\.cookie/, /localStorage/, /sessionStorage/, /indexedDB/]) {
      expect(
        kallor,
        `Webbplatsen använder ${monster.source}, men ${POLICY} påstår att den varken sätter ` +
          "kakor eller lagrar något i webbläsaren. Rätta policyn i samma commit."
      ).not.toMatch(monster);
    }
  });

  test("ingen sida laddar något från en annan domän", () => {
    for (const sida of SIDOR) {
      const externa = [...las(sida).matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
        .map((m) => m[1])
        .filter((u) => !u.startsWith("https://synappsen.se"));
      expect(
        externa,
        `${sida} laddar ${externa.join(", ")} från en annan domän. ${POLICY} påstår att inget ` +
          "laddas från någon annan – det påståendet skyddar besökaren och måste vara sant."
      ).toEqual([]);
    }
  });

  test("policyn är läsbar utan JavaScript", () => {
    // Verkligt fel, hittat 2026-09-05: sidan ärvde en inscrollningsanimation som satte
    // opacity:0 på varje sektion och avslöjade den med en IntersectionObserver. Policysidan
    // laddar inget skript – hela den juridiska texten var därför osynlig. Samma fel gjorde
    // allt under hjältesektionen på startsidan beroende av att JS kördes.
    expect(
      las(CSS),
      "stil.css döljer innehåll med opacity:0 igen. Sidorna måste vara läsbara utan " +
        "JavaScript – en integritetspolicy som kräver ett skript för att synas uppfyller " +
        "inte informationsplikten."
    ).not.toMatch(/opacity:\s*0\s*;/);
    expect(
      las(POLICY),
      `${POLICY} laddar inget skript, så den får inte förlita sig på en klass som JS sätter.`
    ).not.toContain("avslojas");
  });

  test("kontaktadressen är densamma på båda sidorna och är klickbar", () => {
    // Adressen är sidans enda kontaktväg OCH kanalen för GDPR-förfrågningar (art. 12,
    // svar inom en månad). Två sidor som anger olika adresser, eller en adress som bara
    // står som text utan mailto:, gör att en begäran kan hamna fel eller inte skickas alls.
    for (const sida of SIDOR) {
      expect(
        las(sida),
        `${sida} saknar en klickbar mailto-länk till kontakt@synappsen.se.`
      ).toContain('href="mailto:kontakt@synappsen.se"');
    }
    // Ingen ANNAN adress får smyga in – då blir det oklart vilken som gäller.
    const andra = [...SIDOR.map(las).join("\n").matchAll(/mailto:([^"]+)/g)]
      .map((m) => m[1])
      .filter((a) => a !== "kontakt@synappsen.se");
    expect(
      andra,
      `Webbplatsen anger fler e-postadresser än kontakt@synappsen.se: ${andra.join(", ")}.`
    ).toEqual([]);
  });

  test("startsidan länkar till policyn", () => {
    expect(
      las(HTML),
      "Startsidan länkar inte till integritetspolicyn. En policy som inte går att nå från " +
        "sidan den gäller uppfyller inte informationsplikten i art. 13."
    ).toContain('href="/integritet.html"');
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
