// Etapp 71: frågebanken bakom Öva-läget.
//
// BAKGRUND. Fram till nu låg övningsfrågorna på två ställen: `rutin.kviss` (kundens egna,
// bundna till en rutin) och `src/data/kvissbank.js` (leverantörens, statisk kod). Den statiska
// varianten kunde bara ändras med en deploy, och nådde dessutom bara Öva-läget om en redaktör
// först manuellt fäst frågan på en rutin – en organisation utan rutiner hade noll att öva på.
//
// MODELLEN, valt av ägaren 2026-08-27 ("överlagring"):
//
//   kvissfragor/{id}                                 leverantörens frågor, GLOBALA
//   organisationer/{orgId}/kvissoverlagring/{id}     kundens avvikelse från en sådan
//   organisationer/{orgId}/kvissegna/{id}            kundens egna, fristående frågor
//   kvisspaket/{paket}                               leverantörens globala nödstopp
//   organisationer/{orgId}.kvisspaket                kundens egna på/av-lägen
//
// Poängen med överlagringen framför en kopia-per-kund: när leverantören rättar en fråga
// (t.ex. en riktlinje har ändrats) når rättelsen automatiskt varje kund som INTE själv rört
// frågan. Se granskningar/MDR-BEDOMNING-OVNINGSFRAGOR-2026-08.md §5.1 – färskhetsrisken är
// den allvarligaste i hela funktionen, och en kopia-modell hade gjort varje central rättelse
// verkningslös för befintliga kunder.
//
// VARFÖR ALLT GÅR VIA CLOUD FUNCTIONS och firestore.rules säger `allow write: if false`:
// en kvissfråga har ett rätt svar och är därmed ett faktapåstående som visas för personal.
// Varje ändring ska därför (a) rolltestas, (b) PII-kontrolleras och (c) revisionsloggas.
// En direkt klientskrivning hade kringgått alla tre. Samma resonemang som gjorde att
// rolländring och moduler flyttades hit i Etapp 32c.
//
// KRAV 14 gäller oförändrat: ingenting här sparar någons SVAR. Det som lagras är frågorna.

const {
  db,
  admin,
  onCall,
  HttpsError,
  hamtaAnvandarInfo,
  innehallerPersonnummer,
  loggaRevision,
  kravPlattformsadmin,
} = require("./gemensamt");

// De fyra paketen. "eget" finns bara per organisation och har aldrig några globala frågor.
const PAKET = {
  SYSTEMKUNSKAP: "systemkunskap",
  YRKESKUNSKAP: "yrkeskunskap",
  KLINISKT: "kliniskt",
  EGET: "eget",
};
const GILTIGA_PAKET = Object.values(PAKET);
// Paket som leverantören fyller. "eget" ägs helt av kunden och kan inte ha globala frågor.
const LEVERANTORSPAKET = [PAKET.SYSTEMKUNSKAP, PAKET.YRKESKUNSKAP, PAKET.KLINISKT];

// Samma gränser som src/data/kvissbank.js och dess test redan tillämpar på den statiska
// banken: två alternativ blir en gissning med 50 % chans, fler än fyra blir oläsligt på en
// telefon – som är där frågan faktiskt besvaras.
const MIN_ALTERNATIV = 3;
const MAX_ALTERNATIV = 4;
const MAX_TEXTLANGD = 500;

const KAN_HANTERA_KVISS = ["superadmin", "vol"];

// Validerar och normaliserar en fråga. Kastar HttpsError vid fel – anroparen ska aldrig
// behöva tolka ett halvvaliderat objekt.
//
// `delvis` används för överlagringar, där kunden kan ha ändrat bara frågetexten och lämnat
// alternativen orörda. Då valideras enbart de fält som faktiskt skickats in.
function validera(data, { delvis = false } = {}) {
  const ut = {};

  const harFraga = typeof data?.fraga === "string";
  if (!delvis || harFraga) {
    const fraga = (data?.fraga ?? "").trim();
    if (!fraga) throw new HttpsError("invalid-argument", "Frågetexten får inte vara tom.");
    if (fraga.length > MAX_TEXTLANGD) {
      throw new HttpsError("invalid-argument", `Frågetexten får vara högst ${MAX_TEXTLANGD} tecken.`);
    }
    ut.fraga = fraga;
  }

  const harAlternativ = Array.isArray(data?.alternativ);
  if (!delvis || harAlternativ) {
    if (!harAlternativ) throw new HttpsError("invalid-argument", "Svarsalternativ saknas.");
    const alternativ = data.alternativ.map((a) => String(a ?? "").trim());
    if (alternativ.length < MIN_ALTERNATIV || alternativ.length > MAX_ALTERNATIV) {
      throw new HttpsError(
        "invalid-argument",
        `En fråga måste ha ${MIN_ALTERNATIV}–${MAX_ALTERNATIV} svarsalternativ.`
      );
    }
    if (alternativ.some((a) => !a)) {
      throw new HttpsError("invalid-argument", "Ett svarsalternativ får inte vara tomt.");
    }
    if (alternativ.some((a) => a.length > MAX_TEXTLANGD)) {
      throw new HttpsError("invalid-argument", `Ett svarsalternativ får vara högst ${MAX_TEXTLANGD} tecken.`);
    }
    if (new Set(alternativ).size !== alternativ.length) {
      throw new HttpsError("invalid-argument", "Två svarsalternativ är identiska.");
    }
    ut.alternativ = alternativ;
  }

  const harRattIndex = data?.rattIndex !== undefined && data?.rattIndex !== null;
  if (!delvis || harRattIndex) {
    const rattIndex = Number(data?.rattIndex);
    if (!Number.isInteger(rattIndex) || rattIndex < 0) {
      throw new HttpsError("invalid-argument", "rattIndex måste vara ett heltal ≥ 0.");
    }
    // Vid en delvis uppdatering som BARA ändrar rattIndex finns inga alternativ att jämföra
    // mot här – anroparen kontrollerar det mot den sammanslagna frågan i stället.
    const antal = ut.alternativ?.length;
    if (antal !== undefined && rattIndex >= antal) {
      throw new HttpsError("invalid-argument", "rattIndex pekar utanför svarsalternativen.");
    }
    ut.rattIndex = rattIndex;
  }

  const harHanvisning = data?.hanvisning !== undefined;
  if (!delvis || harHanvisning) {
    const hanvisning = String(data?.hanvisning ?? "").trim();
    if (hanvisning.length > MAX_TEXTLANGD * 2) {
      throw new HttpsError("invalid-argument", "Hänvisningstexten är för lång.");
    }
    ut.hanvisning = hanvisning;
  }

  // PII-spärr. Samma skyddsnätsprincip som firestore.rules tillämpar på rutininnehåll och
  // kontrolleraPatientuppgifter() på kommentarer/feedback: den fångar inte allt känsligt,
  // men den fångar det vanligaste misstaget. En övningsfråga ska aldrig innehålla en riktig
  // patient – varken i frågan, ett alternativ eller hänvisningen.
  const allText = [ut.fraga ?? "", ...(ut.alternativ ?? []), ut.hanvisning ?? ""].join(" ");
  if (innehallerPersonnummer(allText)) {
    throw new HttpsError(
      "invalid-argument",
      "Texten ser ut att innehålla ett personnummer. Övningsfrågor får aldrig innehålla patientuppgifter."
    );
  }

  return ut;
}

async function kravKvissbehorighet(uid) {
  const { roll, organisationId } = await hamtaAnvandarInfo(uid);
  if (!KAN_HANTERA_KVISS.includes(roll)) {
    throw new HttpsError(
      "permission-denied",
      "Endast superadmin och VÖL får hantera övningsfrågor."
    );
  }
  return { roll, organisationId };
}

function kravGiltigtPaket(paket, tillatna = GILTIGA_PAKET) {
  if (!tillatna.includes(paket)) {
    throw new HttpsError("invalid-argument", `Okänt frågepaket: ${paket}`);
  }
  return paket;
}

// ─────────────────────────────────────────────────────────────────────────────
// Leverantörens globala frågor
// ─────────────────────────────────────────────────────────────────────────────

// Skapar (utan id) eller uppdaterar (med id) en global fråga. `kalla`/`kallaDatum` finns med
// från första versionen även om paketet "kliniskt" ännu inte fyllts: de är kravet som gör
// spår 2 möjligt att granska över tid (se MDR-bedömningens §7), och att lägga till dem i
// efterhand hade krävt en migrering av varje redan skapad fråga.
exports.sparaGlobalKvissfraga = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  const paket = kravGiltigtPaket(request.data?.paket, LEVERANTORSPAKET);
  const validerad = validera(request.data);
  const kategori = request.data?.kategori ? String(request.data.kategori).trim() : null;
  const kalla = request.data?.kalla ? String(request.data.kalla).trim() : null;
  const kallaDatum = request.data?.kallaDatum ? String(request.data.kallaDatum).trim() : null;

  const id = request.data?.id;
  const ref = id ? db.collection("kvissfragor").doc(id) : db.collection("kvissfragor").doc();
  if (id && !(await ref.get()).exists) {
    throw new HttpsError("not-found", "Frågan finns inte.");
  }

  await ref.set(
    {
      ...validerad,
      paket,
      kategori,
      kalla,
      kallaDatum,
      andradAv: request.auth.uid,
      andrad: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // Loggas mot leverantörens egen organisation. En global fråga hör inte till någon kund, och
  // att skriva den till varje kunds revisionslogg hade både brutit hashkedjan och fyllt
  // kundernas logg med leverantörens redaktionella arbete.
  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: id ? "kvissfraga_andrad" : "kvissfraga_skapad",
    objektTyp: "kvissfraga",
    objektId: ref.id,
    sammanfattning: `Global övningsfråga i paketet ${paket}`,
  });

  return { id: ref.id };
});

exports.taBortGlobalKvissfraga = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  const id = request.data?.id;
  if (!id) throw new HttpsError("invalid-argument", "id krävs.");
  const ref = db.collection("kvissfragor").doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError("not-found", "Frågan finns inte.");

  await ref.delete();

  // Kundernas överlagringar av frågan blir föräldralösa och städas INTE här. De är
  // ofarliga (sammanslagningen i useKvissbank.js hoppar över en överlagring utan original)
  // och att radera dem hade krävt en genomsökning av varje organisation vid varje borttagen
  // fråga. De försvinner naturligt om frågan återskapas med samma id, vilket aldrig sker.
  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "kvissfraga_borttagen",
    objektTyp: "kvissfraga",
    objektId: id,
    sammanfattning: `Global övningsfråga borttagen ur paketet ${snap.data()?.paket ?? "okänt"}`,
  });

  return { ok: true };
});

// Globalt nödstopp per paket – stoppar paketet hos SAMTLIGA kunder omedelbart, utan deploy.
// Finns av samma skäl som angeEpostAvstangd: om ett felaktigt facit upptäcks ute i drift är
// alternativet annars att kontakta varje kund eller vänta på en release.
exports.satGlobaltKvisspaketStopp = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  const paket = kravGiltigtPaket(request.data?.paket, LEVERANTORSPAKET);
  const avstangt = request.data?.avstangt === true;

  await db.collection("kvisspaket").doc(paket).set(
    {
      avstangt,
      andradAv: request.auth.uid,
      andrad: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: avstangt ? "kvisspaket_globalt_stoppat" : "kvisspaket_globalt_aterstartat",
    objektTyp: "kvisspaket",
    objektId: paket,
    sammanfattning: `Globalt nödstopp för paketet ${paket} ${avstangt ? "PÅ" : "AV"}`,
  });

  return { paket, avstangt };
});

// ─────────────────────────────────────────────────────────────────────────────
// Kundens paketval
// ─────────────────────────────────────────────────────────────────────────────

exports.satKvisspaket = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  const { roll, organisationId } = await kravKvissbehorighet(request.auth.uid);

  const paket = kravGiltigtPaket(request.data?.paket);
  const aktivt = request.data?.aktivt === true;

  await db
    .collection("organisationer")
    .doc(organisationId)
    .set({ kvisspaket: { [paket]: aktivt } }, { merge: true });

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: roll,
    handelsetyp: aktivt ? "kvisspaket_pa" : "kvisspaket_av",
    objektTyp: "kvisspaket",
    objektId: paket,
    sammanfattning: `Frågepaketet ${paket} ${aktivt ? "påslaget" : "avstängt"} i Öva-läget`,
  });

  return { paket, aktivt };
});

// ─────────────────────────────────────────────────────────────────────────────
// Kundens överlagringar av leverantörens frågor
// ─────────────────────────────────────────────────────────────────────────────

// Döljer eller skriver om en global fråga för den egna organisationen. Originalet rörs
// aldrig. `dold: true` utan övriga fält är det vanliga fallet ("den här frågan stämmer inte
// med hur vi arbetar").
exports.sparaKvissoverlagring = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  const { roll, organisationId } = await kravKvissbehorighet(request.auth.uid);

  const fragaId = request.data?.fragaId;
  if (!fragaId) throw new HttpsError("invalid-argument", "fragaId krävs.");

  const originalSnap = await db.collection("kvissfragor").doc(fragaId).get();
  if (!originalSnap.exists) {
    throw new HttpsError("not-found", "Frågan finns inte i den globala banken.");
  }

  const dold = request.data?.dold === true;
  const validerad = validera(request.data, { delvis: true });

  // rattIndex kontrolleras mot den SAMMANSLAGNA frågan: kunden kan ha ändrat bara rattIndex
  // och behållit originalets alternativ, eller tvärtom. Att bara validera det som skickades
  // in hade släppt igenom ett index utanför listan.
  const sammanslagen = { ...originalSnap.data(), ...validerad };
  if (
    sammanslagen.rattIndex !== undefined &&
    Array.isArray(sammanslagen.alternativ) &&
    sammanslagen.rattIndex >= sammanslagen.alternativ.length
  ) {
    throw new HttpsError("invalid-argument", "rattIndex pekar utanför svarsalternativen.");
  }

  await db
    .collection("organisationer")
    .doc(organisationId)
    .collection("kvissoverlagring")
    .doc(fragaId)
    .set(
      {
        ...validerad,
        dold,
        andradAv: request.auth.uid,
        andrad: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: roll,
    handelsetyp: dold ? "kvissfraga_dold" : "kvissfraga_overlagrad",
    objektTyp: "kvissfraga",
    objektId: fragaId,
    sammanfattning: dold
      ? "Leverantörsfråga dold för organisationen"
      : "Leverantörsfråga omskriven för organisationen",
  });

  return { fragaId, dold };
});

// Tar bort överlagringen, så att leverantörens original (och framtida rättelser av det)
// gäller igen.
exports.aterstallKvissoverlagring = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  const { roll, organisationId } = await kravKvissbehorighet(request.auth.uid);

  const fragaId = request.data?.fragaId;
  if (!fragaId) throw new HttpsError("invalid-argument", "fragaId krävs.");

  await db
    .collection("organisationer")
    .doc(organisationId)
    .collection("kvissoverlagring")
    .doc(fragaId)
    .delete();

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: roll,
    handelsetyp: "kvissfraga_aterstalld",
    objektTyp: "kvissfraga",
    objektId: fragaId,
    sammanfattning: "Leverantörens original gäller igen för frågan",
  });

  return { fragaId };
});

// ─────────────────────────────────────────────────────────────────────────────
// Kundens egna, fristående frågor (paketet "eget")
// ─────────────────────────────────────────────────────────────────────────────

exports.sparaEgenKvissfraga = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  const { roll, organisationId } = await kravKvissbehorighet(request.auth.uid);

  const validerad = validera(request.data);
  if (validerad.rattIndex >= validerad.alternativ.length) {
    throw new HttpsError("invalid-argument", "rattIndex pekar utanför svarsalternativen.");
  }
  const kategori = request.data?.kategori ? String(request.data.kategori).trim() : null;

  const samling = db.collection("organisationer").doc(organisationId).collection("kvissegna");
  const id = request.data?.id;
  const ref = id ? samling.doc(id) : samling.doc();
  if (id && !(await ref.get()).exists) {
    throw new HttpsError("not-found", "Frågan finns inte.");
  }

  await ref.set(
    {
      ...validerad,
      kategori,
      paket: PAKET.EGET,
      andradAv: request.auth.uid,
      andrad: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: roll,
    handelsetyp: id ? "egen_kvissfraga_andrad" : "egen_kvissfraga_skapad",
    objektTyp: "kvissfraga",
    objektId: ref.id,
    sammanfattning: "Egen övningsfråga",
  });

  return { id: ref.id };
});

exports.taBortEgenKvissfraga = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  const { roll, organisationId } = await kravKvissbehorighet(request.auth.uid);

  const id = request.data?.id;
  if (!id) throw new HttpsError("invalid-argument", "id krävs.");

  const ref = db.collection("organisationer").doc(organisationId).collection("kvissegna").doc(id);
  if (!(await ref.get()).exists) throw new HttpsError("not-found", "Frågan finns inte.");
  await ref.delete();

  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: roll,
    handelsetyp: "egen_kvissfraga_borttagen",
    objektTyp: "kvissfraga",
    objektId: id,
    sammanfattning: "Egen övningsfråga borttagen",
  });

  return { ok: true };
});

// Skriver startinnehållet (functions/kvissfragorSeed.js) till den globala banken.
//
// IDEMPOTENT: seedens id används som dokument-ID, så en ny körning UPPDATERAR befintliga
// frågor i stället för att skapa dubbletter. Det är också det som gör den till rätt väg för
// en rättelse – kör om seedningen efter att ha ändrat texten i filen, så når rättelsen varje
// kund som inte skrivit om frågan själv (deras överlagring är nycklad på samma id och
// överlever).
//
// `endastNya: true` hoppar över frågor som redan finns – använd det när seeden utökats med
// nya frågor men befintliga inte ska skrivas över (t.ex. om leverantören redigerat en fråga
// i UI:t och inte vill få den tillbakaskriven av filen).
exports.seedaKvissbank = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  await kravPlattformsadmin(request.auth.uid);

  const { SEED } = require("./kvissfragorSeed");
  const endastNya = request.data?.endastNya === true;

  const befintliga = new Set((await db.collection("kvissfragor").select().get()).docs.map((d) => d.id));

  let skapade = 0;
  let uppdaterade = 0;
  let hoppadeOver = 0;

  // Firestore tar max 500 skrivningar per batch. Seeden är i dag ~30 poster, men den ska
  // kunna växa utan att den här funktionen tyst går sönder vid post 501.
  let batch = db.batch();
  let iBatch = 0;
  for (const fraga of SEED) {
    const finns = befintliga.has(fraga.id);
    if (finns && endastNya) {
      hoppadeOver += 1;
      continue;
    }
    const { id, ...falt } = fraga;
    batch.set(
      db.collection("kvissfragor").doc(id),
      {
        ...falt,
        kategori: falt.kategori ?? null,
        kalla: falt.kalla ?? null,
        kallaDatum: falt.kallaDatum ?? null,
        andradAv: request.auth.uid,
        andrad: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    if (finns) uppdaterade += 1;
    else skapade += 1;
    iBatch += 1;
    if (iBatch === 450) {
      await batch.commit();
      batch = db.batch();
      iBatch = 0;
    }
  }
  if (iBatch > 0) await batch.commit();

  const { organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  await loggaRevision({
    organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: "plattformsadmin",
    handelsetyp: "kvissbank_seedad",
    objektTyp: "kvissfraga",
    objektId: null,
    sammanfattning: `Startinnehåll skrivet: ${skapade} nya, ${uppdaterade} uppdaterade, ${hoppadeOver} överhoppade`,
  });

  return { skapade, uppdaterade, hoppadeOver };
});

exports.PAKET = PAKET;
exports.GILTIGA_PAKET = GILTIGA_PAKET;
exports.LEVERANTORSPAKET = LEVERANTORSPAKET;
exports.KAN_HANTERA_KVISS = KAN_HANTERA_KVISS;
exports._validera = validera;
