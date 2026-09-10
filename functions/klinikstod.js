// klinikstod.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: kliniskt uppslagsstöd och källbevakning: godkända källdomäner, robots-
// hänsynsam hämtning av bevakade sidor, den domänbegränsade sökmotorn, Gemini-svaret
// samt beroendetestet/verifieringen av att sökningen håller sig till godkända källor.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const crypto = require("node:crypto");
const {
  admin,
  db,
  bucket,
  onCall,
  HttpsError,
  skapaVertexKlient,
  SOKMOTOR_API_KEY,
  MAX_KLINIKSTOD_FRAGOR_PER_TIMME,
  hamtaAnvandarInfo,
  kravModul,
  innehallerPersonnummer,
  harPromptbrytandeTecken,
  kontrolleraOchOkaHastighet,
  okaSokkvot,
  reserveraBudget,
} = require("./gemensamt");
const { FieldValue } = require("firebase-admin/firestore");

// Godkända källor för klinikstöd-frågor – samma domäner som är konfigurerade i den
// programmerbara sökmotorn (se SOKMOTOR_CX nedan). Fungerar som ett extra skyddslager om
// sökmotorns egen domänbegränsning någonsin skulle ändras av misstag.
const GODKANDA_KALLDOMANER = [
  "internetmedicin.se",
  "1177.se",
  "nationelltklinisktkunskapsstod.se",
  "fass.se",
  "lakemedelsverket.se",
  "vardhandboken.se",
  "folkhalsomyndigheten.se",
];

// Sökmotorns Search Engine ID (cx) – inte hemlig (syns redan publikt i inbäddningskoden för
// sökwidgeten), så den behöver inte hanteras som ett Firebase-secret som API-nyckeln nedan.
const SOKMOTOR_CX = "b78ded0f2f19e4ab6";

function domanGodkand(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return GODKANDA_KALLDOMANER.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

// Etapp 21b: källbevakning – ett schemalagt jobb som hämtar varje externt refererad källa
// (rutiner.externaKallor, se Etapp 21a) en gång i veckan och jämför en hash av innehållet mot
// senast sparade. Cachas per URL över ALLA organisationer (kallbevakning/{urlHash}) – samma
// källa refererad av flera kunder hämtas bara en gång, inte en gång per kund.
const KALLBEVAKNING_USER_AGENT = "SynappsenKallbevakning/1.0 (+kontakt via leverantören)";
// Snällt mot källorna: en liten paus mellan varje hämtning istället för att skjuta iväg alla
// samtidigt. Källistan är i praktiken liten (ett fåtal unika URL:er över alla kunder), så det
// här är inget verkligt kostnadstak – bara ett artigt tempo.
const KALLBEVAKNING_PAUS_MS = 500;

function extraheraText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashaInnehall(html) {
  return crypto.createHash("sha256").update(extraheraText(html)).digest("hex");
}

function hashaUrl(url) {
  return crypto.createHash("sha256").update(url).digest("hex");
}

// Enkel (inte fullständigt RFC 9309-kompatibel) tolkning av robots.txt: hittar blocket för
// "User-agent: *" och samlar dess Disallow-mönster. Källistan är ett litet, känt urval
// medicinska referenssajter – målet är att respektera ett uttryckligt förbud, inte att bygga
// en generell webbcrawler.
async function hamtaDisallowMonster(host) {
  try {
    const svar = await fetch(`https://${host}/robots.txt`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": KALLBEVAKNING_USER_AGENT },
    });
    if (!svar.ok) return [];
    const text = await svar.text();
    const monster = [];
    let iRelevantBlock = false;
    for (const radRaw of text.split("\n")) {
      const rad = radRaw.trim();
      const kolonIndex = rad.indexOf(":");
      if (kolonIndex === -1) continue;
      const nyckel = rad.slice(0, kolonIndex).trim().toLowerCase();
      const varde = rad.slice(kolonIndex + 1).trim();
      if (nyckel === "user-agent") {
        iRelevantBlock = varde === "*";
      } else if (iRelevantBlock && nyckel === "disallow" && varde) {
        monster.push(varde);
      }
    }
    return monster;
  } catch {
    // Inget robots.txt, eller ett fel vid hämtning – tolkas som inget uttryckligt förbud
    // (samma "fail open" som när sidan i övrigt inte svarar).
    return [];
  }
}

function tillatenAvRobots(pathname, disallowMonster) {
  return !disallowMonster.some((monster) => pathname.startsWith(monster));
}

// Kärnlogiken, exporterad separat (samma mönster som kontrolleraProvperioder) så
// tests/functions kan anropa den direkt utan en riktig schemaläggare.
async function kontrolleraKallbevakning() {
  const orgSnap = await db.collection("organisationer").get();
  const bevakadeOrgar = new Set(
    orgSnap.docs.filter((d) => d.data()?.moduler?.kallbevakning === true).map((d) => d.id)
  );
  if (bevakadeOrgar.size === 0) return;

  const rutinSnap = await db.collection("rutiner").where("status", "==", "godkand").get();

  const urlTillRutiner = new Map();
  for (const rutinDoc of rutinSnap.docs) {
    const data = rutinDoc.data();
    if (!bevakadeOrgar.has(data.organisationId)) continue;
    for (const url of data.externaKallor ?? []) {
      // Extra skyddslager: samma domänkontroll som firestore.rules – en URL som av någon
      // anledning skulle ha smugit sig igenom (t.ex. skriven direkt av Admin SDK) hämtas
      // ändå aldrig.
      if (!domanGodkand(url)) continue;
      if (!urlTillRutiner.has(url)) urlTillRutiner.set(url, []);
      urlTillRutiner.get(url).push({ id: rutinDoc.id, organisationId: data.organisationId });
    }
  }

  const robotsCache = new Map();
  for (const [url, rutiner] of urlTillRutiner) {
    try {
      const uppslagenUrl = new URL(url);
      if (!robotsCache.has(uppslagenUrl.host)) {
        robotsCache.set(uppslagenUrl.host, await hamtaDisallowMonster(uppslagenUrl.host));
      }
      if (!tillatenAvRobots(uppslagenUrl.pathname, robotsCache.get(uppslagenUrl.host))) {
        console.log(`Källbevakning: hoppar över ${url} (nekad av robots.txt)`);
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, KALLBEVAKNING_PAUS_MS));

      const cacheRef = db.collection("kallbevakning").doc(hashaUrl(url));
      const cacheSnap = await cacheRef.get();

      const svar = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": KALLBEVAKNING_USER_AGENT },
      });

      if (!svar.ok) {
        // Etapp 21d: en trasig länk (404 m.fl.) är i sig ett kvalitetsfynd, och rapporteras
        // som en egen typ – inte samma sak som en faktisk innehållsändring.
        if (svar.status === 404) {
          await Promise.all(
            rutiner.map((r) =>
              db.collection("rutiner").doc(r.id).update({
                kallVarning: true,
                kallVarningTyp: "trasig_lank",
                kallVarningUrl: url,
                kallVarningTidpunkt: FieldValue.serverTimestamp(),
              })
            )
          );
        } else {
          console.error(`Källbevakning: ${url} svarade ${svar.status}`);
        }
        continue;
      }

      const html = await svar.text();
      const nyHash = hashaInnehall(html);
      const tidigareHash = cacheSnap.exists ? cacheSnap.data().senasteHash : null;

      await cacheRef.set(
        { url, senasteHash: nyHash, senastKontrollerad: FieldValue.serverTimestamp() },
        { merge: true }
      );

      // Bara en verklig ändring (INTE den allra första kontrollen av en ny URL) flaggas –
      // annars skulle varje nyligen tillagd källa omedelbart visas som "ändrad".
      if (tidigareHash && tidigareHash !== nyHash) {
        await Promise.all(
          rutiner.map((r) =>
            db.collection("rutiner").doc(r.id).update({
              kallVarning: true,
              kallVarningTyp: "andring",
              kallVarningUrl: url,
              kallVarningTidpunkt: FieldValue.serverTimestamp(),
            })
          )
        );
      }
    } catch (fel) {
      console.error(`Källbevakning misslyckades för ${url}:`, fel);
    }
  }
}
exports.kontrolleraKallbevakning = kontrolleraKallbevakning;

exports.kallbevakningSchemalagt = onSchedule(
  { schedule: "every monday 04:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  kontrolleraKallbevakning
);

// Söker via Google Programmable Search Engine (Custom Search JSON API), konfigurerad att
// bara söka inom de godkända domänerna (se GODKANDA_KALLDOMANER) – till skillnad från den
// tidigare varianten som bad Gemini "lova" att bara söka med site:-operatorn (vilket den i
// praktiken inte alltid respekterade), är denna begränsning inbyggd i själva sökmotorn.
async function sokViaProgrammerbarSokmotor(fraga) {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", SOKMOTOR_API_KEY.value());
  url.searchParams.set("cx", SOKMOTOR_CX);
  url.searchParams.set("q", fraga);
  url.searchParams.set("num", "5");

  const httpSvar = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!httpSvar.ok) {
    const felText = await httpSvar.text();
    const fel = new Error(`Sökmotorn svarade ${httpSvar.status}: ${felText.slice(0, 500)}`);
    fel.status = httpSvar.status;
    throw fel;
  }
  const json = await httpSvar.json();
  return (json.items ?? []).map((i) => ({ titel: i.title, url: i.link, utdrag: i.snippet ?? "" }));
}

// Bygger den systeminstruktion som skickas till modellen. UTBRUTEN ur anropshanteraren
// 2026-09-06 av ett enda skäl: reglerna nedan – särskilt regel 4 – är den avgränsning som
// håller funktionen utanför MDR (se granskningar/AVSETT-ANDAMAL-KLINIKSTOD-2026-08-30.md),
// och de upprätthålls ENBART av att modellen faktiskt lyder dem. För att kunna mäta det krävs
// att utvärderingen använder EXAKT samma prompt som produktionen, inte en kopia som kan glida
// isär – därför är den här funktionen sanningskällan, och både fragaKlinisktStod nedan och
// functions/scripts/ai-evaluering.cjs anropar den. Se även
// tests/functions/klinikstodprompt.test.cjs, som failar om en regel tyst försvinner.
//
// RÄTTAT (Etapp 72, undantag 1 – ETAPPLAN19.md/granskningar/GRANSKNING-IDEBANK-2026-08-30.md
// avsnitt 3.1): regel 4 sa tidigare uttryckligen "Detta är beslutsstöd". MDCG 2019-11 Rev.1
// undantar INTE en NLP-sökning som bidrar till ett medicinskt syfte från MDR – ordet
// "beslutsstöd" i systemets EGEN instruktion var alltså en självmotsägelse mot den
// avgränsning som håller funktionen utanför MDR: "hjälper att HITTA och SAMMANFATTA, ger
// aldrig ett kliniskt beslut". Risken var konkret, inte teoretisk – ett ord i prompten kunde
// ekas tillbaka i Gemini-svaret till användaren.
function byggKlinikstodPrompt(fraga, traffar) {
  // Andra lagret mot promptinjektion. fragaKlinisktStod avvisar redan sådana frågor med ett
  // begripligt felmeddelande till användaren – det här kastar för att det ska vara STRUKTURELLT
  // omöjligt att bygga en prompt av en fråga som kan bryta sig ur sin kontext, oavsett vilken
  // anropare som råkar glömma kontrollen. Kastar hellre än sanerar tyst: en tyst ändrad fråga i
  // ett kliniskt verktyg är värre än ett fel.
  if (harPromptbrytandeTecken(fraga)) {
    throw new Error(
      "Frågan innehåller citattecken eller radbrytning och kan inte bäddas in i prompten " +
        "(möjlig promptinjektion). Anroparen ska avvisa frågan innan den kommer hit."
    );
  }

  const kalldomanerText = GODKANDA_KALLDOMANER.join(", ");
  const traffTextBlock = traffar
    .map((t, i) => `[${i + 1}] ${t.titel} (${t.url})\n${t.utdrag}`)
    .join("\n\n");

  return `Du är ett kliniskt uppslagsverktyg för vårdpersonal på en akutmottagning i Sverige.

Fråga: "${fraga}"

Här är sökträffar från godkända medicinska källor (${kalldomanerText}):

${traffTextBlock}

Regler du MÅSTE följa:
1. Svara ENDAST utifrån informationen i sökträffarna ovan – gissa aldrig och använd aldrig
   information från minnet eller andra källor.
2. Om träffarna inte innehåller ett tillförlitligt svar: säg det tydligt istället för att gissa.
3. Ange efter varje påstående vilken träff ([1], [2], osv.) det kommer ifrån. En hänvisning
   får ENDAST peka på ett nummer bland sökträffarna ovan – ANVÄND ALDRIG en hänvisning som
   pekar på en regel i den här listan (t.ex. "[Regel 4]"), och nämn aldrig att du följer
   numrerade regler. En sådan hänvisning går inte att slå upp för läsaren och avslöjar dessutom
   den här promptens interna struktur.
4. Detta är ett hjälpmedel för att HITTA och SAMMANFATTA information ur källorna – aldrig ett
   beslutsstöd, en rekommendation eller en diagnos. Ge aldrig ett prioriterat eller rangordnat
   svar. Uppmana alltid till egen klinisk bedömning.
5. Svara på svenska, kortfattat och praktiskt.
6. Ställ aldrig frågor om eller referera till en specifik patient – om frågan verkar handla om
   en namngiven eller identifierbar person, svara att du bara kan besvara generella frågor.`;
}

exports.byggKlinikstodPrompt = byggKlinikstodPrompt;

// Kliniskt uppslagsstöd: hämtar först faktiska sökträffar från en domänbegränsad
// Programmable Search Engine (se ovan), och ber sedan Gemini svara ENBART utifrån dessa
// träffars innehåll – inte fri websökning. Domänkontrollen (domanGodkand) körs ändå som ett
// extra skyddslager ifall sökmotorns egen konfiguration någonsin skulle ändras av misstag.
exports.fragaKlinisktStod = onCall(
  {
    secrets: [SOKMOTOR_API_KEY],
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }

    const fraga = (request.data?.fraga ?? "").trim();
    if (!fraga || fraga.length > 500) {
      throw new HttpsError("invalid-argument", "Ange en fråga (max 500 tecken).");
    }
    // Promptinjektionsskydd (2026-09-06): citattecken avslutar den kontext frågan bäddas in i
    // (Fråga: "${fraga}") och en radbrytning gör det möjligt att skriva ett eget regelblock
    // under – ett försök att skriva över de sex reglerna, varav regel 4 är MDR-avgränsningen.
    // Inget av tecknen har ett legitimt syfte i en klinisk söksträng. Se harPromptbrytandeTecken
    // i gemensamt.js för varför detta avvisas i stället för att saneras tyst.
    if (harPromptbrytandeTecken(fraga)) {
      throw new HttpsError(
        "invalid-argument",
        "Frågan får inte innehålla citattecken eller radbrytningar. Skriv frågan som en enda " +
          "mening utan citattecken."
      );
    }
    // Skickar aldrig en fråga som verkar innehålla ett personnummer vidare till Gemini
    // (tredjepartstjänst) – patientuppgifter får inte lämna appen överhuvudtaget.
    if (innehallerPersonnummer(fraga)) {
      throw new HttpsError(
        "invalid-argument",
        "Frågan verkar innehålla ett personnummer. Ställ bara generella frågor, inte frågor om " +
          "specifika patienter."
      );
    }

    const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
    await kravModul(organisationId, "intelligence", "Klinikstöd kräver Intelligence-modulen.");
    // Se kommentaren vid MAX_KLINIKSTOD_FRAGOR_PER_TIMME: skyddar den delade sökkvoten, inte
    // bara kronbudgeten. Ligger EFTER modulkontrollen (ingen anledning att räkna mot en
    // organisation som ändå skulle nekas) men FÖRE cache/sökmotor.
    await kontrolleraOchOkaHastighet(request.auth.uid, "klinikstod", MAX_KLINIKSTOD_FRAGOR_PER_TIMME);

    // Frågelogg (utan uid – vi vill se VAD som efterfrågas, inte VEM som frågar) så att
    // ledningen ser vilka kunskapsluckor som finns; vanliga frågor kan bli permanenta rutiner.
    // organisationId sätts ändå, så en organisations frågestatistik inte blandas med en annans.
    const fragaNyckel = fraga.toLowerCase().replace(/\s+/g, " ");
    db.collection("klinikfrageloggar")
      .add({ fraga: fragaNyckel, organisationId, tidpunkt: FieldValue.serverTimestamp() })
      .catch(() => {});

    // Cache: samma fråga ställs ofta av flera personer. Ett cachat svar (7 dagar) sparar
    // både Custom Search-kvoten (100 gratis/dag) och Gemini-kostnad, och svarar direkt.
    // Nyckeln inkluderar organisationId – annars skulle en organisations cachade svar kunna
    // serveras till en annan (samma fråga, olika kunder ska inte dela cache).
    const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const cacheRef = db
      .collection("klinikfragecache")
      .doc(Buffer.from(`${organisationId}::${fragaNyckel}`).toString("base64url").slice(0, 480));
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const c = cacheSnap.data();
      if (c.skapad?.toMillis && Date.now() - c.skapad.toMillis() < CACHE_TTL_MS) {
        return { svar: c.svar, kallor: c.kallor, franCache: true };
      }
    }

    // Samma budgetspärr som bild-/dokumenttolkningen, så att den här funktionen inte kan
    // anropas direkt (förbi den pausade UI-vyn) utan tak på kostnad eller antal anrop.
    // Ligger EFTER cache-kontrollen – cachade svar kostar inget och ska inte äta budget.
    await reserveraBudget(organisationId, request.auth.uid);

    const kalldomanerText = GODKANDA_KALLDOMANER.join(", ");

    // Etapp 48b: räknas här, direkt före det faktiska externa anropet – en cacheträff ovan
    // returnerar redan innan den här punkten och kostar ingen kvot. Räknas oavsett om anropet
    // nedan sedan lyckas eller inte, eftersom kvoten hos Google konsumeras av själva anropet.
    await okaSokkvot(organisationId);

    let traffar;
    try {
      traffar = await sokViaProgrammerbarSokmotor(fraga);
    } catch (fel) {
      console.error("Sökmotor-anrop misslyckades:", fel);
      throw new HttpsError("internal", `Sökningen misslyckades: ${fel.message}`);
    }

    // Extra skyddslager: sökmotorn ska redan vara konfigurerad att bara söka inom
    // GODKANDA_KALLDOMANER, men om den konfigurationen någonsin ändras av misstag ska en
    // träff utanför listan aldrig nå Gemini eller användaren.
    const godkandaTraffar = traffar.filter((t) => domanGodkand(t.url));
    if (godkandaTraffar.length === 0) {
      throw new HttpsError(
        "not-found",
        `Hittade inget svar bland de godkända källorna (${kalldomanerText}). Sök manuellt istället.`
      );
    }

    const prompt = byggKlinikstodPrompt(fraga, godkandaTraffar);

    // @google/genai kastar ett ApiError med samma numeriska .status-fält som det tidigare
    // rå fetch()-anropet gjorde manuellt (verifierat mot SDK:ns källa) – 503-hanteringen
    // nedan är alltså oförändrad i beteende, bara anropsvägen har bytts till Vertex AI.
    async function anropaGemini() {
      const result = await skapaVertexKlient().models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return result.text ?? "";
    }

    let svar;
    try {
      try {
        svar = await anropaGemini();
      } catch (forstaFel) {
        // 503/UNAVAILABLE betyder att Gemini är tillfälligt överbelastat (inte ett fel i vårt
        // anrop) – ett enda snabbt återförsök löser detta i de flesta fall.
        if (forstaFel.status === 503) {
          await new Promise((r) => setTimeout(r, 2000));
          svar = await anropaGemini();
        } else {
          throw forstaFel;
        }
      }
    } catch (fel) {
      console.error("Klinikstöd-sökning misslyckades:", fel);
      if (fel.status === 503) {
        throw new HttpsError(
          "unavailable",
          "Gemini är tillfälligt överbelastat just nu. Vänta en liten stund och försök igen."
        );
      }
      throw new HttpsError("internal", `Sökningen misslyckades: ${fel.message}`);
    }

    const kallor = godkandaTraffar.map((t) => ({ titel: t.titel, url: t.url }));

    await cacheRef
      .set({ svar, kallor, skapad: FieldValue.serverTimestamp() })
      .catch(() => {});

    return { svar, kallor, franCache: false };
  }
);

// Beroende-statustest för adminpanelen: pingar Gemini, den programmerbara sökmotorn och
// Storage var för sig så en trasig nyckel/konfiguration upptäcks av admin direkt istället för
// först när en användare stöter på ett fel. Görs INTE mot budgeten (manuellt, sällan använt,
// minimala anrop) – bara ett kort "OK"-svar från Gemini resp. en enda sökträff.
// Tröskel för "fungerar men långsamt" – ett svar som kommer igenom men tar orimligt lång
// tid är ofta ett tidigt tecken på ett problem (t.ex. Google-tjänsten är överbelastad) innan
// den blir ett hårt fel. Enkel att förstå för en icke-teknisk admin: grönt/gult/rött.
const DEGRADERAD_GRANS_MS = 4000;

function statusFranTid(millisekunder) {
  return millisekunder > DEGRADERAD_GRANS_MS ? "degraderad" : "ok";
}

exports.testaBeroenden = onCall(
  { secrets: [SOKMOTOR_API_KEY], region: "europe-west1", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    // Ingen organisationsskopning här avsiktligt: Gemini-nyckeln, sökmotorn och Storage-
    // bucketen är delad infrastruktur för hela installationen (inte kunddata), så vem som
    // helst med superadmin-roll i sin egen organisation får testa/verifiera den.
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan testa anslutningar.");
    }

    async function testaGemini() {
      const start = Date.now();
      try {
        await skapaVertexKlient().models.generateContent({
          model: "gemini-2.5-flash",
          contents: "Svara med endast ordet OK.",
        });
        return { status: statusFranTid(Date.now() - start), meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    async function testaSokmotor() {
      const start = Date.now();
      try {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", SOKMOTOR_API_KEY.value());
        url.searchParams.set("cx", SOKMOTOR_CX);
        url.searchParams.set("q", "test");
        url.searchParams.set("num", "1");
        const svar = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!svar.ok) {
          return { status: "fel", meddelande: `Svarade med felkod ${svar.status}.` };
        }
        return { status: statusFranTid(Date.now() - start), meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    async function testaStorage() {
      try {
        await bucket.getMetadata();
        return { status: "ok", meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    // Lätt version av verifieraKlinikstod (en enda fråga istället för tre) – ger en snabb
    // indikation här, medan den fullständiga körningen med tre frågor finns i sin egen
    // sektion ("Verifiera klinikstöd-sökningen") för djupare felsökning.
    async function testaKlinikstodKalla() {
      try {
        const traffar = await sokViaProgrammerbarSokmotor(KLINIKSTOD_TESTFRAGOR[0]);
        const otillatna = traffar.filter((t) => !domanGodkand(t.url));
        if (otillatna.length > 0) {
          return {
            status: "fel",
            meddelande: `Hittade källor utanför godkända domäner: ${otillatna.map((t) => t.url).join(", ")}.`,
          };
        }
        if (traffar.length === 0) {
          return { status: "degraderad", meddelande: "Testfrågan gav inga träffar just nu." };
        }
        return { status: "ok", meddelande: null };
      } catch (fel) {
        return { status: "fel", meddelande: fel.message };
      }
    }

    const [gemini, sokmotor, storage, klinikstod] = await Promise.all([
      testaGemini(),
      testaSokmotor(),
      testaStorage(),
      testaKlinikstodKalla(),
    ]);
    // Etapp 3c: sparar resultatet så trender syns över tid i adminpanelen, inte bara senaste
    // körningen. Delad infrastruktur (som systemvarningar) – medvetet INTE organisationsskopat.
    await db.collection("halsokontrollhistorik").add({
      gemini,
      sokmotor,
      storage,
      klinikstod,
      tidpunkt: FieldValue.serverTimestamp(),
    });
    return { gemini, sokmotor, storage, klinikstod };
  }
);

// Fördefinierade testfrågor som täcker olika medicinska ämnesområden, för att verifiera att
// klinikstöd-sökningen faktiskt håller sig till de godkända källorna – inte bara att API:et
// svarar (det gör testaBeroenden redan). Testar ENDAST sökmotorsteget (inte Gemini): det är
// sökmotorns egen domänkonfiguration som är den riskabla enskilda punkten (kan ändras av
// misstag i Google-kontot, utanför appens kod), och just det steget är vad domanGodkand()
// skyddar mot. Kostar ingen Gemini-budget och går förbi cachen (alltid färskt resultat).
const KLINIKSTOD_TESTFRAGOR = [
  "behandling hyperkalemi",
  "dosering amoxicillin barn",
  "akut anafylaxi vuxen",
];

exports.verifieraKlinikstod = onCall(
  { secrets: [SOKMOTOR_API_KEY], region: "europe-west1", timeoutSeconds: 30 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    // Ingen organisationsskopning här avsiktligt: Gemini-nyckeln, sökmotorn och Storage-
    // bucketen är delad infrastruktur för hela installationen (inte kunddata), så vem som
    // helst med superadmin-roll i sin egen organisation får testa/verifiera den.
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan verifiera sökningen.");
    }

    const resultat = await Promise.all(
      KLINIKSTOD_TESTFRAGOR.map(async (fraga) => {
        try {
          const traffar = await sokViaProgrammerbarSokmotor(fraga);
          const otillatnaTraffar = traffar.filter((t) => !domanGodkand(t.url));
          return {
            fraga,
            ok: traffar.length > 0 && otillatnaTraffar.length === 0,
            antalTraffar: traffar.length,
            kallor: traffar.map((t) => t.url),
            otillatnaKallor: otillatnaTraffar.map((t) => t.url),
          };
        } catch (fel) {
          return { fraga, ok: false, fel: fel.message };
        }
      })
    );
    return { resultat };
  }
);

// Kör samma kontroll som verifieraKlinikstod automatiskt varje morgon, så att en drift i
// sökmotorns domänkonfiguration (den enda punkt som kan gå sönder utanför appens egen kod,
// se Fas 13/16) upptäcks utan att någon admin behöver komma ihåg att klicka "Kör testfrågor"
// manuellt. Skriver en varning till systemvarningar (superadmin-only, se firestore.rules) bara
// om något faktiskt är fel – ingen notis skapas vid ett normalt, godkänt resultat.
exports.verifieraKlinikstodSchemalagt = onSchedule(
  { schedule: "every day 06:00", timeZone: "Europe/Stockholm", secrets: [SOKMOTOR_API_KEY], region: "europe-west1" },
  async () => {
    const resultat = await Promise.all(
      KLINIKSTOD_TESTFRAGOR.map(async (fraga) => {
        try {
          const traffar = await sokViaProgrammerbarSokmotor(fraga);
          const otillatna = traffar.filter((t) => !domanGodkand(t.url));
          return { fraga, otillatna: otillatna.map((t) => t.url) };
        } catch (fel) {
          return { fraga, fel: fel.message };
        }
      })
    );

    const problem = resultat.filter((r) => r.fel || r.otillatna?.length > 0);

    // Etapp 3c: sparar ett dagligt resultat (även när allt är OK), så adminpanelens historik
    // visar en obruten trend – inte bara larm vid problem.
    await db.collection("halsokontrollhistorik").add({
      klinikstod: {
        status: problem.length === 0 ? "ok" : "fel",
        meddelande:
          problem.length === 0
            ? null
            : problem.map((r) => r.fel ?? `otillåtna källor: ${r.otillatna.join(", ")}`).join(" | "),
      },
      tidpunkt: FieldValue.serverTimestamp(),
    });

    if (problem.length === 0) return;

    const meddelande = problem
      .map((r) =>
        r.fel
          ? `"${r.fraga}": sökningen misslyckades (${r.fel})`
          : `"${r.fraga}": otillåtna källor – ${r.otillatna.join(", ")}`
      )
      .join(" | ");

    await db.collection("systemvarningar").add({
      typ: "klinikstod_kalla",
      meddelande: `Automatisk verifiering av klinikstöd-sökningen hittade problem: ${meddelande}`,
      tidpunkt: FieldValue.serverTimestamp(),
    });
  }
);
