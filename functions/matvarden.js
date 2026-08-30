// matvarden.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: mätvärden och rapportering: veckovis snapshot av nyckeltalen,
// månadssammanfattningar, personalpuls och referensunderlaget.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const Sentry = require("@sentry/node");
const {
  admin,
  db,
  onCall,
  HttpsError,
  BREVO_API_KEY,
  APP_URL,
  hamtaAnvandarInfo,
  skickaEpost,
  loggaRevision,
  hamtaAnvandareForEpostPaminnelse,
  kravPlattformsadmin,
} = require("./gemensamt");

// Etapp 39a: veckovis ögonblicksbild av nyckeltalen, så en trend kan visas i stället för bara
// ett ögonblicksvärde. Insamlingen byggs medvetet FÖRE en riktig visning – varje vecka utan
// snapshot är historik som aldrig går att skapa i efterhand.
//
// beraknaHalsaServer() är en avsiktlig, minimal DUPLICERING av logiken i
// src/utils/innehallshalsa.js (klientens ESM-modul kan inte importeras rakt av i denna
// CommonJS-miljö) – samma mönster som firestore.rules redan har flera exempel på (klient-
// och regellogik hålls medvetet i synk manuellt, med kommentarer som pekar på originalet).
function beraknaHalsaServer(rutiner) {
  const nu = Date.now();
  const GRANSKNINGSINTERVALL_MS = 180 * 24 * 60 * 60 * 1000;
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  if (godkanda.length === 0) return null;
  let utanFlaggor = 0;
  for (const r of godkanda) {
    const granskadMs = r.granskadDatum?.toMillis ? r.granskadDatum.toMillis() : null;
    const passeratGranskning = granskadMs !== null && nu - granskadMs > GRANSKNINGSINTERVALL_MS;
    const saknarAgare = !r.agare;
    const aldrigKvitterad = !Array.isArray(r.lasteAv) || r.lasteAv.length === 0;
    const obesvaradKallvarning = r.kallVarning === true;
    const utgangen = Boolean(r.utgangsdatum) && new Date(r.utgangsdatum).getTime() < nu;
    if (!passeratGranskning && !saknarAgare && !aldrigKvitterad && !obesvaradKallvarning && !utgangen) {
      utanFlaggor++;
    }
  }
  return Math.round((utanFlaggor / godkanda.length) * 100);
}
exports.beraknaHalsaServer = beraknaHalsaServer;

function kvitteringsgradServer(rutiner, antalAnvandare) {
  const godkanda = rutiner.filter((r) => r.status === "godkand" && r.arkiverad !== true);
  if (godkanda.length === 0 || antalAnvandare === 0) return null;
  const summa = godkanda.reduce((sum, r) => sum + (r.lasteAv?.length ?? 0) / antalAnvandare, 0);
  return Math.round((summa / godkanda.length) * 100);
}
exports.kvitteringsgradServer = kvitteringsgradServer;

async function skapaMatvardenSnapshot() {
  const orgSnap = await db.collection("organisationer").get();
  const datum = new Date().toISOString().slice(0, 10);
  for (const orgDoc of orgSnap.docs) {
    const orgId = orgDoc.id;
    try {
      const [klinRutinSnap, adminRutinSnap, anvandareSnap, soksnap, checklistSnap] = await Promise.all([
        db.collection("rutiner").where("organisationId", "==", orgId).where("omrade", "==", "kliniskt-stod").get(),
        db.collection("rutiner").where("organisationId", "==", orgId).where("omrade", "==", "administration").get(),
        db.collection("users").where("organisationId", "==", orgId).select().get(),
        db.collection("soksstatistik").doc(orgId).get(),
        db.collection("checklistkorningar").where("organisationId", "==", orgId).get(),
      ]);

      const klinRutiner = klinRutinSnap.docs.map((d) => d.data());
      const adminRutiner = adminRutinSnap.docs.map((d) => d.data());
      const antalAnvandare = anvandareSnap.size;

      const soksdata = soksnap.exists ? soksnap.data() : {};
      const andelNollTraffar =
        soksdata.totaltAntalSokningar > 0
          ? Math.round((soksdata.antalNollTraffar / soksdata.totaltAntalSokningar) * 100)
          : null;
      const tidAttHittaSekunder =
        soksdata.antalTidmatningar > 0
          ? Math.round(soksdata.totalTidTillKlickMs / soksdata.antalTidmatningar / 1000)
          : null;

      const antalChecklistkorningar = checklistSnap.docs.reduce((sum, d) => sum + (d.data().antalPaborjade ?? 0), 0);

      await db
        .collection("organisationer")
        .doc(orgId)
        .collection("matvardenSnapshots")
        .doc(datum)
        .set({
          datum,
          kvitteringsgradKlinisktStod: kvitteringsgradServer(klinRutiner, antalAnvandare),
          kvitteringsgradAdministration: kvitteringsgradServer(adminRutiner, antalAnvandare),
          andelNollTraffar,
          tidAttHittaSekunder,
          antalChecklistkorningar,
          innehallshalsaKlinisktStod: beraknaHalsaServer(klinRutiner),
          innehallshalsaAdministration: beraknaHalsaServer(adminRutiner),
          skapad: admin.firestore.FieldValue.serverTimestamp(),
        });
    } catch (fel) {
      console.error(`Mätvärdessnapshot misslyckades för organisation ${orgId}:`, fel);
    }
  }
}
exports.skapaMatvardenSnapshot = skapaMatvardenSnapshot;

exports.matvardenSnapshotSchemalagt = onSchedule(
  { schedule: "every monday 02:00", timeZone: "Europe/Stockholm", region: "europe-west1", timeoutSeconds: 300 },
  skapaMatvardenSnapshot
);

// Etapp L1c (beslutspunkt 1, avgjord 2026-08-30, väg B): leverantören får läsa en kunds
// mätvärdesAGGREGAT utan ett aktivt supportfönster – men bara via den här spårbara,
// avgränsade vägen, aldrig genom att lossa firestore.rules rakt av (väg A, avvisad). Returnerar
// ENDAST de redan aggregerade fälten som skapaMatvardenSnapshot() räknar fram ovan – ingen
// enskild rutin, inget användarnamn, ingen sökfråga. Varje anrop revisionsloggas mot KUNDENS
// egen kedja (inte "_plattform") så kunden ser i sin egen historik att aggregaten lästs, precis
// som ett supportfönster redan hade synts.
exports.hamtaKundmatvarden = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kravPlattformsadmin(request.auth.uid);

  const orgId = request.data?.orgId;
  if (!orgId || typeof orgId !== "string") {
    throw new HttpsError("invalid-argument", "orgId krävs.");
  }

  const snap = await db
    .collection("organisationer")
    .doc(orgId)
    .collection("matvardenSnapshots")
    .orderBy("datum", "desc")
    .limit(12)
    .get();

  const snapshots = snap.docs
    .map((d) => {
      const data = d.data();
      return {
        datum: data.datum,
        kvitteringsgradKlinisktStod: data.kvitteringsgradKlinisktStod ?? null,
        kvitteringsgradAdministration: data.kvitteringsgradAdministration ?? null,
        andelNollTraffar: data.andelNollTraffar ?? null,
        tidAttHittaSekunder: data.tidAttHittaSekunder ?? null,
        antalChecklistkorningar: data.antalChecklistkorningar ?? null,
        innehallshalsaKlinisktStod: data.innehallshalsaKlinisktStod ?? null,
        innehallshalsaAdministration: data.innehallshalsaAdministration ?? null,
      };
    })
    .reverse(); // äldst först, för en trendkurva

  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "plattform_matvarden_lasta",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: `Leverantören läste ${snapshots.length} veckors mätvärdesaggregat`,
  });

  return { snapshots };
});

// Etapp 53d: en kundvänd månadssammanfattning, byggd ovanpå de befintliga veckovisa
// matvardenSnapshots (Etapp 39a) – ingen ny mätpunkt, bara en ny mottagare för en siffra som
// redan räknas ut. Skickas till organisationens superadmin(ar). Innehåller ENDAST aggregerade
// procenttal/antal, aldrig ett organisationsnamn (genomgående krav 18 – 53b:s namn-undantag
// gäller uttryckligen bara inbjudningsmejlet, inget annat), aldrig en rutintitel eller annat
// verksamhetsinnehåll.
async function skickaManadssammanfattningar() {
  const orgSnap = await db.collection("organisationer").get();
  for (const orgDoc of orgSnap.docs) {
    const data = orgDoc.data();
    // Etapp 51: en demo-organisation är aldrig en riktig kund. En pausad organisation har
    // redan tackat nej till fortsatt drift – att ändå mejla den vore fel signal.
    if (data.arDemo === true || data.status === "pausad") continue;
    try {
      const [snapshotSnap, forslagSnap] = await Promise.all([
        orgDoc.ref.collection("matvardenSnapshots").orderBy("datum", "desc").limit(1).get(),
        db
          .collection("andringsforslag")
          .where("organisationId", "==", orgDoc.id)
          .where("status", "==", "ny")
          .get(),
      ]);
      if (snapshotSnap.empty) continue; // inget mätvärde ännu – inget att sammanfatta

      const mottagare = await hamtaAnvandareForEpostPaminnelse(
        orgDoc.id,
        (a) => a.role === "superadmin",
        "manadsrapport"
      );
      if (mottagare.length === 0) continue;

      const snapshot = snapshotSnap.docs[0].data();
      const rader = [];
      if (snapshot.kvitteringsgradKlinisktStod != null) {
        rader.push(`Kvitteringsgrad, Kliniskt stöd: ${snapshot.kvitteringsgradKlinisktStod}%`);
      }
      if (snapshot.kvitteringsgradAdministration != null) {
        rader.push(`Kvitteringsgrad, Administration: ${snapshot.kvitteringsgradAdministration}%`);
      }
      if (snapshot.innehallshalsaKlinisktStod != null) {
        rader.push(`Innehållshälsa, Kliniskt stöd: ${snapshot.innehallshalsaKlinisktStod}%`);
      }
      if (snapshot.innehallshalsaAdministration != null) {
        rader.push(`Innehållshälsa, Administration: ${snapshot.innehallshalsaAdministration}%`);
      }
      rader.push(`Obesvarade ändringsförslag: ${forslagSnap.size}`);

      for (const mottagarInfo of mottagare) {
        try {
          await skickaEpost({
            till: mottagarInfo.email,
            amne: "Din månadssammanfattning från Synappsen",
            text: `${rader.join("\n")}\n\nSe hela ledningsrapporten: ${APP_URL}/ledningsrapport`,
            organisationId: orgDoc.id,
          });
        } catch (fel) {
          // Adressen utelämnas medvetet ur loggen – se motiveringen i skickaEpost (gemensamt.js).
          console.warn(`Månadssammanfattning kunde inte skickas (org ${orgDoc.id}):`, fel.message ?? fel);
        }
      }
    } catch (fel) {
      console.error(`Månadssammanfattning misslyckades för organisation ${orgDoc.id}:`, fel);
      Sentry.captureException(fel);
    }
  }
}
exports.skickaManadssammanfattningar = skickaManadssammanfattningar;

exports.skickaManadssammanfattningarSchemalagt = onSchedule(
  {
    schedule: "1 of month 09:00",
    timeZone: "Europe/Stockholm",
    region: "europe-west1",
    timeoutSeconds: 300,
    secrets: [BREVO_API_KEY],
  },
  skickaManadssammanfattningar
);

// Etapp 39c: anonym personalpuls. "Anonym" bygger på att INGET enskilt svar någonsin skrivs
// någonstans – bara aggregerade summor (FieldValue.increment) i en per-område-per-kvartal-
// collection som är Cloud-Function-only (samma mönster som matvardenSnapshots), plus en enda
// flagga på användarens EGET dokument som bara säger "redan svarat detta kvartal" (inget om
// VAD personen svarade). Dubbelinskick förhindras i en transaktion så att flaggkontroll och
// increment sker atomiskt.
function beraknaKvartal(datum = new Date()) {
  const kvartal = Math.floor(datum.getMonth() / 3) + 1;
  return `${datum.getFullYear()}-Q${kvartal}`;
}
exports.beraknaKvartal = beraknaKvartal;

const GILTIGA_PERSONALPULS_OMRADEN = ["kliniskt-stod", "administration", "logistik"];

exports.svaraPersonalpuls = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { omrade, svar1, svar2, svar3 } = request.data ?? {};
  if (!GILTIGA_PERSONALPULS_OMRADEN.includes(omrade)) {
    throw new HttpsError("invalid-argument", "Ogiltigt område.");
  }
  const arGiltigtSvar = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
  if (!arGiltigtSvar(svar1) || !arGiltigtSvar(svar2) || !arGiltigtSvar(svar3)) {
    throw new HttpsError("invalid-argument", "Varje svar måste vara ett heltal 1–5.");
  }

  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll === "kiosk") {
    // Etapp 55: personalpulsen mäter enskilda medarbetares upplevelse – ett delat
    // kioskkonto är ingen person och ska inte kunna svara (genomgående krav 19).
    throw new HttpsError("permission-denied", "Kioskläge kan inte svara på personalpulsen.");
  }
  const kvartal = beraknaKvartal();
  const userRef = db.collection("users").doc(request.auth.uid);
  const resultatRef = db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("personalpulsResultat")
    .doc(`${omrade}_${kvartal}`);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (userSnap.data()?.personalpulsSenastBesvarad === kvartal) {
      throw new HttpsError("already-exists", "Du har redan svarat på personalpulsen detta kvartal.");
    }
    tx.set(
      resultatRef,
      {
        omrade,
        kvartal,
        antalSvar: admin.firestore.FieldValue.increment(1),
        summaFraga1: admin.firestore.FieldValue.increment(svar1),
        summaFraga2: admin.firestore.FieldValue.increment(svar2),
        summaFraga3: admin.firestore.FieldValue.increment(svar3),
        senastUppdaterad: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    tx.update(userRef, { personalpulsSenastBesvarad: kvartal });
  });

  return { ok: true };
});

// Etapp 39d: referensunderlag för säljmaterial. Ägarbeslut 2026-08-02: anonymiserat – kundens
// namn/organisationId får ALDRIG förekomma i den data som returneras till klienten, och
// medgivandet ska bekräftas AKTIVT i varje enskild export (samtycke==true skickas av klienten
// varje gång, sparas inte som en förutsättning en gång för alla) samt loggas i revisionsloggen.
exports.exporteraReferensunderlag = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan exportera referensunderlag.");
  }
  if (request.data?.samtycke !== true) {
    throw new HttpsError(
      "failed-precondition",
      "Kundens uttryckliga medgivande måste bekräftas aktivt innan export."
    );
  }

  const orgId = uppringare.organisationId;
  const [snapshotSnap, anvandareSnap] = await Promise.all([
    db
      .collection("organisationer")
      .doc(orgId)
      .collection("matvardenSnapshots")
      .orderBy("datum", "desc")
      .limit(1)
      .get(),
    db.collection("users").where("organisationId", "==", orgId).select().get(),
  ]);
  const senaste = snapshotSnap.empty ? null : snapshotSnap.docs[0].data();

  // Medvetet INGA fält här som kan identifiera kunden (namn, orgnr, orgId) – anonymiseringen
  // sitter i vilka fält som SAKNAS i det här objektet, inte i en efterbehandling.
  const underlag = {
    antalAnstallda: anvandareSnap.size,
    kvitteringsgradKlinisktStod: senaste?.kvitteringsgradKlinisktStod ?? null,
    kvitteringsgradAdministration: senaste?.kvitteringsgradAdministration ?? null,
    andelNollTraffar: senaste?.andelNollTraffar ?? null,
    tidAttHittaSekunder: senaste?.tidAttHittaSekunder ?? null,
    innehallshalsaKlinisktStod: senaste?.innehallshalsaKlinisktStod ?? null,
    genererad: new Date().toISOString().slice(0, 10),
  };

  await loggaRevision({
    organisationId: orgId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "referensunderlag_exporterat",
    objektTyp: "organisationer",
    objektId: orgId,
    sammanfattning: "Anonymiserat referensunderlag exporterat (kundens medgivande bekräftat aktivt i exportflödet)",
  });

  return underlag;
});
