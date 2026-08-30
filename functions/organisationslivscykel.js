// organisationslivscykel.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: etablering av en ny organisation och demo-/övningsmiljön. Avtals- och
// provperiodsstatus, månadsrapport, paus, export, raderingsbegäran med ångerfrist,
// tidsbegränsad supportåtkomst och den faktiska raderingen låg tidigare i SAMMA fil, men
// flyttades ut till avtalslivscykel.js (samma dag) – originalfilen landade på 1 229 rader,
// klart över planens ~800-radersriktmärke, och de två teman delade ingen kod förutom de
// vanliga gemensamt.js-primitiverna.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const Sentry = require("@sentry/node");
const { VERKSAMHETSMALLAR, FORRADSMALLAR, KONTAKTMALLAR } = require("./verksamhetsmallar");
const {
  admin,
  db,
  onCall,
  HttpsError,
  BREVO_API_KEY,
  STANDARD_TAK_ORE,
  SOKKVOT_DAGSTAK,
  SOKKVOT_ORG_TAK_STANDARD,
  dagensDatumStockholm,
  aktuellManadNyckel,
  loggaRevision,
  kravPlattformsadmin,
  hamtaAnvandarInfo,
} = require("./gemensamt");
const { skapaInbjudanIntern } = require("./inbjudningar");

// Etapp 15a: nyckelstegen i etableringsguidens välkomstchecklista för kundens superadmin.
// Bara en lista av nycklar än så länge – Etapp 15b bygger den interaktiva vyn som läser/
// bockar av dessa, men dokumentet skapas redan här så steget inte glöms bort separat.
const VALKOMSTCHECKLISTA_STEG = [
  "bjud_in_kollegor",
  "satt_roller",
  "importera_rutiner",
  "aktivera_2fa_policy",
  "satt_gemini_budget",
];

// Etapp 6b (utökad i 15a): skapar en ny kundorganisation i en enda skrivning – standard-
// inställningar (budgettak) sätts direkt så en superadmin i den nya organisationen möter en
// färdig, fungerande installation, inte en tom lucka som råkar sakna förväntade fält.
// Etapp 15a lägger till de fält upphandlings-/faktureringsunderlaget (15c/15d) behöver
// (org.nr, kontaktperson, användartak, avtalsstatus) samt bjuder in kundens första
// superadmin i samma anrop – tidigare krävde det ett manuellt steg utanför appen, eftersom
// skapaInbjudan bara kan anropas av en superadmin som redan finns i organisationen.
exports.skapaOrganisation = onCall({ region: "europe-west1", secrets: [BREVO_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const namn = (request.data?.namn ?? "").trim();
  if (!namn) {
    throw new HttpsError("invalid-argument", "Ett organisationsnamn krävs.");
  }
  const moduler = {
    operations: Boolean(request.data?.moduler?.operations),
    intelligence: Boolean(request.data?.moduler?.intelligence),
  };

  const orgnr = (request.data?.orgnr ?? "").trim();
  const kontaktNamn = (request.data?.kontaktperson?.namn ?? "").trim();
  const kontaktEpost = (request.data?.kontaktperson?.epost ?? "").trim().toLowerCase();
  if (kontaktEpost && !kontaktEpost.includes("@")) {
    throw new HttpsError("invalid-argument", "Kontaktpersonens e-postadress är ogiltig.");
  }
  const anvandartakRaw = request.data?.anvandartak;
  const anvandartak =
    anvandartakRaw === undefined || anvandartakRaw === null || anvandartakRaw === ""
      ? null
      : Number(anvandartakRaw);
  if (anvandartak !== null && (!Number.isInteger(anvandartak) || anvandartak < 1)) {
    throw new HttpsError("invalid-argument", "Användartak måste vara ett positivt heltal.");
  }

  const orgRef = db.collection("organisationer").doc();
  await orgRef.set({
    namn,
    status: "aktiv",
    moduler,
    orgnr: orgnr || null,
    kontaktperson: kontaktNamn || kontaktEpost ? { namn: kontaktNamn || null, epost: kontaktEpost || null } : null,
    anvandartak,
    // 15d: statusflagga istället för avtalssignering/betalning i appen (se ETAPPLAN3.md,
    // rekommendationen under 15d) – "offert" tills leverantören manuellt sätter den vidare.
    avtalsstatus: "offert",
    // Etapp 70e: verksamhetstypen SPARADES tidigare aldrig – den användes bara transient för
    // att välja mallar här och kastades sedan. Det gjorde det omöjligt att i efterhand veta
    // vilket startbibliotek en organisation borde ha, och därmed omöjligt att seeda en
    // organisation som skapades utan att typen valdes (default i gränssnittet var "Inget
    // startbibliotek"). Sparas nu så seedaStartbibliotek nedan kan användas i efterhand.
    verksamhetstyp: request.data?.verksamhetstyp ?? null,
    // 15e: sätts av ett separat steg när provperioden faktiskt startar, inte här.
    provperiodSlut: null,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
    skapadAv: request.auth.uid,
  });
  await orgRef.collection("installningar").doc("geminiBudget").set({
    anvantOre: 0,
    aktuellManad: aktuellManadNyckel(),
    taketOre: STANDARD_TAK_ORE,
    anvantPerUid: {},
  });
  await orgRef.collection("installningar").doc("valkomstchecklista").set({
    steg: Object.fromEntries(VALKOMSTCHECKLISTA_STEG.map((nyckel) => [nyckel, false])),
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Etapp 70c: skapaInbjudanIntern returnerar {token, epostSkickat} sedan mejlstatusen
  // började bubbla upp till gränssnittet – tidigare returnerade den bara token-strängen.
  let inbjudanToken = null;
  let inbjudanEpostSkickat = false;
  if (kontaktEpost) {
    const inbjudan = await skapaInbjudanIntern({
      organisationId: orgRef.id,
      epost: kontaktEpost,
      roll: "superadmin",
      skapadAv: request.auth.uid,
    });
    inbjudanToken = inbjudan.token;
    inbjudanEpostSkickat = inbjudan.epostSkickat;
  }

  // Etapp 10d: valfritt startbibliotek av rutinmallar så en ny kund inte möter en helt tom
  // app. Skapas som REDAN GODKÄNDA (synliga direkt) men tydligt märkta "(mall)" i titeln och
  // med en anmärkning i innehållet – se verksamhetsmallar.js för resonemanget kring varför
  // detta är strukturella exempel, inte riktig klinisk vägledning.
  const verksamhetstyp = request.data?.verksamhetstyp;
  const mallar = VERKSAMHETSMALLAR[verksamhetstyp];
  let antalMallrutiner = 0;
  const skapadeRutiner = [];
  if (mallar) {
    const batch = db.batch();
    for (const mall of mallar) {
      const ref = db.collection("rutiner").doc();
      batch.set(ref, {
        titel: mall.titel,
        innehall: mall.innehall,
        omrade: mall.omrade,
        // Utan det här fältet är öva-läget och Veckans repetition tomma dag ett – båda
        // filtrerar på kviss.length > 0. Se MALL_KVISS i verksamhetsmallar.js för varför
        // frågorna handlar om att rutinen är en mall, inte om dess kliniska innehåll.
        kviss: mall.kviss ?? [],
        status: "godkand",
        organisationId: orgRef.id,
        kalla: "verksamhetsmall",
        borttagen: false,
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      skapadeRutiner.push({ id: ref.id, omrade: mall.omrade, titel: mall.titel });
      antalMallrutiner += 1;
    }
    await batch.commit();
  }

  // Etapp 56b: startbibliotek för allt som INTE är en rutin – utan detta möter en ny
  // organisation tomma listor för förråd/kontakter/introduktionsspår/kompetenskrav, se
  // ETAPPLAN11.md §56b. Körs bara när det finns ett verksamhetstyp-värde (samma villkor som
  // rutinmallarna) – utan verksamhetstyp finns inget rimligt underlag att seeda från.
  let antalForradsartiklar = 0;
  let antalKontakter = 0;
  let introduktionssparId = null;
  let kompetenskravId = null;
  if (verksamhetstyp) {
    const ickeRutinBatch = db.batch();
    const forradsmallar = FORRADSMALLAR[verksamhetstyp] ?? [];
    for (const artikel of forradsmallar) {
      ickeRutinBatch.set(db.collection("forradsartiklar").doc(), {
        ...artikel,
        status: "godkand",
        organisationId: orgRef.id,
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      antalForradsartiklar += 1;
    }
    for (const kontakt of KONTAKTMALLAR) {
      ickeRutinBatch.set(db.collection("kontakter").doc(), {
        ...kontakt,
        akutnummer: Boolean(kontakt.akutnummer),
        organisationId: orgRef.id,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      antalKontakter += 1;
    }
    await ickeRutinBatch.commit();

    // Introduktionsspår och kompetenskrav pekar på RIKTIGA rutin-id:n – kan därför bara
    // byggas om det faktiskt seedades några rutiner ovan att peka på (annars finns inget
    // meningsfullt exempel, se genomgående krav 8/premisskontroll i ETAPPLAN11.md §56).
    const klinisktStodRutin = skapadeRutiner.find((r) => r.omrade === "kliniskt-stod");
    const enAnnanRutin = skapadeRutiner.find((r) => r.id !== klinisktStodRutin?.id);
    if (klinisktStodRutin) {
      const sparRef = db.collection("introduktionsspar").doc();
      const etapper = [{ namn: "Dag 1", poster: [{ typ: "rutin", id: klinisktStodRutin.id, rekommenderadDag: 1 }] }];
      if (enAnnanRutin) {
        etapper.push({ namn: "Vecka 1", poster: [{ typ: "rutin", id: enAnnanRutin.id, rekommenderadDag: 5 }] });
      }
      await sparRef.set({
        namn: "Introduktion för ny personal (mall, anpassa)",
        malRoll: "personal",
        etapper,
        organisationId: orgRef.id,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      introduktionssparId = sparRef.id;

      const kravRef = db.collection("kompetenskrav").doc();
      await kravRef.set({
        roll: "personal",
        rutinId: klinisktStodRutin.id,
        rutinTitel: klinisktStodRutin.titel,
        omrade: "kliniskt-stod",
        frekvensManader: 12,
        organisationId: orgRef.id,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      kompetenskravId = kravRef.id;
    }
  }

  await loggaRevision({
    organisationId: orgRef.id,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_etablerad",
    objektTyp: "organisationer",
    objektId: orgRef.id,
    sammanfattning: `Organisationen "${namn}" etablerad`,
  });

  return {
    orgId: orgRef.id,
    antalMallrutiner,
    antalForradsartiklar,
    antalKontakter,
    introduktionssparId,
    kompetenskravId,
    inbjudanToken,
    inbjudanEpostSkickat,
  };
});

// Etapp 6a: översikt åt leverantörsadmin – en rad per kundorganisation med moduler, antal
// användare och senaste avslutade månadens AI-kostnad (redan arkiverad av reserveraBudget,
// se Etapp 5). Ingen kunddata (rutiner/anslag/etc) exponeras, bara administrativ metadata.
exports.listaOrganisationer = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const idag = dagensDatumStockholm();
  const [orgSnap, sokkvotSnap, epostSnap] = await Promise.all([
    db.collection("organisationer").get(),
    db.collection("systemstatus").doc("sokkvot").get(),
    db.collection("systemstatus").doc("epost").get(),
  ]);
  const organisationer = await Promise.all(
    orgSnap.docs.map(async (orgDoc) => {
      const data = orgDoc.data();
      // Etapp L1k (intern/ETAPPLAN-INTERN-1.md): den här frågan gjorde tidigare en extra
      // users-läsning per organisation, VARJE gång vyn öppnades – 50 kunder gav 50 extra
      // läsningar för en siffra som bara ändras vid en inbjudan eller en radering.
      // losInInbjudan/raderaAnvandare underhåller nu en räknare på organisationsdokumentet;
      // frågan görs bara kvar för organisationer som ännu saknar fältet (skapade innan
      // räknaren fanns), och resultatet skrivs tillbaka så nästa öppning slipper den helt.
      // Lativt mönster, samma princip som kostnadshistorikens månadsarkivering i gemensamt.js.
      const behoverBackfill = typeof data.antalAnvandare !== "number";
      const [anvandareSnap, kostnadSnap] = await Promise.all([
        behoverBackfill ? db.collection("users").where("organisationId", "==", orgDoc.id).get() : null,
        // limit(2) i stället för 1 (Etapp L1i): kostar noll extra läsningar – samma fråga,
        // en rad till i samma svar – men ger ekonomiöversikten en riktning (upp/ner/stabilt)
        // att jämföra mot, inte bara en enda månads ögonblicksbild.
        orgDoc.ref.collection("kostnadshistorik").orderBy("manad", "desc").limit(2).get(),
      ]);
      let antalAnvandare = data.antalAnvandare;
      if (behoverBackfill) {
        antalAnvandare = anvandareSnap.size;
        // En samtidig inbjudan/radering mellan läsningen ovan och skrivningen här skulle
        // kunna göra just den här enstaka backfillen ett steg fel – i praktiken orealistiskt
        // (en ensam plattformsadmin, ingen samtidig självregistrering), och ofarligt även om
        // det händer: fältet är rent visningsunderlag och styr ingen behörighet. Det rättar
        // sig inte automatiskt (framtida increment/decrement fortsätter bara från det redan
        // satta talet) men avviker i så fall högst med ett enda konto, aldrig fler.
        await orgDoc.ref.set({ antalAnvandare }, { merge: true }).catch(() => {});
      }
      return {
        orgId: orgDoc.id,
        namn: data.namn ?? orgDoc.id,
        status: data.status ?? "aktiv",
        moduler: data.moduler ?? {},
        antalAnvandare,
        senasteKostnad: kostnadSnap.empty ? null : kostnadSnap.docs[0].data(),
        // Etapp L1i: de(t) senaste (upp till) två månaderna, äldst sist – samma dokument som
        // senasteKostnad ovan, bara med en rad till. Räcker för en enkel riktning, inte en
        // fullständig graf (se L1d, som ännu inte är byggd).
        kostnadshistorikSenaste: kostnadSnap.docs.map((d) => d.data()),
        // Saknas fältet helt (organisationer etablerade före Etapp 15a) antas de redan vara
        // en riktig, aktiv kund – annars skulle en befintlig kund plötsligt visas som "offert".
        avtalsstatus: data.avtalsstatus ?? "aktiv",
        provperiodSlut: data.provperiodSlut ?? null,
        // Etapp 48b: dagens andel av den DELADE sökkvoten – 0 om organisationen inte sökt
        // alls idag, oavsett vad fältet råkar innehålla från ett tidigare datum.
        sokkvotIdag: data.sokkvotDatum === idag ? (data.sokkvotAntal ?? 0) : 0,
        // Etapp 48c: manuellt inmatat avtalat årspris, se satAvtaladArsavgift.
        avtaladArsavgiftKr: data.avtaladArsavgiftKr ?? null,
        // Etapp 70e: null betyder att organisationen skapades utan startbibliotek (eller före
        // fältet infördes) – SeedaStartbibliotekSektion visar det, så en tom organisation går
        // att känna igen utan att öppna den.
        verksamhetstyp: data.verksamhetstyp ?? null,
        // Etapp 48d: null betyder "använder standardtaket", inte "inget tak alls".
        sokkvotTakPerDygn: data.sokkvotTakPerDygn ?? null,
        // Etapp 49a: en pågående, avbrytbar radering – visas som en varning i leverantörsvyn.
        raderingSchemalagdTill: data.raderingSchemalagdTill?.toDate?.().toISOString() ?? null,
        raderingAnledning: data.raderingAnledning ?? null,
        // Etapp 50b: en aktiv, kundbeviljad supportåtkomst – visas i leverantörsvyn så det
        // alltid syns VILKA organisationer som just nu går att läsa innehåll för.
        supportAtkomstTill: data.supportAtkomstTill?.toDate?.().toISOString() ?? null,
        supportAtkomstAnledning: data.supportAtkomstAnledning ?? null,
        // Etapp 51: badge:as tydligt i leverantörsvyn – aldrig en betalande kund.
        arDemo: data.arDemo === true,
        // Etapp 54b: gruppering ovanpå, ingen ny läsväg – se satHuvudman.
        huvudman: data.huvudman ?? null,
        // Etapp 67 beslutspunkt 2 (ETAPPLAN16.md): fältet fanns redan (satt vid skapaOrganisation,
        // se Etapp 6b) men returnerades aldrig härifrån. null bara i teorin – varje organisation
        // som når fram till den här listan har redan passerat skapaOrganisation.
        skapad: data.skapad?.toDate?.().toISOString() ?? null,
        // Saknas för organisationer skapade före Etapp 67 (satAvtalsstatus skrev fältet först
        // därefter) – null betyder "aldrig ändrad sedan uppföljningen infördes", inte "aldrig
        // ändrad över huvud taget".
        avtalsstatusAndrad: data.avtalsstatusAndrad?.toDate?.().toISOString() ?? null,
        // BUGFIX (L1b, upptäckt vid premisskontroll 2026-08-29): dessa fält har satts på
        // organisationsdokumentet sedan Etapp 6b (orgnr/kontaktperson/anvandartak) respektive
        // Etapp L1p (pubAvtalTecknat m.fl.) men returnerades ALDRIG härifrån. Konsekvensen var
        // tyst: AvtalOchAtagandeSektion.jsx (byggd i L1p) läste dem från just det här svaret
        // och visade därför ALLTID "inte tecknat"/tomt, oavsett vad som faktiskt var sparat i
        // Firestore – ett fel funktionstesterna (som skrev/läste dokumentet direkt) aldrig
        // kunde fånga, eftersom de aldrig gick via listaOrganisationer.
        orgnr: data.orgnr ?? null,
        kontaktperson: data.kontaktperson ?? null,
        anvandartak: data.anvandartak ?? null,
        pubAvtalTecknat: data.pubAvtalTecknat?.toDate?.().toISOString() ?? null,
        pubAvtalVersion: data.pubAvtalVersion ?? null,
        underbitradeUnderrattad: data.underbitradeUnderrattad
          ? { version: data.underbitradeUnderrattad.version, datum: data.underbitradeUnderrattad.datum?.toDate?.().toISOString() ?? null }
          : null,
        omfattasAvNIS2: data.omfattasAvNIS2 === true,
        atagandeblock: data.atagandeblock
          ? { text: data.atagandeblock.text, andrad: data.atagandeblock.andrad?.toDate?.().toISOString() ?? null }
          : null,
        // Etapp L1j (beslutspunkt 2, avgjord 2026-08-30): bara appversion, medvetet INTE
        // "senast aktiv" per användare (se rapporteraAppVersion nedan för motiveringen).
        senasteAppVersion: data.senasteAppVersion ?? null,
        senasteAppVersionTid: data.senasteAppVersionTid?.toDate?.().toISOString() ?? null,
      };
    })
  );
  const sokkvotData = sokkvotSnap.exists ? sokkvotSnap.data() : null;
  const sokkvot = {
    // Samma "0 om datumet inte är idag"-princip som ovan, per organisation – annars visas
    // gårdagens sista mätning som om den vore aktuell tills första sökningen idag.
    totalAntal: sokkvotData?.datum === idag ? (sokkvotData.totalAntal ?? 0) : 0,
    tak: sokkvotData?.tak ?? SOKKVOT_DAGSTAK,
    // Etapp 48d: så leverantörsvyn kan visa vad "Ej ifyllt" faktiskt betyder i praktiken.
    orgTakStandard: SOKKVOT_ORG_TAK_STANDARD,
  };
  // Etapp 53a: det globala e-post-nödstoppet, samma "läses i samma anrop som resten av
  // leverantörsvyn"-mönster som sokkvot ovan – ingen egen live-lyssnare behövs för en flagga
  // som bara en plattformsadmin sätter, sällan, via en egen knapp.
  const epostAvstangd = epostSnap.exists && epostSnap.data()?.avstangd === true;
  // Etapp 32c: plattformsadmins tvärorganisatoriska åtkomst loggades tidigare inte alls.
  // "_plattform" är inget riktigt organisationId (det finns aldrig en kund vid namn det) –
  // en egen hashkedja för händelser som spänner över ALLA organisationer, inte en specifik.
  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "plattform_organisationer_listade",
    objektTyp: null,
    objektId: null,
    sammanfattning: `Listade ${organisationer.length} organisationer`,
  });
  return { organisationer, sokkvot, epostAvstangd };
});

// Etapp L1j (beslutspunkt 2, avgjord 2026-08-30): bara APPVERSION rapporteras, aldrig
// "senast aktiv" per användare – versionen är ren drift (PWA:n cachar, en kund kan ligga
// efter utan att någon vet) och pekar inte ut en specifik person, medan "senast aktiv" är
// närmare övervakning av personal och avvaktas tills ett tydligare syfte finns (se
// BESLUTSLOGG.md 2026-08-30). Skriver på ORGANISATIONENS dokument (inte per användare) –
// senaste inloggade klientens version, "senast vunnen" om flera klienter är öppna samtidigt,
// vilket räcker för syftet: se om en kund ligger kvar på en gammal version.
exports.rapporteraAppVersion = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const version = request.data?.version;
  if (!version || typeof version !== "string" || version.length > 40) {
    throw new HttpsError("invalid-argument", "version krävs (sträng, max 40 tecken).");
  }
  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await db.collection("organisationer").doc(organisationId).set(
    {
      senasteAppVersion: version,
      senasteAppVersionTid: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { ok: true };
});

// Etapp 51: en demo-/övningsorganisation som aldrig är en riktig kund – en säljdemo eller en
// nyanställds första övning ska aldrig kunna röra riktig kunddata, och tvärtom. Isoleringen
// kräver INGEN särskild regel: samma matcharMinOrg()-mekanism som redan gäller mellan VILKA
// två organisationer som helst (bevisat i tests/rules/organisationsisolering.test.mjs) skyddar
// automatiskt _demo också – ett hårt krav i ETAPPLAN10.md §51 var att detta ska vara ett
// regeltest, inte en UI-regel, se den nya explicita kontrollen i samma testfil.
const DEMO_ORG_ID = "_demo";
const DEMO_ORG_NAMN = "Demo & övning (nollställs varje natt, se ETAPPLAN10.md Etapp 51)";
// Bara de collections som faktiskt seedas nedan – ett medvetet SMALARE urval än
// BACKUP_COLLECTIONS (som raderaOrganisationensData återanvänder), eftersom demomiljön inte
// har någon uppladdad fil, skiftrapport eller introduktionstilldelning att städa.
const DEMO_COLLECTIONS = ["rutiner", "forradsartiklar", "anslag", "kontakter", "kompetenskrav"];

async function stadaDemoOrganisationensInnehall() {
  const uidSnap = await db.collection("users").where("organisationId", "==", DEMO_ORG_ID).select().get();
  for (const uidDoc of uidSnap.docs) {
    await admin.auth().deleteUser(uidDoc.id).catch(() => {});
    await uidDoc.ref.delete().catch(() => {});
  }
  for (const namn of DEMO_COLLECTIONS) {
    const snap = await db.collection(namn).where("organisationId", "==", DEMO_ORG_ID).get();
    const BATCHSTORLEK = 400;
    for (let i = 0; i < snap.docs.length; i += BATCHSTORLEK) {
      const batch = db.batch();
      for (const dok of snap.docs.slice(i, i + BATCHSTORLEK)) {
        batch.delete(dok.ref);
      }
      await batch.commit();
    }
  }
}

// Innehållet är MEDVETET strukturella exempel, samma hållning som verksamhetsmallar.js –
// aldrig fabricerat kliniskt innehåll (se den filens egen motivering). Täcker fyra ytor
// §51a explicit efterfrågar: checklistläge (akutlage+steg), samlad godkännandekö (status
// "utkast"), innehållshälsa (ett gammalt granskadDatum), och kompetensmatris (ett
// kompetenskrav utan någon kvittering ännu – SAKNAS-status, redo att övas bort).
async function froSaDemoOrganisationensInnehall() {
  const mallar = VERKSAMHETSMALLAR.akutmottagning;
  const batch = db.batch();
  const forstaMallRef = db.collection("rutiner").doc();

  mallar.forEach((mall, i) => {
    const ref = i === 0 ? forstaMallRef : db.collection("rutiner").doc();
    batch.set(ref, {
      titel: mall.titel,
      innehall: mall.innehall,
      omrade: mall.omrade,
      status: "godkand",
      organisationId: DEMO_ORG_ID,
      kalla: "demo",
      borttagen: false,
      granskadDatum: admin.firestore.FieldValue.serverTimestamp(),
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  batch.set(db.collection("rutiner").doc(), {
    titel: "Ny rutin för läkemedelsavvikelser (demo, väntar på godkännande)",
    innehall: "# Bakgrund\n\nDetta är en demo-rutin i utkast – öva på att granska och godkänna den.",
    omrade: "administration",
    status: "utkast",
    organisationId: DEMO_ORG_ID,
    kalla: "demo",
    borttagen: false,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("rutiner").doc(), {
    titel: "Checklista – anafylaxi (demo)",
    innehall: "# Följ stegen nedan i ordning.",
    omrade: "kliniskt-stod",
    status: "godkand",
    akutlage: true,
    steg: [
      { text: "Bedöm luftväg, andning, cirkulation", bild: "", varning: "", timerSekunder: null },
      { text: "Ge adrenalin enligt lokal rutin", bild: "", varning: "Kontrollera dos innan administrering", timerSekunder: null },
      { text: "Larma och överlämna enligt er rutin", bild: "", varning: "", timerSekunder: null },
    ],
    organisationId: DEMO_ORG_ID,
    kalla: "demo",
    borttagen: false,
    granskadDatum: admin.firestore.FieldValue.serverTimestamp(),
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  const gransDatum = new Date();
  gransDatum.setDate(gransDatum.getDate() - 200);
  batch.set(db.collection("rutiner").doc(), {
    titel: "Rutin för läkemedelsgenomgång (demo, bör granskas)",
    innehall: "# Bakgrund\n\nDenna demo-rutin har medvetet ett gammalt granskningsdatum.",
    omrade: "administration",
    status: "godkand",
    organisationId: DEMO_ORG_ID,
    kalla: "demo",
    borttagen: false,
    granskadDatum: admin.firestore.Timestamp.fromDate(gransDatum),
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("forradsartiklar").doc(), {
    namn: "Kompresser 10x10",
    forrad: "Akutförråd",
    skap: "A",
    hylla: "1",
    antal: 12,
    minAntal: 5,
    status: "godkand",
    organisationId: DEMO_ORG_ID,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  // Medvetet under minAntal – ger en trainee något verkligt att öva bristanmälan på.
  batch.set(db.collection("forradsartiklar").doc(), {
    namn: "Adrenalin 1 mg/ml",
    forrad: "Akutförråd",
    skap: "B",
    hylla: "2",
    antal: 2,
    minAntal: 5,
    status: "godkand",
    organisationId: DEMO_ORG_ID,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("anslag").doc(), {
    titel: "Välkommen till demo- och övningsmiljön!",
    innehall: "All data här nollställs automatiskt varje natt – öva fritt, inget kan gå sönder.",
    organisationId: DEMO_ORG_ID,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });

  batch.set(db.collection("kontakter").doc(), { namn: "Jour, medicin (demo)", telefon: "070-0000000", organisationId: DEMO_ORG_ID });
  batch.set(db.collection("kontakter").doc(), { namn: "Växel (demo)", telefon: "08-0000000", organisationId: DEMO_ORG_ID });

  await batch.commit();

  await db.collection("kompetenskrav").add({
    roll: "personal",
    rutinId: forstaMallRef.id,
    rutinTitel: mallar[0].titel,
    omrade: mallar[0].omrade,
    frekvensManader: 12,
    organisationId: DEMO_ORG_ID,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Delad kärna för både det nattliga schemat och ett manuellt "nollställ nu"-anrop.
// inbjudanEpost är valfri: utan den nollställs bara innehållet (det nattliga schemat har
// ingen känd mottagare); med den (det manuella anropet från /leverantor) skapas också en
// färsk superadmin-inbjudan, EXAKT samma mekanism skapaOrganisation redan använder för att
// bjuda in en ny kunds första superadmin – medvetet INTE en öppen/jokerinbjudan (Etapp 6c
// stängde öppen registrering av säkerhetsskäl; en jokerlänk hade återinfört exakt det).
async function nollstallDemoOrganisationKarna(inbjudanEpost) {
  await db.collection("organisationer").doc(DEMO_ORG_ID).set(
    {
      namn: DEMO_ORG_NAMN,
      status: "aktiv",
      moduler: { operations: true, intelligence: true },
      arDemo: true,
      avtalsstatus: "aktiv",
    },
    { merge: true }
  );

  await stadaDemoOrganisationensInnehall();
  await froSaDemoOrganisationensInnehall();

  let inbjudanToken = null;
  if (inbjudanEpost) {
    const inbjudan = await skapaInbjudanIntern({
      organisationId: DEMO_ORG_ID,
      epost: inbjudanEpost,
      roll: "superadmin",
      skapadAv: "_system",
    });
    inbjudanToken = inbjudan.token;
  }

  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: "_system",
    aktorRoll: "system",
    handelsetyp: "demo_organisation_nollstalld",
    objektTyp: "organisationer",
    objektId: DEMO_ORG_ID,
    sammanfattning: inbjudanEpost
      ? `Demo-organisationen nollställd, ny inbjudan utfärdad till ${inbjudanEpost}`
      : "Demo-organisationen nollställd (schemalagt)",
  });

  return { inbjudanToken };
}

exports.nollstallDemoOrganisation = onCall({ region: "europe-west1", secrets: [BREVO_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const inbjudanEpostRaw = request.data?.inbjudanEpost;
  const inbjudanEpost = inbjudanEpostRaw ? String(inbjudanEpostRaw).trim().toLowerCase() : null;
  if (inbjudanEpost && !inbjudanEpost.includes("@")) {
    throw new HttpsError("invalid-argument", "Inbjudans e-postadress är ogiltig.");
  }
  return nollstallDemoOrganisationKarna(inbjudanEpost);
});

// Etapp 51b: nollställs nattligt så en demo aldrig ärver förra besökarens spår. Samma
// tidpunkt-mönster som övriga nattliga jobb (veckovisBackupSchemalagt m.fl.).
exports.nollstallDemoOrganisationSchemalagt = onSchedule(
  { schedule: "every day 04:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  async () => {
    try {
      await nollstallDemoOrganisationKarna(null);
    } catch (fel) {
      console.error("Nattlig nollställning av demo-organisationen misslyckades:", fel);
      Sentry.captureException(fel, { tags: { typ: "demo_nollstallning_misslyckades" } });
    }
  }
);

// Etapp 70e: seedar startbiblioteket i EFTERHAND, mot en organisation som redan finns.
//
// Bakgrunden är ett verkligt fynd 2026-08-26: ägaren skapade en organisation, bjöd in två
// kollegor, och de möttes av en helt tom app – inga rutiner, inga förråd, inga kontakter.
// Orsaken var att `verksamhetstyp` har default "" ("Inget startbibliotek") i
// SkapaOrganisationSektion.jsx, och att HELA seedningen i skapaOrganisation är villkorad av
// att ett värde valdes. Det fanns ingen väg tillbaka: organisationen existerade redan, och
// seedningen kunde bara köras vid skapandet.
//
// IDEMPOTENT med flit. Hoppar över varje del som redan har innehåll, så att ett andra anrop
// inte dubblerar rutinlistan. Det är viktigare än det låter – funktionen kommer att köras av
// en människa som inte vet om den redan kördes.
exports.seedaStartbibliotek = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const organisationId = request.data?.organisationId;
  const verksamhetstyp = request.data?.verksamhetstyp;
  if (!organisationId) {
    throw new HttpsError("invalid-argument", "organisationId krävs.");
  }
  if (!VERKSAMHETSMALLAR[verksamhetstyp]) {
    throw new HttpsError("invalid-argument", "En giltig verksamhetstyp krävs.");
  }
  const orgRef = db.collection("organisationer").doc(organisationId);
  const orgSnap = await orgRef.get();
  if (!orgSnap.exists) {
    throw new HttpsError("not-found", "Organisationen finns inte.");
  }

  // Varje del kontrolleras för sig: en organisation kan ha hunnit få egna rutiner men fortsatt
  // sakna förråd, och då ska förrådet fyllas utan att rutinerna dubbleras.
  const [befintligaRutiner, befintligaArtiklar, befintligaKontakter] = await Promise.all([
    db.collection("rutiner").where("organisationId", "==", organisationId).limit(1).select().get(),
    db.collection("forradsartiklar").where("organisationId", "==", organisationId).limit(1).select().get(),
    db.collection("kontakter").where("organisationId", "==", organisationId).limit(1).select().get(),
  ]);

  let antalMallrutiner = 0;
  const skapadeRutiner = [];
  if (befintligaRutiner.empty) {
    const batch = db.batch();
    for (const mall of VERKSAMHETSMALLAR[verksamhetstyp]) {
      const ref = db.collection("rutiner").doc();
      batch.set(ref, {
        titel: mall.titel,
        innehall: mall.innehall,
        omrade: mall.omrade,
        kviss: mall.kviss ?? [],
        status: "godkand",
        organisationId,
        kalla: "verksamhetsmall",
        borttagen: false,
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      skapadeRutiner.push({ id: ref.id, omrade: mall.omrade, titel: mall.titel });
      antalMallrutiner += 1;
    }
    await batch.commit();
  }

  let antalForradsartiklar = 0;
  let antalKontakter = 0;
  const ickeRutinBatch = db.batch();
  if (befintligaArtiklar.empty) {
    for (const artikel of FORRADSMALLAR[verksamhetstyp] ?? []) {
      ickeRutinBatch.set(db.collection("forradsartiklar").doc(), {
        ...artikel,
        status: "godkand",
        organisationId,
        skapadAv: request.auth.uid,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      antalForradsartiklar += 1;
    }
  }
  if (befintligaKontakter.empty) {
    for (const kontakt of KONTAKTMALLAR) {
      ickeRutinBatch.set(db.collection("kontakter").doc(), {
        ...kontakt,
        akutnummer: Boolean(kontakt.akutnummer),
        organisationId,
        skapad: admin.firestore.FieldValue.serverTimestamp(),
      });
      antalKontakter += 1;
    }
  }
  if (antalForradsartiklar > 0 || antalKontakter > 0) {
    await ickeRutinBatch.commit();
  }

  // Samma villkor som i skapaOrganisation: introduktionsspår och kompetenskrav pekar på
  // riktiga rutin-id:n och byggs därför bara när rutiner faktiskt seedades i det här anropet.
  let introduktionssparId = null;
  let kompetenskravId = null;
  const klinisktStodRutin = skapadeRutiner.find((r) => r.omrade === "kliniskt-stod");
  if (klinisktStodRutin) {
    const enAnnanRutin = skapadeRutiner.find((r) => r.id !== klinisktStodRutin.id);
    const etapper = [{ namn: "Dag 1", poster: [{ typ: "rutin", id: klinisktStodRutin.id, rekommenderadDag: 1 }] }];
    if (enAnnanRutin) {
      etapper.push({ namn: "Vecka 1", poster: [{ typ: "rutin", id: enAnnanRutin.id, rekommenderadDag: 5 }] });
    }
    const sparRef = db.collection("introduktionsspar").doc();
    await sparRef.set({
      namn: "Introduktion för ny personal (mall, anpassa)",
      malRoll: "personal",
      etapper,
      organisationId,
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
    introduktionssparId = sparRef.id;

    const kravRef = db.collection("kompetenskrav").doc();
    await kravRef.set({
      roll: "personal",
      rutinId: klinisktStodRutin.id,
      rutinTitel: klinisktStodRutin.titel,
      omrade: "kliniskt-stod",
      frekvensManader: 12,
      organisationId,
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
    kompetenskravId = kravRef.id;
  }

  // Spara typen så att organisationen i efterhand går att känna igen, precis som en som
  // seedades vid skapandet.
  await orgRef.update({ verksamhetstyp });

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "startbibliotek_seedat",
    objektTyp: "organisationer",
    objektId: organisationId,
    sammanfattning: `Startbibliotek (${verksamhetstyp}) seedat i efterhand: ${antalMallrutiner} rutiner, ${antalForradsartiklar} artiklar, ${antalKontakter} kontakter`,
  });

  return {
    antalMallrutiner,
    antalForradsartiklar,
    antalKontakter,
    introduktionssparId,
    kompetenskravId,
    hoppadeOver: {
      rutiner: !befintligaRutiner.empty,
      forradsartiklar: !befintligaArtiklar.empty,
      kontakter: !befintligaKontakter.empty,
    },
  };
});
