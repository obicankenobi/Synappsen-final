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
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { DOKUMENT, generera } from "../../synappsen-web/verktyg/bygg-underlag.mjs";

const ROT = fileURLToPath(new URL("../../", import.meta.url));
const las = (p) => readFileSync(join(ROT, p), "utf8");
const lasBinart = (p) => readFileSync(join(ROT, p));

// Vårdsidan. Fram till 2026-10-23 var den startsida (index.html); sedan dess är startsidan
// ett vägval mellan vården och företagen, och vårdsidan ligger på /vard.
const HTML = "synappsen-web/vard.html";
const START = "synappsen-web/index.html";
const CSS = "synappsen-web/stil.css";
const FORETAG = "synappsen-web/foretag.html";

describe("Webbplatsen håller MDR-avgränsningen", () => {
  // granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md listar orden som aldrig får
  // användas om klinikstöd-sökningen. granskningar/JURIDISK-GRANSKNING.md § 6.4 förklarar
  // varför: en formulering som "beslutsstöd – ersätter aldrig klinisk bedömning" friskriver
  // och PÅSTÅR i samma andetag, och det är påståendet som väger i en kvalificeringsbedömning.
  const FORBJUDNA = [
    [/beslutsstöd/i, "beslutsstöd"],
    [/triageringsstöd/i, "triageringsstöd"],
  ];

  test.each(FORBJUDNA.flatMap((f) => [HTML, FORETAG, "synappsen-web/levande-innehall.html", "synappsen-web/fallstudie.html"].map((sida) => [sida, ...f])))(
    "%s använder aldrig ordet %s",
    (sida, monster, ord) => {
    const traff = las(sida)
      .split("\n")
      .find((rad) => monster.test(rad));
    expect(
      traff,
      `${sida} innehåller "${ord}":\n  ${traff?.trim()}\n\nOrdet står på listan över ord som ` +
        "aldrig får användas om produkten (AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md). MDR " +
        "art. 2(12) gör säljmaterial till en del av kvalificeringsunderlaget – beskriv " +
        "funktionen utan att tillskriva den en klinisk roll."
    ).toBeUndefined();
    }
  );

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
  // Sedan 2026-09-06 fyra sidor till: underlagssidan och de tre genererade dokumentsidorna.
  // Listan måste växa med sidorna – annars gäller påståendena i policyn ("inga kakor, inget
  // externt") bara de två sidor som råkade finnas när testet skrevs.
  const SIDOR = [
    START,
    "synappsen-web/vard.html",
    "synappsen-web/underlag.html",
    "synappsen-web/tillganglighet.html",
    "synappsen-web/underbitraden.html",
    "synappsen-web/it-faktablad.html",
    FORETAG,
    POLICY,
  ];

  test("ingen sida sätter kakor eller lagrar något i webbläsaren", () => {
    const kallor = [...SIDOR, "synappsen-web/sida.js", "synappsen-web/start.js"].map(las).join("\n");
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
      // ?subject=… hör till samma adress: det är ämnesraden i bokningsknappen.
      .map((m) => m[1].split("?")[0])
      .filter((a) => a !== "kontakt@synappsen.se");
    expect(
      andra,
      `Webbplatsen anger fler e-postadresser än kontakt@synappsen.se: ${andra.join(", ")}.`
    ).toEqual([]);
  });

  test.each([START, HTML])("%s länkar till policyn", (sida) => {
    expect(
      las(sida),
      "Startsidan länkar inte till integritetspolicyn. En policy som inte går att nå från " +
        "sidan den gäller uppfyller inte informationsplikten i art. 13."
    ).toContain('href="/integritet"');
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
describe("De genererade dokumentsidorna motsvarar sina källdokument", () => {
  // synappsen-web/{tillganglighet,underbitraden,it-faktablad}.html publicerar tre dokument i
  // sin helhet. En handkopierad HTML-version hade blivit projektets sjunde fall av samma
  // felmönster – två kopior av samma påstående som glider isär – och den här gången i
  // dokument som går till kundens dataskyddsombud.
  //
  // Lösningen är den enda som bevisligen har hållit i det här projektet: gör driften
  // mekaniskt omöjlig. Sidorna GENERERAS ur markdownfilerna, och testet nedan kör generatorn
  // igen och jämför med det som ligger committat. Ändras källdokumentet utan att sidorna
  // genereras om, failar testet.
  //
  // ÅTGÄRD NÄR DET FAILAR: kör `node synappsen-web/verktyg/bygg-underlag.mjs` och committa
  // resultatet. Redigera aldrig de genererade sidorna för hand.
  test.each(DOKUMENT.map((d) => [d.sida, d.kalla]))(
    "%s är genererad ur %s och är i takt med den",
    (sidfil) => {
      const forvantad = generera().find((g) => g.sida === sidfil);
      expect(
        las(sidfil),
        `${sidfil} motsvarar inte längre sin källa. Kör:\n\n` +
          "  node synappsen-web/verktyg/bygg-underlag.mjs\n\n" +
          "och committa resultatet i samma commit som ändringen av källdokumentet."
      ).toBe(forvantad.html);
    }
  );

  test("de genererade sidorna är noindex så länge resten av webbplatsen är det", () => {
    // De tre sidorna publicerar dokument som innehåller öppna brister och interna sökvägar.
    // Så länge startsidan är gömd ska de vara det också – annars kan en sökmotor nå
    // underbiträdesförteckningen utan att någon tagit ställning till den saken.
    const startsidanArGomd = /content="noindex, nofollow"/.test(las(HTML));
    for (const d of DOKUMENT) {
      expect(
        /content="noindex, nofollow"/.test(las(d.sida)),
        `${d.sida} har inte samma noindex som startsidan. Tas noindex bort ska det göras på ` +
          "alla sidor samtidigt och efter ett uttryckligt beslut, inte sida för sida."
      ).toBe(startsidanArGomd);
    }
  });

  test("alla sidor och robots.txt är antingen gömda eller öppna, aldrig en blandning", () => {
    // noindex togs bort 2026-10-21 (BESLUTSLOGG.md). Växlingen rör flera filer för hand, och ett
    // halvt utfört byte är värre än något av ändlägena: en sida som sökmotorerna får läsa
    // medan robots.txt fortfarande stänger ute dem (eller tvärtom) ger ett oförutsägbart
    // resultat och märks inte förrän någon söker efter sidan.
    const sidor = [
      START,
      HTML,
      FORETAG,
      "synappsen-web/integritet.html",
      "synappsen-web/underlag.html",
      ...DOKUMENT.map((d) => d.sida),
    ];
    const gomd = (fil) => /content="noindex/.test(las(fil));
    const robotsStangd = /^Disallow:\s*\/\s*$/m.test(las("synappsen-web/robots.txt"));
    for (const fil of sidor) {
      expect(
        gomd(fil),
        `${fil} är ${gomd(fil) ? "noindex" : "indexerbar"} men robots.txt är ` +
          `${robotsStangd ? "stängd (Disallow: /)" : "öppen"}. Byt alla sidor och robots.txt samtidigt.`
      ).toBe(robotsStangd);
    }
  });
});

describe("Webbplatsen visar gränssnittet i stället för att rita av det", () => {
  // Verkligt fel, rättat 2026-09-06: hjältesektionen innehöll en handritad HTML-attrapp av
  // appens sökruta. För att markeringen skulle gå ihop var ordet felstavat i markupen –
  // "Urin<mark>kad</mark>eter" renderas som "Urinkadeter" – samtidigt som bildtexten under
  // och attrappens egen aria-label stavade "urinkateter" rätt. Det var alltså en klinisk
  // term stavad fel i det första en vårdanställd läsare ser, i en attrapp som fanns för att
  // demonstrera att sökningen hittar rätt term.
  //
  // Attrappen är ersatt av skärmbilder ur den körande appen
  // (synappsen-web/verktyg/skarmbilder.spec.mjs). De två assertionerna nedan bevakar båda
  // halvorna: att felstavningen inte kommer tillbaka, och att bilderna faktiskt finns.
  test("den felstavade demoträffen är borta och kommer inte tillbaka", () => {
    // HTML-kommentarerna strippas först, av samma skäl som i färgvakten ovan: kommentaren i
    // hjältesektionen DOKUMENTERAR felet och måste få citera det.
    expect(
      las(HTML).replace(/<!--[\s\S]*?-->/g, "").toLowerCase(),
      `${HTML} innehåller "Urinkadeter". Ordet är urinkateter. Felet uppstod för att ` +
        "gränssnittet ritades av för hand i markup – fotografera det i stället, med " +
        "synappsen-web/verktyg/skarmbilder.spec.mjs."
    ).not.toContain("urinkadeter");
  });

  test.each([
    ["bilder/app-sok.png"],
    ["bilder/app-rutiner.png"],
    ["bilder/app-forrad.png"],
    ["bilder/app-ledningsrapport.png"],
  ])("%s finns och används på sidan", (bild) => {
    expect(
      existsSync(join(ROT, "synappsen-web", bild)),
      `synappsen-web/${bild} saknas. Ta om bilderna med:\n\n` +
        "  PLAYWRIGHT_CHROMIUM_PATH=... npx firebase emulators:exec --project demo-test \\\n" +
        "    --only auth,firestore,storage \\\n" +
        '    "npx playwright test -c synappsen-web/verktyg/skarmbilder.config.mjs"'
    ).toBe(true);
    expect(las(HTML), `${HTML} refererar inte ${bild}.`).toContain(`/${bild}`);
  });

  test("varje skärmbild har en alt-text som beskriver vad som syns", () => {
    // En skärmbild av ett gränssnitt är informationsbärande, inte dekor: utan alt-text är
    // hela bevisföringen otillgänglig för den som använder skärmläsare. Kravet är WCAG 1.1.1,
    // och sidan får inte underkännas på just den punkt den använder som säljargument.
    const bilder = [...las(HTML).matchAll(/<img\s[^>]*>/g)].map((m) => m[0]);
    expect(bilder.length, `${HTML} innehåller inga <img>-taggar.`).toBeGreaterThan(0);
    for (const tagg of bilder) {
      const alt = tagg.match(/alt="([^"]*)"/);
      expect(alt, `En <img> i ${HTML} saknar alt-attribut helt:\n  ${tagg}`).not.toBeNull();
      expect(
        alt[1].length,
        `Alt-texten "${alt[1]}" är för kort för att beskriva en skärmbild. Skriv ut vad som ` +
          "faktiskt syns – en läsare som inte ser bilden ska få samma bevis som en som gör det."
      ).toBeGreaterThan(60);
    }
  });
});

describe("Webbplatsens sidor följer sajtens CSP och hänger ihop", () => {
  const SIDFILER = readdirSync(join(ROT, "synappsen-web")).filter((f) => f.endsWith(".html"));

  test("inga style-attribut: CSP:n är style-src 'self' och blockerar dem tyst", () => {
    // Verkligt fel, rättat 2026-10-21: 25 style="…" på startsidan blockerades av
    // policyn i firebase.json. Avstånden mellan stycken, etiketter och bilder fanns i
    // markupen men aldrig på skärmen, och ingen märkte det för att ingenting kraschar.
    // Avstånd och liknande görs med klasserna i stil.css (.mt-34, .mb-32 …).
    const csp = las("firebase.json");
    expect(csp, "firebase.json saknar style-src 'self'").toContain("style-src 'self'");
    for (const fil of SIDFILER) {
      const traffar = [...las(`synappsen-web/${fil}`).matchAll(/<(?!svg)[a-z0-9]+\s[^<>]*\sstyle="[^"]*"/g)];
      expect(
        traffar.map((m) => m[0].slice(0, 80)),
        `${fil} har style-attribut som policyn blockerar. Använd en klass i stil.css.`
      ).toEqual([]);
    }
    // Generatorns mall skriver tre av sidorna, så felet måste också vara borta där.
    expect(las("synappsen-web/verktyg/bygg-underlag.mjs")).not.toMatch(/\sstyle="/);
  });

  test("varje intern länk pekar på en sida som finns, och varje ankare på ett id", () => {
    for (const fil of SIDFILER) {
      const html = las(`synappsen-web/${fil}`);
      const ider = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
      for (const [, mal] of html.matchAll(/\shref="([^"]+)"/g)) {
        if (/^(https?:|mailto:)/.test(mal)) continue;
        if (mal.startsWith("#")) {
          expect(ider.has(mal.slice(1)), `${fil}: ankaret ${mal} saknar id`).toBe(true);
          continue;
        }
        const [vag, ankare] = mal.split("#");
        if (vag.startsWith("/icons/") || vag.startsWith("/fonts/") || vag === "/stil.css") continue;
        const filnamn = vag === "/" ? "index.html" : `${vag.replace(/^\//, "")}.html`;
        expect(
          existsSync(join(ROT, "synappsen-web", filnamn)),
          `${fil} länkar till ${mal}, men synappsen-web/${filnamn} finns inte.`
        ).toBe(true);
        if (ankare) {
          expect(
            las(`synappsen-web/${filnamn}`).includes(`id="${ankare}"`),
            `${fil} länkar till ${mal}, men ${filnamn} har inget id="${ankare}".`
          ).toBe(true);
        }
      }
    }
  });

  test("sitemap.xml listar varje sida", () => {
    const karta = las("synappsen-web/sitemap.xml");
    // 404.html visas vid okänd adress och ska aldrig indexeras eller listas.
    for (const fil of SIDFILER.filter((f) => f !== "404.html")) {
      const adress = fil === "index.html" ? "https://synappsen.se/" : `https://synappsen.se/${fil.replace(/\.html$/, "")}`;
      expect(karta, `sitemap.xml saknar ${adress}`).toContain(`<loc>${adress}</loc>`);
    }
  });
});

describe("Startsidan är ett vägval mellan vården och företagen (beslut 2026-10-23)", () => {
  const start = () => las(START);

  test("startsidan leder till båda spåren", () => {
    expect(start(), "startsidan länkar inte till vårdsidan").toContain('href="/vard"');
    expect(start(), "startsidan länkar inte till företagssidan").toContain('href="/foretag"');
  });

  test("startsidan säljer inget av spåren: inga priser och ingen delningsbild från ett av dem", () => {
    // Vägvalet ska vara neutralt. En regional IT-avdelning som går in på synappsen.se ska inte
    // mötas av salongspriser, och en salong inte av vårdens prislista (BESLUTSLOGG.md 2026-10-21).
    const text = start().replace(/<!--[\s\S]*?-->/g, "");
    expect(text, "startsidan anger ett pris").not.toMatch(/\d\s?kr\b/);
    expect(text, "startsidan har en delningsbild från ett av spåren").not.toMatch(/og:image/);
  });

  test("gamla ankarlänkar till vårdsidan skickas vidare till /vard", () => {
    // Säljutskick före 2026-10-23 länkade till synappsen.se/#paket, /#pilot osv.
    expect(start()).toContain('<script src="/start.js"></script>');
    const skript = las("synappsen-web/start.js");
    expect(skript).toMatch(/window\.location\.replace\("\/vard" \+ ankare\)/);
    expect(skript, "hopplänken till huvudinnehållet får inte skickas vidare").toContain('"#huvudinnehall"');
  });

  test("vårdsidan har sin egen kanoniska adress", () => {
    expect(las(HTML)).toContain('<link rel="canonical" href="https://synappsen.se/vard" />');
    expect(start()).toContain('<link rel="canonical" href="https://synappsen.se/" />');
  });
});

describe("Företagssidan (foretag.html)", () => {
  const sida = () => las(FORETAG);

  test("startsidan länkar till företagssidan, men ingen sida har en områdesväxlare", () => {
    // Beslut 2026-10-22 (BESLUTSLOGG.md): växlaren mellan vård och företag är borttagen från
    // båda sidorna. Länken till företagsspåret ligger i vårdsidans sidfot, och företagssidan
    // länkar inte tillbaka (ägaren vill inte ha en referens till vårdappen längst ned).
    expect(las(HTML), "startsidan länkar inte till foretag.html").toContain('href="/foretag"');
    for (const fil of [HTML, FORETAG, "synappsen-web/levande-innehall.html", "synappsen-web/fallstudie.html"]) {
      expect(las(fil), `${fil} har fått tillbaka områdesväxlaren`).not.toMatch(/class="omraden"/);
    }
  });

  test("vårdsidans långa delar ligger på egna sidor som startsidan länkar till", () => {
    const html = las(HTML);
    for (const [sida2, text] of [
      ["levande-innehall", "Levande innehåll"],
      ["fallstudie", "Klinikstöd"],
    ]) {
      expect(html, `startsidan länkar inte till /${sida2}`).toContain(`href="/${sida2}"`);
      expect(existsSync(join(ROT, `synappsen-web/${sida2}.html`))).toBe(true);
      expect(las(`synappsen-web/${sida2}.html`)).toContain(text);
    }
    expect(html, "fallstudien ska inte ligga kvar i sin helhet på startsidan").not.toMatch(
      /fall__led/
    );
  });

  test("pilotens villkor: betald pilotperiod, uppstarten gäller, ingen bindning efter piloten", () => {
    const text = las(HTML).replace(/<[^>]+>/g, "").replace(/[\s\u00a0]+/g, " ");
    expect(text).toMatch(/Piloten är betald/);
    expect(text).toMatch(/de veckor piloten pågår/);
    expect(text).toMatch(/Efter piloten är ni inte bundna/);
    expect(text, "piloten får inte beskrivas som gratis").not.toMatch(/kostnadsfri pilot|gratis pilot/i);
  });

  test("räkneexemplets summor stämmer med sina rader", () => {
    // Tabellen är en uppskattning, men aritmetiken i den ska vara sann. Tre rader ger en
    // total, och årssumman är tolv månader. Ändras en siffra utan de andra failar testet.
    const rader = [...sida().matchAll(/<tr><td>([^<]+)<\/td><td>[^<]+<\/td><td>([\d\s]+)\skr<\/td><td>([\d\s]+)\skr<\/td><\/tr>/g)]
      .map((m) => [m[1], Number(m[2].replace(/\s/g, "")), Number(m[3].replace(/\s/g, ""))]);
    expect(rader.length, "hittade inte räkneexemplets kronrader").toBe(3);
    const [raddad, nya, totalt] = rader;
    expect(raddad[1] + nya[1], "månadssumman").toBe(totalt[1]);
    expect(raddad[2] + nya[2], "årssumman").toBe(totalt[2]);
    for (const [namn, manad, ar] of rader) {
      expect(manad * 12, `${namn}: år ska vara tolv månader`).toBe(ar);
    }
    expect(2 * 960, "två tider à 960 kr").toBe(raddad[1]);
  });

  test("redovisar öppet att tjänsten är ny och saknar referenskunder", () => {
    // Samma princip som startsidans redovisning av att ingen enhet är i skarp drift
    // (VARUMARKE.md §4 och §13): ett räkneexempel utan den raden är en nyttosiffra utan täckning.
    expect(sida()).toMatch(/inga referenskunder/i);
    expect(sida()).toMatch(/inga mätta kundresultat/i);
  });

  test("prisavsnittet säger att priserna är exklusive moms", () => {
    // Ägaren avgjorde 2026-10-21 att priserna är exkl. moms. Sidan visar belopp utan det
    // förbehållet skulle läsas som slutpriser.
    const priser = sida().slice(sida().indexOf('id="priser"'), sida().indexOf('id="arbetssatt"'));
    expect(priser).toMatch(/exklusive moms/);
  });

  test("garantin gäller bygget och säger vad den inte täcker", () => {
    // Ägaren avgjorde 2026-10-21 att garantin gäller bygget (startavgiften). Rubriken
    // "nollrisk" togs bort eftersom månadsavgiften ligger utanför: en garanti som lämnar en
    // avgift utanför är inte risk noll, och orden är det en kund kan hålla leverantören till.
    const garanti = sida().slice(sida().indexOf('class="trygghet"'), sida().indexOf("</section>", sida().indexOf('class="trygghet"')));
    expect(garanti).toMatch(/garanti på bygget/);
    expect(garanti).toMatch(/inte månadsavgiften/);
    // Rättningsrätten (ägaren 2026-10-21): leverantören får först chansen att åtgärda
    // synpunkterna. Utan den raden vore garantin en ren återbetalningsrätt.
    expect(garanti).toMatch(/14 dagar på mig att rätta eller ändra/);
    expect(sida(), "foretag.html lovar fortfarande 'nollrisk'").not.toMatch(/nollrisk/i);
  });

  test("räkneexemplet är märkt som uppskattning", () => {
    expect(sida()).toContain("[uppskattning]");
  });
});

describe("Inga synliga platshållare på säljsidorna", () => {
  test.each([HTML, FORETAG, "synappsen-web/levande-innehall.html", "synappsen-web/fallstudie.html"])("%s innehåller ingen ifyllnadsruta i hakparentes", (sida) => {
    // Integritetspolicyn har medvetet kvar sin platshållare för namn/orgnr (OPPNA-PUNKTER.md),
    // men de två säljsidorna ska aldrig visa ett halvfärdigt "[ Fyll i … ]" eller
    // "[ Bakgrundsstycket … ]" för en besökare.
    expect(las(sida)).not.toMatch(/\[\s*(Bakgrundsstycket|Fyll i)/i);
  });

  test("adresserna är rena (cleanUrls) och ingen intern länk eller kanonisk adress slutar på .html", () => {
    const hosting = JSON.parse(las("firebase.json")).hosting;
    const web = hosting.find((h) => h.target === "web");
    expect(web.cleanUrls, "web-targeten saknar cleanUrls").toBe(true);
    const sidfiler = readdirSync(join(ROT, "synappsen-web")).filter((f) => f.endsWith(".html"));
    for (const fil of sidfiler) {
      const html = las(`synappsen-web/${fil}`);
      const traffar = [...html.matchAll(/(?:href|content)="((?:https:\/\/synappsen\.se)?\/[^"]*\.html[^"]*)"/g)].map((m) => m[1]);
      expect(traffar, `${fil} har adresser med .html`).toEqual([]);
    }
    expect(las("synappsen-web/sitemap.xml")).not.toMatch(/\.html</);
  });
});

describe("Beslut 2026-10-22 som syns på webbplatsen", () => {
  test("404-sidan är noindex och står inte i sitemap.xml", () => {
    expect(las("synappsen-web/404.html")).toMatch(/name="robots" content="noindex/);
    expect(las("synappsen-web/sitemap.xml")).not.toMatch(/\/404</);
  });

  test("företagssidan anger Tillväxts pris efter år 1 och att SMS-taket står i offerten", () => {
    const html = las(FORETAG);
    expect(html).toMatch(/därefter 1\s490\skr\/mån/);
    expect(html).toMatch(/SMS ingår i ett skäligt antal/);
  });

  test("startsidan säger att piloten är betald och att uppstarten gäller även den", () => {
    const html = las(HTML);
    expect(html).toMatch(/Piloten är betald/);
    expect(html).toMatch(/Uppstartsavgiften på 25\s000\skr gäller även för piloten/);
  });
});

describe("Genomgången 2026-10-22: tillgänglighet, bilder och prisinformation", () => {
  test("skärmbilderna serveras som WebP med PNG som reserv, och bara hjältebilden laddas direkt", () => {
    const html = las(HTML);
    for (const bild of ["sok", "rutiner", "forrad", "ledningsrapport"]) {
      expect(html, `app-${bild}.webp saknas i en <picture>`).toMatch(
        new RegExp(`<source[^>]+type="image/webp"[^>]+app-${bild}\\.webp`)
      );
      expect(existsSync(join(ROT, `synappsen-web/bilder/app-${bild}.webp`))).toBe(true);
    }
    expect(html).toMatch(/<img[^>]+app-sok\.png[^>]+fetchpriority="high"/);
    expect(html, "hjältebilden får inte vara lazy").not.toMatch(/<img[^>]+app-sok\.png[^>]+loading="lazy"/);
    for (const bild of ["rutiner", "forrad", "ledningsrapport"]) {
      expect(html).toMatch(new RegExp(`<img[^>]+app-${bild}\\.png[^>]+loading="lazy"`));
    }
  });

  test("uppstartsavgiften står synligt utanför de fällbara tilläggen och rabatteras inte", () => {
    const html = las(HTML);
    const synlig = html
      .replace(/<details[\s\S]*?<\/details>/g, "")
      .replace(/<[^>]+>/g, "")
      .replace(/[\s\u00a0]+/g, " ");
    expect(synlig, "uppstartsavgiften ligger bara bakom en fällbar del").toMatch(
      /Uppstartsavgift 25 000 kr[^.]*\. Den rabatteras inte/
    );
    // 39 000 + 25 000 = 64 000: exemplet ska räknas rätt om priserna ändras
    expect(synlig).toMatch(/39 000 kr \+ 25 000 kr = 64 000 kr/);
  });

  test("företagssidan har en enda huvudhandling: be om en kostnadsfri skiss", () => {
    const html = las(FORETAG);
    expect(html, "hjältens knapp").toMatch(/Be om en kostnadsfri skiss/);
    expect(html, "den gamla huvudknappen finns kvar").not.toMatch(/Boka gratis genomgång/);
  });

  test("mobilhuvudet ligger i ett header-landmärke och tabellomslagen går att nå med tangentbord", () => {
    for (const fil of [HTML, FORETAG]) {
      expect(las(fil), `${fil} saknar <header class="topp">`).toMatch(/<header class="topp"/);
    }
    for (const fil of [HTML, "synappsen-web/underlag.html", "synappsen-web/integritet.html"]) {
      const omslag = [...las(fil).matchAll(/<div class="tabell-svep"[^>]*>/g)].map((m) => m[0]);
      for (const tagg of omslag) {
        expect(tagg, `${fil}: ${tagg}`).toMatch(/tabindex="0"/);
        expect(tagg, `${fil}: ${tagg}`).toMatch(/role="region"/);
        expect(tagg, `${fil}: ${tagg}`).toMatch(/aria-label="/);
      }
    }
  });

  test("ingen text under 12 px i stilmallen (WCAG-genomgången 2026-10-22)", () => {
    const css = las("synappsen-web/stil.css");
    const smaa = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
      .map((m) => Number(m[1]))
      .filter((px) => px < 12);
    expect(smaa, `stil.css har font-size under 12 px: ${smaa.join(", ")}`).toEqual([]);
  });
});
