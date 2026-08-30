// organisationsadmin.js – del av Synappsen Cloud Functions.
//
// Etapp 61a (ETAPPLAN12.md): functions/index.js hade vuxit till ~4700 rader och ~93
// exports i EN fil. Den är nu uppdelad per domän – samma kod, samma exports, samma
// beteende – och index.js är bara en tunn åter-exporterande skarv (så både
// firebase deploy och tests/functions/*.test.cjs fungerar oförändrat).
//
// Den här filen: administrativa åtgärder INOM en organisation: utloggning, rolländring,
// kiosk-PIN, moduler, MFA-policy, budgettak, kommentarer och feedback.

const crypto = require("node:crypto");
const {
  admin,
  db,
  onCall,
  HttpsError,
  GILTIGA_ROLLER,
  hamtaAnvandarInfo,
  kravModul,
  innehallerPersonnummer,
  kontrolleraOchOkaHastighet,
  loggaRevision,
} = require("./gemensamt");

// Tvingar utloggning av en användare genom att återkalla dess refresh-tokens (Admin SDK).
// Klientens nästa tokenförnyelse (eller sidladdning) gör att den loggas ut automatiskt.
// En redan hämtad ID-token kan fortsätta fungera i upp till ~1 timme tills den löper ut.
exports.tvingaUtloggning = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan tvinga utloggning.");
  }

  const { userId } = request.data ?? {};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId krävs.");
  }

  // En superadmin i organisation A får aldrig kunna tvinga utloggning på en användare i
  // organisation B, även om de känner till uid:t.
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }

  await admin.auth().revokeRefreshTokens(userId);
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "anvandare_utloggning_tvingad",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: "Tvingade utloggning av en användare",
  });
  return { ok: true };
});

// Etapp 32c: rolländring är sannolikt den enskilt allvarligaste luckan i revisionsloggen –
// den gamla klientkoden (en naken updateDoc, se firestore.rules) lämnade INGA spår när någon
// gjordes till superadmin. Flyttat hit så att varje rolländring går genom loggaRevision().
// firestore.rules stänger nu den direkta klientvägen (role-fältet är immutabelt för
// superadmin-grenen av users/{userId}s update-regel) – detta är den enda återstående vägen.
exports.uppdateraAnvandarRoll = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra roller.");
  }
  const { userId, roll } = request.data ?? {};
  if (!userId || !GILTIGA_ROLLER.includes(roll)) {
    throw new HttpsError("invalid-argument", "userId och en giltig roll krävs.");
  }
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }
  const gammalRoll = mal.roll;
  await db.collection("users").doc(userId).update({ role: roll });
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "anvandare_roll_andrad",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: `Roll ändrad: ${gammalRoll ?? "okänd"} → ${roll}`,
  });
  return { ok: true };
});

// Etapp 70a: stänger av eller slår på ett konto (Firebase Auth `disabled`). Till skillnad från
// tvingaUtloggning ovan, som bara återkallar refresh-tokens och därför inte hindrar personen
// från att logga in igen med samma lösenord, spärrar detta inloggningen helt tills någon slår
// på kontot igen. Historik, kvitteringar och revisionsloggposter lämnas orörda – det är
// skillnaden mot raderaAnvandare nedan, och skälet till att båda finns:
//
//   * avstängning  = misstänkt kapning, sjukskrivning, tjänstledighet. Reversibelt, historik kvar.
//   * radering     = personen har slutat, eller begär radering enligt GDPR art. 17. Oåterkalleligt.
//
// Bakgrund: fram till 2026-08-26 fanns INGEN av dem. Enda åtgärden var tvingad utloggning, som
// inte stänger ute någon som kan sitt lösenord – en person som slutade behöll åtkomst till
// organisationens rutiner i praktiken för alltid. drift/INCIDENT-CHECKLISTA.md rekommenderade
// "tvinga utloggning + sänk roll" vid misstänkt kapning, vilket var svagare än det lät.
exports.satAnvandareAvstangd = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan stänga av ett konto.");
  }
  const { userId, avstangd } = request.data ?? {};
  if (!userId || typeof avstangd !== "boolean") {
    throw new HttpsError("invalid-argument", "userId och avstangd (boolean) krävs.");
  }
  // En superadmin får inte låsa ut sig själv – organisationen skulle kunna bli utan
  // administratör helt, utan någon väg tillbaka som inte kräver leverantören.
  if (userId === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Du kan inte stänga av ditt eget konto.");
  }
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }

  await admin.auth().updateUser(userId, { disabled: avstangd });
  if (avstangd) {
    // Utan detta ligger en redan utfärdad ID-token kvar och fungerar i upp till ~1 timme.
    await admin.auth().revokeRefreshTokens(userId);
  }
  await db.collection("users").doc(userId).update({ avstangd });
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: avstangd ? "anvandare_avstangd" : "anvandare_aterupptagen",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: avstangd ? "Stängde av ett konto" : "Slog på ett avstängt konto igen",
  });
  return { ok: true, avstangd };
});

// Etapp 70a: raderar ett konto permanent – både Firebase Auth-kontot (personen kan inte längre
// logga in) och users/{uid} (namn och e-post försvinner ur organisationen). Detta är
// mekanismen för GDPR art. 17 på individnivå; fram till 2026-08-26 fanns den bara på
// organisationsnivå (raderaOrganisationensData i avtalslivscykel.js).
//
// Vad som MEDVETET INTE raderas: personens läskvitteringar (rutin.lasteAv) och poster i
// revisionsloggen. Kvitteringar är en del av verksamhetens patientsäkerhetsunderlag – "vem
// hade läst rutinen när avvikelsen inträffade" måste gå att svara på i efterhand – och
// revisionsloggen är en manipuleringsdetekterande hashkedja som inte kan ändras utan att
// bryta kedjan. Båda innehåller uid och namn, vilket ska framgå av kundens egen
// gallringsbedömning (se avtal/DPIA-UNDERLAG.md). Att tyst radera dem hade dessutom gjort
// spårbarheten av själva raderingen omöjlig.
exports.raderaAnvandare = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan radera ett konto.");
  }
  const { userId } = request.data ?? {};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId krävs.");
  }
  if (userId === request.auth.uid) {
    throw new HttpsError("failed-precondition", "Du kan inte radera ditt eget konto.");
  }
  const mal = await hamtaAnvandarInfo(userId);
  if (mal.organisationId !== uppringare.organisationId) {
    throw new HttpsError("permission-denied", "Användaren tillhör inte din organisation.");
  }

  // Namnet läses direkt ur dokumentet: hamtaAnvandarInfo() returnerar bara roll och
  // organisationId, och att utöka den delade hjälpfunktionen för ett enda anropsställes skull
  // vore en onödigt bred ändring.
  const malDok = await db.collection("users").doc(userId).get();
  const malNamn = malDok.data()?.namn || malDok.data()?.email || userId;

  // Loggas FÖRE raderingen: efteråt går namnet inte längre att läsa, och en revisionspost
  // utan uppgift om vem som raderades är nästan värdelös vid en granskning.
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "anvandare_raderad",
    objektTyp: "users",
    objektId: userId,
    sammanfattning: `Raderade kontot ${malNamn} permanent`,
  });

  // Auth-kontot först. Misslyckas det ska users/{uid} INTE raderas – annars blir personen
  // kvar med inloggningsmöjlighet men utan profil, vilket är ett sämre läge än före anropet.
  // Felet bubblar upp med flit: fram till 2026-08-26 saknade tjänstekontot behörighet mot
  // Firebase Authentication (roles/firebaseauth.admin), vilket fick revokeRefreshTokens att
  // krascha i produktion. Ett tyst .catch() här hade dolt exakt det felet igen.
  await admin.auth().deleteUser(userId);
  await db.collection("users").doc(userId).delete();
  // Etapp L1k: motsvarande decrement till incrementet i losInInbjudan – samma räknare, samma
  // organisation (redan verifierad ovan att mal.organisationId === uppringare.organisationId).
  // Samma skydd som där: rör INTE fältet om det aldrig initierats – FieldValue.increment(-1)
  // på ett saknat fält hade skapat -1 i stället för att lämna det åt listaOrganisationers
  // lativa backfill, som räknar rätt (redan exklusive det just raderade kontot).
  const orgRef = db.collection("organisationer").doc(uppringare.organisationId);
  const orgSnap = await orgRef.get();
  if (typeof orgSnap.data()?.antalAnvandare === "number") {
    await orgRef.set({ antalAnvandare: admin.firestore.FieldValue.increment(-1) }, { merge: true });
  }
  return { ok: true };
});

// Etapp 55 (kioskläge): en kiosk-enhet lämnar det begränsade läget med en PIN-kod istället för
// en persons lösenord (delad enhet, ingen ska behöva ett eget konto bara för att låsa upp den).
// PIN:en lagras ENDAST hashad, under en sökväg som är helt stängd för klientåtkomst (se
// organisationer/{orgId}/installningar/kioskPin i firestore.rules) – verifiering sker alltid
// server-side. Klienten får aldrig se vare sig PIN:en eller hashen, bara ett booleskt svar.
const MAX_KIOSK_PIN_FORSOK_PER_TIMME = 10;

exports.satKioskPin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan sätta kiosk-PIN-koden.");
  }
  // Etapp 59b (ETAPPLAN12.md, bugfynd): kioskläget hör till Operations (FEATURE.KIOSK_MODE),
  // men ingenstans kontrollerades det förrän nu – varken här eller i klienten. Samma mönster
  // som redan används för Intelligence-funktionerna (fragaKlinisktStod m.fl.) ovan.
  await kravModul(uppringare.organisationId, "operations", "Kioskläge kräver Operations-modulen.");
  const pin = String(request.data?.pin ?? "");
  if (!/^\d{4,8}$/.test(pin)) {
    throw new HttpsError("invalid-argument", "PIN-koden måste vara 4–8 siffror.");
  }
  const hash = crypto.createHash("sha256").update(pin).digest("hex");
  await db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("installningar")
    .doc("kioskPin")
    .set({
      hash,
      andradAv: request.auth.uid,
      andradTidpunkt: admin.firestore.FieldValue.serverTimestamp(),
    });
  return { ok: true };
});

// Anropas av kiosk-enheten själv (vilken inloggad roll som helst i organisationen, i praktiken
// bara kiosk-kontot) för att jämföra en inmatad PIN mot den lagrade hashen. Hastighetsbegränsat
// per konto – utan det skulle en enhet kunna testa alla 4-siffriga koder på några sekunder.
exports.verifieraKioskPin = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  await kontrolleraOchOkaHastighet(request.auth.uid, "kioskpin", MAX_KIOSK_PIN_FORSOK_PER_TIMME);

  const pin = String(request.data?.pin ?? "");
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  // Etapp 59b (ETAPPLAN12.md): MEDVETET INTE kravModul-gated, till skillnad från satKioskPin.
  // Att LÄMNA kioskläget är en säkerhetsventil, inte funktionen som säljs – om en organisation
  // stänger av Operations EFTER att en kiosk-enhet redan konfigurerats får den enheten aldrig
  // bli permanent inlåst utan väg ut. Samma princip som tvingaUtloggning (alltid tillgänglig,
  // oavsett moduler). Den faktiska affärsspärren sitter i skapaInbjudan (kan inte skapa ETT
  // nytt kioskkonto utan modulen) och satKioskPin (kan inte konfigurera EN ny PIN utan den).
  const dokSnap = await db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("installningar")
    .doc("kioskPin")
    .get();
  if (!dokSnap.exists) {
    return { giltig: false };
  }
  const hash = crypto.createHash("sha256").update(pin).digest("hex");
  return { giltig: hash === dokSnap.data().hash };
});

// Etapp 32c: moduler på/av flyttat från en naken klient-updateDoc (Admin.jsx) hit, så
// på/av-slag loggas. Samma behörighet som tidigare (superadmin, egen organisation) –
// firestore.rules stänger nu den direkta klientvägen för moduler-fältet.
const GILTIGA_MODULER = ["operations", "intelligence", "kallbevakning"];

exports.uppdateraModuler = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra moduler.");
  }
  const { modul, paslagen } = request.data ?? {};
  if (!GILTIGA_MODULER.includes(modul) || typeof paslagen !== "boolean") {
    throw new HttpsError("invalid-argument", "En giltig modul och paslagen (boolean) krävs.");
  }
  await db.collection("organisationer").doc(uppringare.organisationId).set(
    { moduler: { [modul]: paslagen } },
    { merge: true }
  );
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_modul_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `Modulen "${modul}" ${paslagen ? "aktiverad" : "avaktiverad"}`,
  });
  return { ok: true };
});

// Etapp 32c: 2FA-policyn (vilka roller som kräver en andra faktor) flyttat från en naken
// klient-updateDoc (Admin.jsx) hit. En organisation som sänker sina egna säkerhetskrav är
// exakt den typen av händelse som ska synas i revisionsloggen.
exports.uppdateraMfaPolicy = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra 2FA-policyn.");
  }
  const { kravMfaForRoller } = request.data ?? {};
  if (!Array.isArray(kravMfaForRoller) || !kravMfaForRoller.every((r) => GILTIGA_ROLLER.includes(r))) {
    throw new HttpsError("invalid-argument", "kravMfaForRoller måste vara en lista av giltiga roller.");
  }
  await db.collection("organisationer").doc(uppringare.organisationId).set(
    { sakerhet: { kravMfaForRoller } },
    { merge: true }
  );
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_mfapolicy_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `2FA krävs nu för: ${kravMfaForRoller.length ? kravMfaForRoller.join(", ") : "ingen roll"}`,
  });
  return { ok: true };
});

// Etapp 32c: budgettaket (Gemini Vision) flyttat från en naken klient-setDoc (useGeminiBudget.js)
// hit. anvantOre (den faktiska förbrukningen) rörs aldrig här – bara det superadmin-satta taket.
exports.uppdateraGeminiBudgetTak = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const uppringare = await hamtaAnvandarInfo(request.auth.uid);
  if (uppringare.roll !== "superadmin") {
    throw new HttpsError("permission-denied", "Endast superadmin kan ändra budgettaket.");
  }
  const { taketOre } = request.data ?? {};
  if (!Number.isInteger(taketOre) || taketOre < 0) {
    throw new HttpsError("invalid-argument", "taketOre måste vara ett heltal ≥ 0.");
  }
  await db
    .collection("organisationer")
    .doc(uppringare.organisationId)
    .collection("installningar")
    .doc("geminiBudget")
    .set({ taketOre }, { merge: true });
  await loggaRevision({
    organisationId: uppringare.organisationId,
    aktorUid: request.auth.uid,
    aktorRoll: uppringare.roll,
    handelsetyp: "organisation_budgettak_andrad",
    objektTyp: "organisationer",
    objektId: uppringare.organisationId,
    sammanfattning: `Budgettak ändrat till ${(taketOre / 100).toFixed(2)} kr`,
  });
  return { ok: true };
});

const MAX_KOMMENTARER_PER_TIMME = 30;
const MAX_FEEDBACK_PER_TIMME = 10;

// Skapar en kommentar via Admin SDK istället för en direkt klient-skrivning, så att
// personnummer-spärren kan köras server-side (Firestore-regler kan inte replikera
// Luhn-kontrollen) och skaparen inte kan skicka spam obegränsat (hastighetsbegränsning).
// @omnämnanden räknas alltid ut här, från den faktiska texten – klienten kan inte längre
// peka ut godtyckliga användare som "omnämnda".
exports.skapaKommentar = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { rutinId, text, svarPa } = request.data ?? {};
  const rensadText = (text ?? "").trim();
  if (!rutinId || !rensadText || rensadText.length > 2000) {
    throw new HttpsError("invalid-argument", "Ange en kommentar (max 2000 tecken).");
  }
  if (innehallerPersonnummer(rensadText)) {
    throw new HttpsError(
      "invalid-argument",
      "Kommentaren verkar innehålla ett personnummer. Patientuppgifter får inte sparas."
    );
  }

  const { roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll === "kiosk") {
    // Etapp 55: en kommentar är alltid en enskild persons text – ett delat kioskkonto får
    // aldrig kunna skriva den, annars blir "vem skrev det här" obesvarbart (genomgående krav 19).
    throw new HttpsError("permission-denied", "Kioskläge kan inte skriva kommentarer.");
  }

  await kontrolleraOchOkaHastighet(request.auth.uid, "kommentar", MAX_KOMMENTARER_PER_TIMME);
  const [skaparSnap, orgAnvandare] = await Promise.all([
    db.collection("users").doc(request.auth.uid).get(),
    // Begränsat till SAMMA organisation – annars skulle man kunna @nämna (och trigga en
    // notis till) en användare i en helt annan kunds organisation.
    db.collection("users").where("organisationId", "==", organisationId).get(),
  ]);
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const handtag = [...rensadText.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((m) => m[1].toLowerCase());
  const omnamnda = handtag.length
    ? orgAnvandare.docs
        .filter((d) => {
          const lokalDel = (d.data().email ?? "").split("@")[0].toLowerCase();
          return lokalDel && handtag.includes(lokalDel);
        })
        .map((d) => d.id)
        .filter((uid) => uid !== request.auth.uid)
    : [];

  const ref = await db.collection("kommentarer").add({
    rutinId,
    text: rensadText,
    organisationId,
    skapadAv: request.auth.uid,
    skapadAvNamn,
    svarPa: svarPa ?? null,
    omnamnda,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});

// Skickar in feedback via Admin SDK av samma skäl som skapaKommentar: server-side
// personnummer-spärr och hastighetsbegränsning som Firestore-regler inte kan replikera.
exports.skickaFeedback = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const { typ, text } = request.data ?? {};
  const rensadText = (text ?? "").trim();
  if (!typ || !rensadText || rensadText.length > 2000) {
    throw new HttpsError("invalid-argument", "Ange typ och text (max 2000 tecken).");
  }
  if (innehallerPersonnummer(rensadText)) {
    throw new HttpsError(
      "invalid-argument",
      "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas."
    );
  }

  const { roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll === "kiosk") {
    // Etapp 55: feedback är alltid en enskild persons synpunkt – se motiveringen i
    // skapaKommentar ovan.
    throw new HttpsError("permission-denied", "Kioskläge kan inte skicka in feedback.");
  }

  await kontrolleraOchOkaHastighet(request.auth.uid, "feedback", MAX_FEEDBACK_PER_TIMME);

  const skaparSnap = await db.collection("users").doc(request.auth.uid).get();
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const ref = await db.collection("feedback").add({
    typ,
    text: rensadText,
    status: "ny",
    organisationId,
    skapadAv: request.auth.uid,
    skapadAvNamn,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});

// Etapp L1 beslutspunkt 7 (avgjord 2026-08-30): en EGEN, tydligt märkt kanal till
// LEVERANTÖREN – till skillnad från skickaFeedback ovan, som går till organisationens EGEN
// superadmin och aldrig når leverantören (se firestore.rules `feedback`-regeln: den matchar
// bara den egna organisationen). Skriven till en HELT ANNAN collection, av samma skäl: en
// tyst utvidgning av vem som läser `feedback` hade brutit mot vad en kund som redan skickat
// in feedback trodde stannade internt. Samma server-side skydd som skickaFeedback
// (personnummerspärr, hastighetsbegränsning, ingen kiosk).
const MAX_LEVERANTORSFEEDBACK_PER_TIMME = 10;

exports.skickaLeverantorsfeedback = onCall({ region: "europe-west1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Du måste vara inloggad.");
  }
  const rensadText = (request.data?.text ?? "").trim();
  if (!rensadText || rensadText.length > 2000) {
    throw new HttpsError("invalid-argument", "Ange text (max 2000 tecken).");
  }
  if (innehallerPersonnummer(rensadText)) {
    throw new HttpsError(
      "invalid-argument",
      "Texten verkar innehålla ett personnummer. Patientuppgifter får inte sparas."
    );
  }

  const { roll, organisationId } = await hamtaAnvandarInfo(request.auth.uid);
  if (roll === "kiosk") {
    throw new HttpsError("permission-denied", "Kioskläge kan inte skicka in feedback.");
  }

  await kontrolleraOchOkaHastighet(request.auth.uid, "leverantorsfeedback", MAX_LEVERANTORSFEEDBACK_PER_TIMME);

  const skaparSnap = await db.collection("users").doc(request.auth.uid).get();
  const skapadAvNamn = skaparSnap.data()?.namn ?? skaparSnap.data()?.email ?? "";

  const ref = await db.collection("leverantorsfeedback").add({
    text: rensadText,
    last: false,
    organisationId,
    skapadAv: request.auth.uid,
    skapadAvNamn,
    skapad: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { id: ref.id };
});
