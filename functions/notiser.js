// notiser.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: notiser och påminnelser: Firestore-triggers för rutiner/bristanmälningar/
// granskningsrundor, kvitterings- och förslagspåminnelser samt tömningen av e-postkön.

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const {
  admin,
  db,
  BREVO_API_KEY,
  KAN_HANTERA_FORRAD,
  APP_URL,
  skickaEpost,
  loggaRevision,
  skickaPush,
  hamtaAnvandareMedPushPreferens,
  hamtaAnvandareForEpostPaminnelse,
  koaEpostPaminnelse,
  hamtaRollForAktor,
} = require("./gemensamt");

// Kärnlogiken är en egen, direkt anropbar funktion (inte bara triggerns callback) av samma
// skäl som backupaOrganisation/loggaRevision exporteras separat: `test:functions` kör bara
// firestore+storage-emulatorerna, INTE functions-emulatorn, så en riktig
// onDocumentCreated/onDocumentUpdated-trigger utlöses aldrig i testerna – bara den
// underliggande logiken kan testas direkt.

// Fångar det fall en rutin skapas SOM redan godkänd (en VÖL/superadmin som inte behöver
// eget godkännande, se kraverGodkannande i useRutiner.js) – det finns då ingen separat
// "godkännande"-skrivning att fånga med en update-trigger.
async function hanteraRutinSkapad(data, rutinId) {
  if (data.status !== "godkand") return;
  await loggaRevision({
    organisationId: data.organisationId ?? "default",
    aktorUid: data.skapadAv ?? null,
    aktorRoll: await hamtaRollForAktor(data.skapadAv),
    handelsetyp: "rutin_publicerad",
    objektTyp: "rutiner",
    objektId: rutinId,
    sammanfattning: `Rutin publicerad direkt vid skapande: ${data.titel ?? "(namnlös)"}`,
  });
  await skickaPushForNyRutin(data.organisationId ?? "default", data.omrade, data.skapadAv);
}

// Etapp 24b: "ny/ändrad rutin inom mitt område" – premisskontroll (genomgående krav 8): det
// finns inget användarfält som binder en person till ett specifikt omrade (`kliniskt-stod`/
// `administration`), bara rollbaserad redigeringsbehörighet (se farRedigeraOmrade i
// firestore.rules). En riktig områdesfiltrering hade därför krävt en ny datamodell för
// "vilket område jobbar jag i", vilket inte finns idag. Förenklat till hela organisationen
// istället – dokumenterat som en avsiktlig avgränsning i ETAPPLAN4.md.
async function skickaPushForNyRutin(organisationId, omrade, skapadAv) {
  const mottagare = await hamtaAnvandareMedPushPreferens(
    organisationId,
    "nyRutin",
    (a) => a.id !== skapadAv
  );
  await skickaPush(mottagare, {
    titel: omrade === "administration" ? "Ny rutin i Administration" : "Ny rutin i Kliniskt stöd",
    body: "Det finns en ny eller ändrad rutin att läsa.",
    url: omrade === "administration" ? "/administration" : "/kliniskt-stod",
  });
}

// Etapp 24b: "källvarning till rutinens ägare" – agare är antingen { typ: "person", uid } eller
// { typ: "roll", roll } (se RutinFormular.jsx). Ingen fritext (rutinens titel räcker som
// generisk identifiering, samma nivå av detalj som redan syns i appens egen notisklocka).
async function skickaPushForKallvarning(organisationId, agare, titel, rutinId) {
  if (!agare) return;
  let mottagare;
  if (agare.typ === "person" && agare.uid) {
    mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "kallVarning", (a) => a.id === agare.uid);
  } else if (agare.typ === "roll" && agare.roll) {
    mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "kallVarning", (a) => a.role === agare.roll);
  } else {
    return;
  }
  await skickaPush(mottagare, {
    titel: "Källvarning på en rutin du äger",
    body: `Källan till "${titel ?? "en rutin"}" verkar ha ändrats eller sluta fungera.`,
    url: `/kliniskt-stod#rutin-${rutinId}`,
  });
}

exports.loggaRutinSkapadTrigger = onDocumentCreated(
  { document: "rutiner/{rutinId}", region: "europe-west1" },
  (event) => hanteraRutinSkapad(event.data.data(), event.params.rutinId)
);
exports.hanteraRutinSkapad = hanteraRutinSkapad;

// Fångar godkännande av ett tidigare utkast, samt mjuk radering (papperskorg).
// "Avpublicerad" nämns i ETAPPLAN3.md Etapp 14c, men finns inte som en faktisk funktion i
// appen (bara utkast→godkänd och mjuk radering existerar, se useRutiner.js) – loggas
// därför inte, i enlighet med genomgående krav 8 (bygg inte efter en premiss som inte
// stämmer mot koden).
async function hanteraRutinAndrad(fore, efter, rutinId) {
  const organisationId = efter.organisationId ?? fore.organisationId ?? "default";

  if (fore.status !== "godkand" && efter.status === "godkand") {
    await loggaRevision({
      organisationId,
      aktorUid: efter.godkandAv ?? null,
      aktorRoll: await hamtaRollForAktor(efter.godkandAv),
      handelsetyp: "rutin_godkand",
      objektTyp: "rutiner",
      objektId: rutinId,
      sammanfattning: `Rutin godkänd: ${efter.titel ?? "(namnlös)"}`,
    });
    await skickaPushForNyRutin(organisationId, efter.omrade, efter.godkandAv);
  }

  // Etapp 24b: källvarning (se kontrolleraKallbevakning/Sektionssida.jsx) sätts via update,
  // inte en separat collection – fångas här som en tredje gren i samma update-trigger istället
  // för en ny trigger.
  if (!fore.kallVarning && efter.kallVarning === true) {
    await skickaPushForKallvarning(organisationId, efter.agare, efter.titel, rutinId);
  }

  if (!fore.borttagen && efter.borttagen === true) {
    await loggaRevision({
      organisationId,
      aktorUid: efter.borttagenAv ?? null,
      aktorRoll: await hamtaRollForAktor(efter.borttagenAv),
      handelsetyp: "rutin_borttagen",
      objektTyp: "rutiner",
      objektId: rutinId,
      sammanfattning: `Rutin borttagen: ${efter.titel ?? "(namnlös)"}`,
    });
  }
}

exports.loggaRutinAndradTrigger = onDocumentUpdated(
  { document: "rutiner/{rutinId}", region: "europe-west1" },
  (event) => hanteraRutinAndrad(event.data.before.data(), event.data.after.data(), event.params.rutinId)
);
exports.hanteraRutinAndrad = hanteraRutinAndrad;

// Etapp 24b: bristanmälan till förrådsansvarig. Ingen fritext skickas (kommentarfältet på
// bristanmälan hoppas medvetet över, se ETAPPLAN4.md Etapp 24b) – bara artikelns namn, som
// redan är strukturerad katalogdata, inte fritext skriven av en användare.
async function hanteraBristanmalningSkapad(data, bristId) {
  const organisationId = data.organisationId ?? "default";
  const mottagare = await hamtaAnvandareMedPushPreferens(
    organisationId,
    "bristanmalan",
    (a) => KAN_HANTERA_FORRAD.includes(a.role)
  );
  await skickaPush(mottagare, {
    titel: "Ny bristanmälan",
    body: `${data.artikelNamn ?? "En artikel"} har anmälts som slut eller lågt saldo.`,
    url: "/logistik",
  });
  return bristId;
}
exports.hanteraBristanmalningSkapad = hanteraBristanmalningSkapad;

exports.hanteraBristanmalningSkapadTrigger = onDocumentCreated(
  { document: "bristanmalningar/{bristId}", region: "europe-west1" },
  (event) => hanteraBristanmalningSkapad(event.data.data(), event.params.bristId)
);

// Etapp 37b: när en superadmin startar en riktad granskningsrunda, meddela varje berörd
// rutins ägare EN gång (inte en push per rutin) om hur många av deras rutiner ingår i rundan
// och till när. `rutinIds` är redan en tagen ögonblicksbild (se firestore.rules) – funktionen
// läser bara upp respektive rutins nuvarande ägare för att veta vem som ska meddelas.
async function hanteraGranskningsrundaSkapad(data, rundaId) {
  const organisationId = data.organisationId ?? "default";
  const rutinIds = data.rutinIds ?? [];
  if (rutinIds.length === 0) return rundaId;

  const rutinDocs = await Promise.all(rutinIds.map((id) => db.collection("rutiner").doc(id).get()));
  const perAgare = new Map();
  for (const snap of rutinDocs) {
    if (!snap.exists) continue;
    const agare = snap.data().agare;
    const nyckel =
      agare?.typ === "person" && agare.uid
        ? `person:${agare.uid}`
        : agare?.typ === "roll" && agare.roll
          ? `roll:${agare.roll}`
          : null;
    if (!nyckel) continue;
    if (!perAgare.has(nyckel)) perAgare.set(nyckel, { agare, antal: 0 });
    perAgare.get(nyckel).antal += 1;
  }

  const omradeUrl =
    data.omrade === "administration" ? "/administration" : data.omrade === "logistik" ? "/logistik" : "/kliniskt-stod";

  await Promise.all(
    Array.from(perAgare.values()).map(async ({ agare, antal }) => {
      const mottagare =
        agare.typ === "person"
          ? await hamtaAnvandareMedPushPreferens(organisationId, "granskningsrunda", (a) => a.id === agare.uid)
          : await hamtaAnvandareMedPushPreferens(organisationId, "granskningsrunda", (a) => a.role === agare.roll);
      await skickaPush(mottagare, {
        titel: "En granskningsrunda har startat",
        body:
          antal === 1
            ? `En rutin du äger ska granskas senast ${data.deadline ?? "snart"}.`
            : `${antal} rutiner du äger ska granskas senast ${data.deadline ?? "snart"}.`,
        url: omradeUrl,
      });
    })
  );
  return rundaId;
}
exports.hanteraGranskningsrundaSkapad = hanteraGranskningsrundaSkapad;

exports.hanteraGranskningsrundaSkapadTrigger = onDocumentCreated(
  { document: "granskningsrundor/{rundaId}", region: "europe-west1" },
  (event) => hanteraGranskningsrundaSkapad(event.data.data(), event.params.rundaId)
);

// Etapp 24b: daglig påminnelse om anslag med en kvitteringsfrist som närmar sig, till var och
// en som inte redan kvitterat – mirrorar exakt samma "vem har inte kvitterat"-logik som
// Admin.jsx redan visar klientsidan (anslagMedFrist), se ETAPPLAN4.md Etapp 24b.
// `pushPaminnelseSkickadTill` håller reda på vem som redan fått EN påminnelse per anslag, så
// jobbet (som körs dagligen) inte skickar samma push varje dag fram till fristen.
const KVITTERINGSPAMINNELSE_FONSTER_MS = 3 * 24 * 60 * 60 * 1000;

async function kontrolleraKvitteringsfrister() {
  const nu = Date.now();
  // `borttagen` sätts bara VID radering (se useAnslag.js) – aldrig till `false` vid
  // skapande – så ett Firestore-villkor `where("borttagen", "!=", true)` hade uteslutit ALLA
  // icke-raderade anslag (inequality-filter matchar aldrig dokument som helt saknar fältet).
  // Filtreras därför i JS istället, samma mönster som useAnslag.js redan använder.
  const snap = await db.collection("anslag").get();
  for (const anslagDoc of snap.docs) {
    const data = anslagDoc.data();
    if (data.borttagen) continue;
    if (!data.kvitteringsfrist) continue;
    const fristTid = new Date(data.kvitteringsfrist).getTime();
    if (Number.isNaN(fristTid) || fristTid < nu || fristTid - nu > KVITTERINGSPAMINNELSE_FONSTER_MS) continue;

    const lasteAv = new Set((data.lasteAv ?? []).map((l) => l.uid));
    // Etapp 53c: samma dedupe-fält täcker NU båda kanalerna (push och e-post) – någon som
    // redan påmints via endera kanalen ska inte påminnas igen via den andra nästa dag.
    const redanPaminda = new Set(data.pushPaminnelseSkickadTill ?? []);
    const organisationId = data.organisationId ?? "default";

    const behoverPaminnas = (a) => !lasteAv.has(a.id) && !redanPaminda.has(a.id);
    const mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "anslagsfrist", behoverPaminnas);
    const epostMottagare = await hamtaAnvandareForEpostPaminnelse(organisationId, behoverPaminnas);
    if (mottagare.length === 0 && epostMottagare.length === 0) continue;

    if (mottagare.length > 0) {
      await skickaPush(mottagare, {
        titel: "Ett anslag väntar på kvittering",
        body: `"${data.titel ?? "Ett anslag"}" måste läsas och kvitteras innan fristen går ut.`,
        url: "/anslag",
      });
    }
    for (const a of epostMottagare) {
      await koaEpostPaminnelse(
        a.id,
        organisationId,
        a.email,
        `"${data.titel ?? "Ett anslag"}" måste läsas och kvitteras innan fristen går ut.`,
        "/anslag"
      );
    }
    const alltPaminda = new Set([...mottagare.map((a) => a.id), ...epostMottagare.map((a) => a.id)]);
    if (alltPaminda.size === 0) continue;
    await anslagDoc.ref.update({
      pushPaminnelseSkickadTill: admin.firestore.FieldValue.arrayUnion(...alltPaminda),
    });
  }
}
exports.kontrolleraKvitteringsfrister = kontrolleraKvitteringsfrister;

exports.kvitteringsfristerSchemalagt = onSchedule(
  { schedule: "every day 07:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraKvitteringsfrister
);

// Etapp 38b: den beslutade svarstiden (ägarbeslut 2026-08-01, se ETAPPLAN6.md beslutspunkt 1)
// är EN VECKA på ett ändringsförslag. "Vad hände med min ändring?" är planens egen bedömning
// av det viktigaste raden i hela etappen – ett förslag som tystnar i sju dagar utan att
// någon ens fått en påminnelse är precis det scenario som får förslagsflödet att sluta
// användas. Rollerna per område mirrorar firebase/roles.js farRedigeraOmrade (klienten) –
// samma uppdelning som redan gäller redigeringsrätt, nu även ägarbeslutad för granskningskön.
const FORSLAG_SVARSTID_MS = 7 * 24 * 60 * 60 * 1000;
const ROLLER_PER_OMRADE = {
  "kliniskt-stod": ["vol", "sektionsledare"],
  administration: ["vec"],
};

async function kontrolleraForslagPaminnelser() {
  const nu = Date.now();
  const snap = await db.collection("andringsforslag").where("status", "==", "ny").get();
  for (const forslagDoc of snap.docs) {
    const data = forslagDoc.data();
    if (data.paminnelseSkickad) continue;
    const tidpunktMs = data.tidpunkt?.toMillis?.() ?? null;
    if (tidpunktMs === null || nu - tidpunktMs < FORSLAG_SVARSTID_MS) continue;

    const agandeRoller = ROLLER_PER_OMRADE[data.omrade];
    if (!agandeRoller) continue;
    const organisationId = data.organisationId ?? "default";
    const agarFilter = (a) => agandeRoller.includes(a.role);

    const mottagare = await hamtaAnvandareMedPushPreferens(organisationId, "forslagPaminnelse", agarFilter);
    const epostMottagare = await hamtaAnvandareForEpostPaminnelse(organisationId, agarFilter);
    if (mottagare.length === 0 && epostMottagare.length === 0) continue;

    const url = data.omrade === "administration" ? "/administration" : "/kliniskt-stod";
    if (mottagare.length > 0) {
      await skickaPush(mottagare, {
        titel: "Ett ändringsförslag väntar sedan över en vecka",
        body: `Förslaget om "${data.rutinTitel ?? "en rutin"}" har inte hanterats än.`,
        url,
      });
    }
    for (const a of epostMottagare) {
      await koaEpostPaminnelse(
        a.id,
        organisationId,
        a.email,
        `Förslaget om "${data.rutinTitel ?? "en rutin"}" har inte hanterats än.`,
        url
      );
    }
    await forslagDoc.ref.update({ paminnelseSkickad: true });
  }
}
exports.kontrolleraForslagPaminnelser = kontrolleraForslagPaminnelser;

exports.forslagPaminnelserSchemalagt = onSchedule(
  { schedule: "every day 08:00", timeZone: "Europe/Stockholm", region: "europe-west1" },
  kontrolleraForslagPaminnelser
);

// Etapp 53c: tömmer epostPaminnelseko – EN sammanslagen e-post per användare med alla dagens
// köade poster, inte ett mejl per händelse. Körs 09:00, efter båda källjobben ovan (07:00/
// 08:00) hunnit köa klart för dagen. Ett fel för EN användares mejl (Brevo nere, ogiltig
// adress) får aldrig hindra att övriga användares köer töms.
// Bygger påminnelsedigestens ämne och text. Bruten ut som ren funktion 2026-08-27, av samma
// skäl som byggInbjudningsmejl() i inbjudningar.js: den rättsliga spärren mot Brevo (se
// PUB_AVTAL_BREVO_TECKNAT i gemensamt.js) gör att inget mejl skickas, och testet som bevakade
// digestens innehåll (rätt ämnesrad i singular/plural, alla poster med i texten) hade annars
// inte kunnat köras alls medan spärren är på.
function byggPaminnelseDigest(poster) {
  const rader = poster.map((p) => `- ${p.text}${p.url ? ` (${APP_URL}${p.url})` : ""}`).join("\n");
  return {
    amne:
      poster.length === 1
        ? "Du har en påminnelse i Synappsen"
        : `Du har ${poster.length} påminnelser i Synappsen`,
    text: `${rader}\n\nLogga in för att se detaljerna: ${APP_URL}`,
  };
}

async function skickaEpostPaminnelser() {
  const snap = await db.collection("epostPaminnelseko").get();
  for (const kodok of snap.docs) {
    const data = kodok.data();
    const poster = Array.isArray(data.poster) ? data.poster : [];
    if (poster.length === 0) {
      await kodok.ref.delete();
      continue;
    }
    try {
      await skickaEpost({
        till: data.epost,
        ...byggPaminnelseDigest(poster),
        organisationId: data.organisationId,
      });
    } catch (fel) {
      // Adressen utelämnas medvetet ur loggen – se motiveringen i skickaEpost (gemensamt.js).
      // Ködokumentets id ÄR mottagarens uid, vilket räcker för att felsöka utan att skriva
      // en personuppgift till Cloud Logging.
      console.warn(`Påminnelsemejl kunde inte skickas (uid ${kodok.id}):`, fel.message ?? fel);
    }
    await kodok.ref.delete();
  }
}
exports.skickaEpostPaminnelser = skickaEpostPaminnelser;
// Exporterad enbart för tests/functions/epostpaminnelser.test.cjs – se kommentaren ovan.
exports._byggPaminnelseDigest = byggPaminnelseDigest;

exports.skickaEpostPaminnelserSchemalagt = onSchedule(
  { schedule: "every day 09:00", timeZone: "Europe/Stockholm", region: "europe-west1", secrets: [BREVO_API_KEY] },
  skickaEpostPaminnelser
);
