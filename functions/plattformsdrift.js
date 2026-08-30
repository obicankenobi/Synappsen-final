// plattformsdrift.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: plattformsnivåns drift och support: e-postnödstoppet, backupstatus,
// organisationsdiagnostik, engångsmigreringar och plattformsadminrollen.

const {
  admin,
  db,
  bucket,
  onCall,
  HttpsError,
  STANDARD_ORG,
  hamtaAnvandarInfo,
  loggaRevision,
  kravPlattformsadmin,
} = require("./gemensamt");
const { kravLasningAvRevisionslogg } = require("./revisionslogg");
const crypto = require("node:crypto");

// Etapp L1m: sentinelvärdet som gör ett leverantörskonto organisationslöst. Matchar ingen
// organisation, så isoleringen blir en följd av VARJE befintlig organisationsgrindad regel
// (de jämför alla mot minOrganisation()) – inget nytt undantag behöver skrivas i dem.
// Samma "_"-konvention som "_plattform" redan använder i loggaRevision (Etapp 32c) för att
// markera "det här är inte en riktig kund".
const PLATTFORMSORGANISATION = "_plattform";

// Plattformsadminens globala nödstopp – ingen kod, ingen deploy, bara en knapptryckning för
// att stänga av (eller sätta på igen) ALL utgående e-post oavsett vilken funktion som
// försöker skicka. Se genomgående krav 17: en irreversibel/potentiellt skadlig handling ska
// kräva dubbel bekräftelse i UI:t (byggs i /leverantor, se Etapp 53a:s "Genomfört" nedan).
exports.angeEpostAvstangd = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const avstangd = request.data?.avstangd === true;
  await db.collection("systemstatus").doc("epost").set(
    {
      avstangd,
      andradAv: request.auth.uid,
      andradTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  await loggaRevision({
    organisationId: "_plattform",
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: avstangd ? "epost_avstangd_globalt" : "epost_paslagen_globalt",
    sammanfattning: avstangd
      ? "All utgående e-post stängdes av globalt (nödstopp)."
      : "Utgående e-post slogs på igen globalt.",
  });
  return { avstangd };
});

// Etapp 46: gör "senaste backup" till något en superadmin kan se i adminpanelen istället för
// att behöva leta i Firebase Storage-konsolen (vilket `INCIDENT-CHECKLISTA.md` steg 8
// tidigare krävde). Storage-listningen kräver Admin SDK (klienten har ingen läsrätt alls till
// backups/, se storage.rules) – därför en egen callable, inte en direkt Firestore-fråga.
// Återanvänder samma auth-upplösning som revisionsloggens callables (superadmin i egen
// organisation, eller plattformsadmin med ett angivet orgId).
async function hamtaBackupstatusForOrg(organisationId) {
  const orgDoc = await db.collection("organisationer").doc(organisationId).get();
  const harOperationsModul = orgDoc.data()?.moduler?.operations === true;

  if (!harOperationsModul) {
    return { harOperationsModul: false, senasteDatum: null, antalBackuper: 0 };
  }

  const [filer] = await bucket.getFiles({ prefix: `backups/${organisationId}/` });
  const datum = filer
    .map((fil) => fil.name.match(/^backups\/[^/]+\/(\d{4}-\d{2}-\d{2})\.json$/)?.[1])
    .filter(Boolean)
    .sort();

  return {
    harOperationsModul: true,
    senasteDatum: datum.length > 0 ? datum[datum.length - 1] : null,
    antalBackuper: datum.length,
  };
}

exports.hamtaBackupstatus = onCall({ region: "europe-west1" }, async (request) => {
  const organisationId = await kravLasningAvRevisionslogg(request, request.data?.organisationId);
  return hamtaBackupstatusForOrg(organisationId);
});

// Etapp 50a: strukturell hälsodiagnostik per organisation för leverantörsvyn – "kan en
// supportfråga besvaras utan att gissa, och utan stående åtkomst till kundinnehåll?".
// Returnerar MEDVETET bara antal och tidpunkter, aldrig dokumentinnehåll (krav 13).
// Premisskontroll (ETAPPLAN10.md §50a): 32a:s permission-denied-rapportering går bara till
// Sentry (klientsidan) – det finns ingen serverbar väg att läsa Sentrys händelsedatabas utan
// ett separat API-token, samma blockering som redan är dokumenterad för 32b:s tre kvarvarande
// larmtyper. "Felfrekvens" är därför MEDVETET UTELÄMNAD här, inte bortglömd – se
// OPPNA-PUNKTER.md/ETAPPLAN5.md §32b för samma öppna punkt. "Senaste skrivning" byggs inte
// heller på en ny tidsstämpel per collection (skulle kräva att ändra alla skrivvägar i hela
// appen) utan på den redan existerande revisionsloggen, som redan fångar de bokförda
// innehållshändelserna (rutin_publicerad/rutin_godkand/rutin_borttagen m.fl.) – "senaste
// loggade händelse", inte en fullständig senaste-skrivning-garanti.
const DIAGNOSTIK_COLLECTIONS = ["rutiner", "forradsartiklar", "anslag", "kontakter"];

exports.hamtaOrganisationsdiagnostik = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { orgId } = request.data ?? {};
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }

  const [antalPerCollection, senasteHandelseSnap, backupstatus] = await Promise.all([
    Promise.all(
      DIAGNOSTIK_COLLECTIONS.map(async (namn) => {
        const agg = await db.collection(namn).where("organisationId", "==", orgId).count().get();
        return [namn, agg.data().count];
      })
    ),
    db
      .collection("revisionslogg")
      .where("organisationId", "==", orgId)
      .orderBy("tidpunkt", "desc")
      .limit(1)
      .get(),
    hamtaBackupstatusForOrg(orgId),
  ]);

  const senasteHandelseDoc = senasteHandelseSnap.empty ? null : senasteHandelseSnap.docs[0].data();

  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "organisation_diagnostik_visad",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Leverantören visade strukturell diagnostik (antal/status, inget innehåll)",
  });

  return {
    antalDokument: Object.fromEntries(antalPerCollection),
    senasteHandelse: senasteHandelseDoc
      ? { tidpunkt: senasteHandelseDoc.tidpunkt, handelsetyp: senasteHandelseDoc.handelsetyp }
      : null,
    backupstatus,
    felfrekvensTillganglig: false,
  };
});

// Etapp 1 (multi-tenant-grund) – engångsmigrering: sätter organisationId = STANDARD_ORG på
// alla dokument som saknar det. Idempotent (hoppar över dokument som redan har fältet), så
// den kan köras flera gånger utan risk. Kör ALLTID med dryRun (standard) först och verifiera
// antalet mot förväntan innan den körs skarpt – se ETAPP1-ARBETSUPPGIFTER.md block 1b.
// klinikfragecache migreras medvetet INTE – cachenycklar är redan organisationsnamngivna för
// nya svar, och gamla omigrerade cache-poster upphör bara att träffas och byggs om naturligt.
const MIGRERBARA_COLLECTIONS = [
  "users",
  "rutiner",
  "forradsartiklar",
  "anslag",
  "kommentarer",
  "feedback",
  "klinikfragefeedback",
  "klinikfrageloggar",
  "sokloggar",
  "auditlogg",
  "visningar",
  "skiftrapporter",
  "kontakter",
  "lankbibliotek",
  "anteckningar",
];

exports.migreraTillOrganisation = onCall(
  { region: "europe-west1", timeoutSeconds: 540 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    const { roll } = await hamtaAnvandarInfo(request.auth.uid);
    if (roll !== "superadmin") {
      throw new HttpsError("permission-denied", "Endast superadmin kan köra migreringen.");
    }

    const dryRun = request.data?.dryRun !== false;

    if (!dryRun) {
      await db
        .collection("organisationer")
        .doc(STANDARD_ORG)
        .set(
          {
            namn: "Standardorganisation",
            status: "active",
            plan: "core",
            moduler: { operations: true, intelligence: true },
          },
          { merge: true }
        );
    }

    const resultat = {};
    for (const samling of MIGRERBARA_COLLECTIONS) {
      const snap = await db.collection(samling).get();
      const attSkriva = snap.docs.filter((d) => !d.data().organisationId).map((d) => d.ref);
      resultat[samling] = { totalt: snap.size, saknarOrganisationId: attSkriva.length };

      if (!dryRun) {
        for (let i = 0; i < attSkriva.length; i += 500) {
          const batch = db.batch();
          attSkriva
            .slice(i, i + 500)
            .forEach((ref) => batch.set(ref, { organisationId: STANDARD_ORG }, { merge: true }));
          await batch.commit();
        }
      }
    }
    return { dryRun, resultat };
  }
);

// Etapp 60c (ETAPPLAN12.md): engångsmigrering inför att useRutiner.js:s klientfråga bytte
// från att hämta ALLA rutiner (inkl. papperskorgen) och filtrera bort de borttagna i
// JavaScript, till att filtrera server-side med where("borttagen", "==", false). En
// ojämlikhetsfråga (where("borttagen", "!=", true)) hade varit fel här av precis samma skäl
// som redan är dokumenterat i kontrolleraKvitteringsfrister ovan: Firestore utesluter
// dokument som saknar fältet HELT, inte bara de som har det satt till true – och `borttagen`
// har hittills bara satts VID radering, aldrig till `false` vid skapande. En likhetsfråga
// (`== false`) kräver därför att ALLA befintliga rutiner backfillas till `borttagen: false`
// INNAN klienten börjar fråga så, annars försvinner tyst varje rutin som skapades före det
// här datumet ur alla listor. Idempotent (hoppar dokument som redan har fältet) och kör
// ALLTID med dryRun (standard) först, samma mönster som migreraTillOrganisation ovan.
exports.backfillaBorttagenFalt = onCall(
  { region: "europe-west1", timeoutSeconds: 540 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
    }
    await kravPlattformsadmin(request.auth.uid);

    const dryRun = request.data?.dryRun !== false;

    const snap = await db.collection("rutiner").select("borttagen").get();
    const attSkriva = snap.docs.filter((d) => d.data().borttagen === undefined).map((d) => d.ref);

    if (!dryRun) {
      for (let i = 0; i < attSkriva.length; i += 500) {
        const batch = db.batch();
        attSkriva.slice(i, i + 500).forEach((ref) => batch.set(ref, { borttagen: false }, { merge: true }));
        await batch.commit();
      }
    }

    return { dryRun, totaltAntalRutiner: snap.size, saknarBorttagenFalt: attSkriva.length };
  }
);

// ---------------------------------------------------------------------------------------
// Etapp 6 (kund nummer två): leverantörsadmin, organisationsetablering och ett
// inbjudningsflöde som ersätter den tidigare öppna självbetjänings-registreringen.
// Se ETAPPLAN2.md Etapp 6 och firestore.rules (arPlattformsadmin, organisationenArAktiv).
// ---------------------------------------------------------------------------------------


// Engångsbootstrap: fungerar ENDAST innan någon leverantörsadmin finns alls, och kräver då
// att anroparen redan är superadmin i sin egen organisation (stoppar en godtycklig
// nyregistrerad från att bootstrappa sig själv till leverantörsadmin i en tom installation).
// Efter den första finns är detta anrop permanent stängt – gorTillPlattformsadmin används då.
exports.blibForstaPlattformsadmin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { roll } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast en superadmin kan bootstrappa den första leverantörsadmin-kontot.");
  }
  const befintliga = await db.collection("plattformsadmin").limit(1).get();
  if (!befintliga.empty) {
    throw new HttpsError(
      "failed-precondition",
      "Det finns redan minst en leverantörsadmin. Be en befintlig leverantörsadmin om åtkomst istället."
    );
  }
  await db.collection("plattformsadmin").doc(request.auth.uid).set({
    blevPlattformsadmin: admin.firestore.FieldValue.serverTimestamp(),
    satteSig: request.auth.uid,
  });
  return { ok: true };
});

// Låter en BEFINTLIG leverantörsadmin utse fler – normalfallet efter bootstrap.
exports.gorTillPlattformsadmin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);
  const { uid } = request.data ?? {};
  if (!uid || typeof uid !== "string") {
    throw new HttpsError("invalid-argument", "uid krävs.");
  }
  await db.collection("plattformsadmin").doc(uid).set({
    blevPlattformsadmin: admin.firestore.FieldValue.serverTimestamp(),
    satteSig: request.auth.uid,
  });
  return { ok: true };
});

// Etapp L1m, delmål 1: skapar ett HELT NYTT leverantörskonto, organisationslöst från start.
// Behövs eftersom users/{uid} har `allow create: if false` och den enda andra vägen in,
// losInInbjudan, ALLTID binder det nya kontot till inbjudarens organisation – det finns ingen
// befintlig väg att skapa ett konto som aldrig tillhör en kundorganisation alls.
//
// Ingen e-post skickas (utgående e-post är dessutom stoppat, se PUB_AVTAL_BREVO_TECKNAT i
// gemensamt.js) – ett engångslösenord genereras och returneras EN GÅNG i svaret, för att
// delas manuellt med den nya leverantörsadminen. Det lagras ALDRIG, varken i Firestore eller
// i revisionsloggen.
exports.skapaLeverantorskonto = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const epost = (request.data?.epost ?? "").trim().toLowerCase();
  const namn = (request.data?.namn ?? "").trim();
  if (!epost || !epost.includes("@")) {
    throw new HttpsError("invalid-argument", "En giltig e-postadress krävs.");
  }
  if (!namn) {
    throw new HttpsError("invalid-argument", "Ett namn krävs.");
  }

  // 24 slumpmässiga byte, url-säker text – rikligt över vad ett engångslösenord som visas
  // en gång och sedan aldrig lagras behöver vara.
  const engangsLosenord = crypto.randomBytes(24).toString("base64url");

  const authAnvandare = await admin.auth().createUser({
    email: epost,
    password: engangsLosenord,
    displayName: namn,
  });

  await db.collection("users").doc(authAnvandare.uid).set({
    namn,
    email: epost,
    role: "superadmin",
    organisationId: PLATTFORMSORGANISATION,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  await db.collection("plattformsadmin").doc(authAnvandare.uid).set({
    blevPlattformsadmin: admin.firestore.FieldValue.serverTimestamp(),
    satteSig: request.auth.uid,
  });

  await loggaRevision({
    organisationId: PLATTFORMSORGANISATION,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "leverantorskonto_skapat",
    objektTyp: "users",
    objektId: authAnvandare.uid,
    sammanfattning: `Nytt leverantörskonto skapat för ${namn} (${epost})`,
  });

  return { uid: authAnvandare.uid, engangsLosenord };
});

// Etapp L1m, delmål 4 (beslutspunkt 6: flytta det BEFINTLIGA kontot, inte skapa ett nytt).
// Flyttar den ANROPANDES EGET konto till den organisationslösa modellen. Medvetet begränsad
// till självbetjäning – ingen generell "byt vem som helsts organisation"-funktion, som hade
// varit ett mycket bredare och farligare verktyg än vad den här migreringen kräver.
//
// Kräver att anroparen REDAN är plattformsadmin (annars kunde vem som helst med rätt gissning
// fly sin egen organisations dataisolering). Idempotent – ett andra anrop är en no-op.
exports.flyttaTillPlattformskonto = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const { organisationId: foregaendeOrganisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (foregaendeOrganisationId === PLATTFORMSORGANISATION) {
    return { ok: true, redanFlyttat: true };
  }

  await db.collection("users").doc(request.auth.uid).set(
    { organisationId: PLATTFORMSORGANISATION },
    { merge: true }
  );

  // Loggas mot BÅDA kedjorna: den gamla organisationen ska kunna se att kontot lämnade den
  // (krav 38 gäller retroaktivt lika mycket som framåt), och den nya (tomma) kedjan får sin
  // första post.
  await loggaRevision({
    organisationId: foregaendeOrganisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "superadmin",
    handelsetyp: "konto_flyttat_till_plattform",
    objektTyp: "users",
    objektId: request.auth.uid,
    sammanfattning: "Kontot flyttades till leverantörens organisationslösa modell (Etapp L1m)",
  });
  await loggaRevision({
    organisationId: PLATTFORMSORGANISATION,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "konto_flyttat_till_plattform",
    objektTyp: "users",
    objektId: request.auth.uid,
    sammanfattning: `Konto flyttat hit från ${foregaendeOrganisationId}`,
  });

  return { ok: true, redanFlyttat: false, foregaendeOrganisationId };
});

// Etapp L1g (intern/ETAPPLAN-INTERN-1.md): leverantörens EGEN åtgärdslogg, tvärs alla
// kundorganisationer. Åtgärder mot en kund loggas redan (och ska fortsätta loggas) i
// KUNDENS egen hashkedja – kedjorna är per organisation och slås ALDRIG ihop här (det skulle
// bryta varje kunds kedjeverifiering). Det här är en REN läsvy ovanpå den redan existerande
// `revisionslogg`-collectionen (top-level, inte en underkollektion – se firestore.rules),
// filtrerad på den anropandes eget uid. Ingen ny logg, ingen andra sanning (krav 39).
exports.hamtaLeverantorsAtgardslogg = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const gransRaw = request.data?.limit;
  const grans = Number.isInteger(gransRaw) && gransRaw > 0 && gransRaw <= 200 ? gransRaw : 100;

  const snap = await db
    .collection("revisionslogg")
    .where("aktorUid", "==", request.auth.uid)
    .where("aktorRoll", "==", "plattformsadmin")
    .orderBy("tidpunkt", "desc")
    .limit(grans)
    .get();

  return { poster: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});

// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): leverantörens sida av `leverantorsfeedback`
// (skriven av skickaLeverantorsfeedback i organisationsadmin.js) – en EGEN kanal, skild från
// kundens interna `feedback`-collection. Tvärs alla organisationer, precis som
// hamtaLeverantorsAtgardslogg ovan.
exports.hamtaLeverantorsfeedback = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const snap = await db.collection("leverantorsfeedback").orderBy("skapad", "desc").limit(200).get();

  return {
    poster: snap.docs.map((d) => {
      const data = d.data();
      return { id: d.id, ...data, skapad: data.skapad?.toDate?.().toISOString() ?? null };
    }),
  };
});

exports.markeraLeverantorsfeedbackLast = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const id = request.data?.id;
  if (!id || typeof id !== "string") {
    throw new HttpsError("invalid-argument", "id krävs.");
  }
  await db.collection("leverantorsfeedback").doc(id).update({ last: true });
  return { ok: true };
});

// Etapp L1b (intern/ETAPPLAN-INTERN-1.md), block 6 "Historik": SAMMA data som
// hamtaLeverantorsAtgardslogg ovan, men filtrerad till EN organisation i stället för tvärs
// alla – "kundens revisionslogg filtrerad på leverantörens egna åtgärder, så det syns vad VI
// gjort hos just den här kunden". `revisionslogg` kräver annars ett aktivt supportfönster för
// en plattformsadmin (krav 37) – men det gäller kundens EGNA poster, inte leverantörens.
// Att en leverantör kan se sina EGNA tidigare åtgärder mot en kund är symmetriskt med krav 38
// ("kunden ska kunna se vad leverantören gjort") och läcker ingen ny kundinformation.
exports.hamtaKundensLeverantorshistorik = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const orgId = request.data?.orgId;
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }

  const snap = await db
    .collection("revisionslogg")
    .where("organisationId", "==", orgId)
    .where("aktorRoll", "==", "plattformsadmin")
    .orderBy("tidpunkt", "desc")
    .limit(100)
    .get();

  return { poster: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
});
