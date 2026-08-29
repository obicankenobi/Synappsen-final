// inbjudningar.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: inbjudningsflödet: skapa, granska och lösa in en inbjudan.

const crypto = require("node:crypto");
const {
  admin,
  db,
  onCall,
  HttpsError,
  BREVO_API_KEY,
  GILTIGA_ROLLER,
  APP_URL,
  hamtaAnvandarInfo,
  kravModul,
  skickaEpost,
  loggaRevision,
} = require("./gemensamt");

// Etapp 6c: inbjudningsflöde istället för öppen självbetjänings-registrering. Ett nytt konto
// kan numera ALDRIG skapa sitt eget users/{uid}-dokument direkt (se firestore.rules – create
// är stängt helt) – den enda vägen in är att lösa in en giltig inbjudan här, som körs med
// Admin SDK och därför kan kringgå den regeln på ett kontrollerat sätt.
const INBJUDAN_GILTIGHETSTID_MS = 7 * 24 * 60 * 60 * 1000;


// Delad av skapaInbjudan (superadmin bjuder in till sin egen organisation), skapaOrganisation
// (Etapp 15a: leverantörsadmin bjuder in den nya kundens första superadmin i samma anrop som
// etableringen) och nollstallDemoOrganisation (Etapp 51c). Ingen egen behörighetskontroll här
// – anroparen ansvarar för det.
//
// Etapp 53b: skickar nu ÄVEN inbjudan per e-post, som förval – men den kopierbara länken
// (returnerad som token, byggs till en länk av anroparen) behålls ALLTID som fallback, eftersom
// mejlet kommer att fastna i ett spamfilter hos minst en region. Ett misslyckat e-postutskick
// (kanalen avstängd, saknad nyckel, Brevo nere) ska ALDRIG blockera att inbjudan skapas – bara
// e-postkanalen är opålitlig, inte inbjudan i sig. Organisationens namn i mejlet är ett
// medvetet, dokumenterat undantag från genomgående krav 18 (se ETAPPLAN11.md §53b): utan
// namnet är mejlet obegripligt.
// Bygger inbjudningsmejlets ämne och text. Bruten ut som ren funktion 2026-08-27, när den
// rättsliga spärren mot Brevo (se PUB_AVTAL_BREVO_TECKNAT i gemensamt.js) gjorde att inget
// mejl längre skickas: testet som bevakade att organisationens namn och rätt token finns i
// mejlet kunde annars inte längre köras alls, och den täckningen hade tystnat under hela den
// tid spärren är på. Nu testas innehållet utan att något skickas.
//
// Organisationens namn i mejlet är ett medvetet, dokumenterat undantag från genomgående
// krav 18 (se ETAPPLAN11.md §53b): utan namnet är mejlet obegripligt för mottagaren.
function byggInbjudningsmejl({ orgNamn, token }) {
  return {
    amne: `Du är inbjuden till ${orgNamn} på Synappsen`,
    text:
      `Du har blivit inbjuden till ${orgNamn}s kunskapsbank i Synappsen.\n\n` +
      `Skapa ditt konto här: ${APP_URL}/registrera?bjudan=${token}\n\n` +
      `Länken är giltig i 7 dagar. Har du frågor, kontakta den som bjöd in dig.`,
  };
}

async function skapaInbjudanIntern({ organisationId, epost, roll, skapadAv }) {
  const token = crypto.randomBytes(24).toString("base64url");
  await db.collection("inbjudningar").doc(token).set({
    organisationId,
    roll,
    epost,
    anvand: false,
    skapadAv,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
    utgangstid: Date.now() + INBJUDAN_GILTIGHETSTID_MS,
  });
  let epostSkickat = false;
  // Etapp 53a-tillägg 2026-08-28: anledningen bubblar upp, inte bara ja/nej. Gränssnittet
  // påstod annars alltid "e-post är inte konfigurerat", vilket blev osant i samma stund som
  // den rättsliga spärren infördes – nyckeln ÄR konfigurerad, utskicket är pausat. Samma
  // klass av fel som Etapp 70c rättade (UI:t påstod att mejlet gått fram när det inte hade).
  let epostAnledning = null;
  try {
    const orgSnap = await db.collection("organisationer").doc(organisationId).get();
    const orgNamn = orgSnap.data()?.namn ?? organisationId;
    const resultat = await skickaEpost({
      till: epost,
      ...byggInbjudningsmejl({ orgNamn, token }),
      organisationId,
    });
    // Etapp 70c: skickaEpost() KASTAR inte när nyckeln saknas – den returnerar
    // {skickat:false}. Utan att läsa returvärdet såg gränssnittet ett lyckat anrop och
    // påstod för superadmin att mejlet gått iväg, vilket var osant under hela den tid
    // BREVO_API_KEY saknades. Statusen bubblar nu upp till klienten i stället.
    epostSkickat = resultat?.skickat === true;
    epostAnledning = epostSkickat ? null : (resultat?.anledning ?? "okand");
  } catch (fel) {
    // Se motiveringen ovan: inbjudan är redan skapad och giltig även om mejlet uteblir.
    // Adressen utelämnas medvetet ur loggen – se motiveringen i skickaEpost (gemensamt.js):
    // en e-postadress är en personuppgift och Cloud Logging är inte organisationsskopat.
    // Vilken inbjudan det gäller går att se på inbjudningar/{token} i Firestore.
    console.warn(`Inbjudningsmejl kunde inte skickas (org ${organisationId}):`, fel.message ?? fel);
    epostAnledning = "utskicksfel";
  }
  return { token, epostSkickat, epostAnledning };
}

// Skapas av en superadmin i adminpanelen (KAN bara bjuda in till sin EGEN organisation –
// organisationId hämtas här server-side från anroparen, tas ALDRIG emot som klientdata,
// annars hade en superadmin kunnat bjuda in någon till en annan organisation).
exports.skapaInbjudan = onCall({ region: "europe-west1", secrets: [BREVO_API_KEY] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { roll: anroparRoll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (anroparRoll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan bjuda in nya konton.");
  }
  const epost = (request.data?.epost ?? "").trim().toLowerCase();
  const roll = request.data?.roll;
  if (!epost || !epost.includes("@")) {
    throw new HttpsError("invalid-argument", "En giltig e-postadress krävs.");
  }
  if (!GILTIGA_ROLLER.includes(roll)) {
    throw new HttpsError("invalid-argument", "En giltig roll krävs.");
  }
  // Etapp 59b (ETAPPLAN12.md, bugfynd): kiosk-rollen (Etapp 55) hör till Operations
  // (FEATURE.KIOSK_MODE) men gick tidigare att bjuda in oavsett moduler – detta är den
  // faktiska affärsspärren (se motiveringen i verifieraKioskPin ovan för varför den INTE
  // sitter på att lämna kioskläget, bara på att skapa ett nytt konto).
  if (roll === "kiosk") {
    await kravModul(organisationId, "operations", "Kioskläge kräver Operations-modulen.");
  }

  const { token, epostSkickat, epostAnledning } = await skapaInbjudanIntern({
    organisationId,
    epost,
    roll,
    skapadAv: request.auth.uid,
  });
  // epostAnledning måste med hela vägen ut – gränssnittet visar annars en generisk och
  // därmed ofta felaktig förklaring till varför mejlet uteblev. Testet i
  // tests/functions/epost.test.cjs failar om den tappas här igen.
  return { token, epostSkickat, epostAnledning };
});

// Publikt (INGEN inloggning krävs – personen har ännu inget konto) läs-anrop som bara
// avslöjar det minimum som behövs för att visa ett meningsfullt registreringsformulär:
// e-postadress, roll och organisationsnamn. Avslöjar ALDRIG organisationId rakt av eller
// någon annan organisations existens – token är den enda hemligheten (192 bitar, se
// crypto.randomBytes(24) ovan, praktiskt taget ogissningsbar).
exports.granskaInbjudan = onCall({ region: "europe-west1" }, async (request) => {
  const token = request.data?.token;
  if (!token || typeof token !== "string") {
    throw new HttpsError("invalid-argument", "token krävs.");
  }
  const snap = await db.collection("inbjudningar").doc(token).get();
  if (!snap.exists) {
    throw new HttpsError("not-found", "Inbjudan hittades inte. Kontrollera länken eller be om en ny.");
  }
  const data = snap.data();
  if (data.anvand) {
    throw new HttpsError("failed-precondition", "Inbjudan har redan använts.");
  }
  if (Date.now() > data.utgangstid) {
    throw new HttpsError("failed-precondition", "Inbjudan har gått ut. Be om en ny.");
  }
  const orgSnap = await db.collection("organisationer").doc(data.organisationId).get();
  return {
    epost: data.epost,
    roll: data.roll,
    organisationsNamn: orgSnap.data()?.namn ?? data.organisationId,
  };
});

// Löser in en inbjudan för ett REDAN skapat Firebase Auth-konto (klienten anropar
// createUserWithEmailAndPassword FÖRST, sedan detta – se src/context/AuthContext.jsx).
// Skriver users/{uid} via Admin SDK, vilket är den enda vägen in numera eftersom
// firestore.rules stänger klientens egen create-rätt helt.
exports.losInInbjudan = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const token = request.data?.token;
  const namn = (request.data?.namn ?? "").trim();
  if (!token || typeof token !== "string" || !namn) {
    throw new HttpsError("invalid-argument", "token och namn krävs.");
  }

  const inbjudanRef = db.collection("inbjudningar").doc(token);
  // organisationId/roll fångas här och används EFTER transaktionen för att logga
  // revisionen – loggaRevision() kör sin egen transaktion (mot revisionsloggHuvud) och kan
  // därför inte anropas inifrån den här transaktionens callback.
  let inbjudanOrganisationId;
  let inbjudanRoll;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(inbjudanRef);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Inbjudan hittades inte.");
    }
    const data = snap.data();
    if (data.anvand) {
      throw new HttpsError("failed-precondition", "Inbjudan har redan använts.");
    }
    if (Date.now() > data.utgangstid) {
      throw new HttpsError("failed-precondition", "Inbjudan har gått ut.");
    }
    // Kräver att kontot som faktiskt loggade in matchar den inbjudna e-postadressen – annars
    // skulle vem som helst med token kunna lösa in NÅGON ANNANS inbjudan mot sitt eget konto.
    const inloggadEpost = (request.auth.token.email ?? "").trim().toLowerCase();
    if (inloggadEpost !== data.epost) {
      throw new HttpsError(
        "permission-denied",
        "Den inloggade e-postadressen matchar inte inbjudans e-postadress."
      );
    }

    inbjudanOrganisationId = data.organisationId;
    inbjudanRoll = data.roll;

    // Etapp L1k (intern/ETAPPLAN-INTERN-1.md): läses INNAN någon skrivning (Firestore-
    // transaktioner kräver det), för att avgöra om räknaren redan är initierad. Att bara
    // öka den blint med FieldValue.increment(1) hade varit FEL för en organisation vars
    // räknare aldrig satts än: increment på ett saknat fält utgår ifrån 0, så resultatet
    // hade blivit "1 användare" även om organisationen redan har tio – en tyst, felaktig
    // absolut siffra i stället för en korrekt delta.
    const orgRef = db.collection("organisationer").doc(data.organisationId);
    const orgSnap = await tx.get(orgRef);
    const raknarenArInitierad = typeof orgSnap.data()?.antalAnvandare === "number";

    tx.set(db.collection("users").doc(request.auth.uid), {
      namn,
      email: data.epost,
      role: data.roll,
      organisationId: data.organisationId,
      skapad: admin.firestore.FieldValue.serverTimestamp(),
    });
    tx.set(
      inbjudanRef,
      { anvand: true, anvandAv: request.auth.uid, anvandTid: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
    if (raknarenArInitierad) {
      tx.set(orgRef, { antalAnvandare: admin.firestore.FieldValue.increment(1) }, { merge: true });
    }
    // Är räknaren INTE initierad lämnas fältet orört – listaOrganisationers lativa backfill
    // räknar då rätt nästa gång vyn öppnas, med det här nya kontot redan inräknat (eftersom
    // users/{uid} redan är skrivet ovan, i samma transaktion).
  });

  await loggaRevision({
    organisationId: inbjudanOrganisationId,
    aktorUid: request.auth.uid,
    aktorRoll: inbjudanRoll,
    handelsetyp: "anvandare_skapad",
    objektTyp: "users",
    objektId: request.auth.uid,
    sammanfattning: `Nytt konto skapat via inbjudan, roll: ${inbjudanRoll}`,
  });

  // Etapp 19a: automatisk tilldelning av introduktionsspår, om organisationen har definierat
  // ett för den här rollen. Görs EFTER transaktionen (precis som loggaRevision ovan) – en
  // fristående, icke-transaktionell skrivning, så ett saknat/dubbelt spår i värsta fall bara
  // innebär att den automatiska tilldelningen uteblir, inte att hela inloggningen misslyckas.
  try {
    const sparSnap = await db
      .collection("introduktionsspar")
      .where("organisationId", "==", inbjudanOrganisationId)
      .where("malRoll", "==", inbjudanRoll)
      .limit(1)
      .get();
    if (!sparSnap.empty) {
      const spar = sparSnap.docs[0];
      await db.collection("introduktionstilldelningar").doc(request.auth.uid).set({
        uid: request.auth.uid,
        namn,
        organisationId: inbjudanOrganisationId,
        sparId: spar.id,
        sparNamn: spar.data().namn,
        malRoll: inbjudanRoll,
        tilldelad: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  } catch (fel) {
    console.error("Automatisk tilldelning av introduktionsspår misslyckades:", fel);
  }

  return { ok: true };
});

// Etapp 61a: exporteras för de domänfiler som anropar dem över filgränsen
// (se index.js – dessa åter-exporteras INTE därifrån, de var aldrig exports förut).
exports.skapaInbjudanIntern = skapaInbjudanIntern;

// Exporterad enbart för tests/functions/epost.test.cjs – se kommentaren ovan.
exports._byggInbjudningsmejl = byggInbjudningsmejl;
