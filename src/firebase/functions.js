// Anrop till Cloud Functions för Synappsen
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { app } from "./config";

const functions = getFunctions(app, "europe-west1");

// Se motsvarande flagga/kommentar i ./config.js.
if (import.meta.env.VITE_USE_EMULATOR === "true") {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}

export function tolkaDokument(storagePath, omrade) {
  const fn = httpsCallable(functions, "tolkaDokument");
  return fn({ storagePath, omrade });
}

export function tolkaForradsbild(storagePath, forrad) {
  const fn = httpsCallable(functions, "tolkaForradsbild");
  return fn({ storagePath, forrad });
}

// Etapp 18b – dela upp en redan godkänd rutins text i stegförslag (checklistläget)
export function foreslaChecklistSteg(innehall) {
  const fn = httpsCallable(functions, "foreslaChecklistSteg");
  return fn({ innehall });
}

// Etapp 19b – ta fram mikrokviss-frågor ur en redan godkänd rutins text
export function foreslaKvissfragor(innehall) {
  const fn = httpsCallable(functions, "foreslaKvissfragor");
  return fn({ innehall });
}

export function fragaKlinisktStod(fraga) {
  const fn = httpsCallable(functions, "fragaKlinisktStod");
  return fn({ fraga });
}

export function tvingaUtloggning(userId) {
  const fn = httpsCallable(functions, "tvingaUtloggning");
  return fn({ userId });
}

// Etapp 70a: spärrar/öppnar inloggning för ett konto (Firebase Auth `disabled`). Reversibelt
// och lämnar all historik orörd – till skillnad från raderaAnvandare nedan.
export function satAnvandareAvstangd(userId, avstangd) {
  const fn = httpsCallable(functions, "satAnvandareAvstangd");
  return fn({ userId, avstangd });
}

// Etapp 70a: raderar Auth-kontot och users/{uid} permanent. Kvitteringar och revisionslogg
// lämnas kvar med flit – se motiveringen i functions/organisationsadmin.js.
export function raderaAnvandare(userId) {
  const fn = httpsCallable(functions, "raderaAnvandare");
  return fn({ userId });
}

export function skapaKommentar({ rutinId, text, svarPa }) {
  const fn = httpsCallable(functions, "skapaKommentar");
  return fn({ rutinId, text, svarPa });
}

export function skickaFeedback({ typ, text }) {
  const fn = httpsCallable(functions, "skickaFeedback");
  return fn({ typ, text });
}

// Etapp L1 beslutspunkt 7 – en EGEN kanal till leverantören, skild från skickaFeedback ovan
// (som går till organisationens egen superadmin, aldrig till Synappsen).
export function skickaLeverantorsfeedback(text) {
  const fn = httpsCallable(functions, "skickaLeverantorsfeedback");
  return fn({ text });
}

export function hamtaLeverantorsfeedback() {
  const fn = httpsCallable(functions, "hamtaLeverantorsfeedback");
  return fn();
}

export function markeraLeverantorsfeedbackLast(id) {
  const fn = httpsCallable(functions, "markeraLeverantorsfeedbackLast");
  return fn({ id });
}

export function testaBeroenden() {
  const fn = httpsCallable(functions, "testaBeroenden");
  return fn();
}

export function verifieraKlinikstod() {
  const fn = httpsCallable(functions, "verifieraKlinikstod");
  return fn();
}

export function migreraTillOrganisation(dryRun = true) {
  const fn = httpsCallable(functions, "migreraTillOrganisation");
  return fn({ dryRun });
}

// organisationId är valfritt – en vanlig superadmin behöver det aldrig (servern använder då
// deras egen organisation); en plattformsadmin MÅSTE ange det för att välja VILKEN kund
// (se kravLasningAvRevisionslogg i functions/revisionslogg.js). Tillagt i Etapp L1n för
// beredskapskontrollen i /leverantor/drift – ingen ändring av befintliga anropsställen.
export function verifieraRevisionslogg(organisationId) {
  const fn = httpsCallable(functions, "verifieraRevisionsloggAdmin");
  return fn(organisationId ? { organisationId } : {});
}

export function exporteraRevisionslogg() {
  const fn = httpsCallable(functions, "exporteraRevisionslogg");
  return fn();
}

// Etapp 46. organisationId valfritt, se motiveringen vid verifieraRevisionslogg ovan
// (samma kravLasningAvRevisionslogg-mönster, tillagt för Etapp L1n).
export function hamtaBackupstatus(organisationId) {
  const fn = httpsCallable(functions, "hamtaBackupstatus");
  return fn(organisationId ? { organisationId } : {});
}

// Etapp 6a – leverantörsadmin
export function blibForstaPlattformsadmin() {
  const fn = httpsCallable(functions, "blibForstaPlattformsadmin");
  return fn();
}

// Etapp L1m: skapar ett helt nytt, organisationslöst leverantörskonto. Svaret innehåller ett
// engångslösenord som ALDRIG lagras – visa/kopiera det en gång, dela manuellt.
export function skapaLeverantorskonto(epost, namn) {
  const fn = httpsCallable(functions, "skapaLeverantorskonto");
  return fn({ epost, namn });
}

// Flyttar ANROPARENS EGET konto till den organisationslösa modellen (kräver att kontot redan
// är plattformsadmin). Se BESLUTSLOGG.md 2026-08-29, beslutspunkt 6.
export function flyttaTillPlattformskonto() {
  const fn = httpsCallable(functions, "flyttaTillPlattformskonto");
  return fn({});
}

export function listaOrganisationer() {
  const fn = httpsCallable(functions, "listaOrganisationer");
  return fn();
}

// Etapp L1j – rapporterar bara appversionen (aldrig "senast aktiv" per användare, se
// beslutspunkt 2 i intern/ETAPPLAN-INTERN-1.md). Anropas tyst en gång per inloggning.
export function rapporteraAppVersion(version) {
  const fn = httpsCallable(functions, "rapporteraAppVersion");
  return fn({ version });
}

// Etapp 50a – strukturell diagnostik per organisation (metadata, aldrig dokumentinnehåll)
export function hamtaOrganisationsdiagnostik(orgId) {
  const fn = httpsCallable(functions, "hamtaOrganisationsdiagnostik");
  return fn({ orgId });
}

// Etapp L1g – leverantörens egen åtgärdslogg, tvärs alla kundorganisationer (läsvy, krav 39)
export function hamtaLeverantorsAtgardslogg(limit) {
  const fn = httpsCallable(functions, "hamtaLeverantorsAtgardslogg");
  return fn(limit ? { limit } : {});
}

// Etapp L1b, block 6 "Historik" – samma sak som ovan, men filtrerad till EN organisation.
export function hamtaKundensLeverantorshistorik(orgId) {
  const fn = httpsCallable(functions, "hamtaKundensLeverantorshistorik");
  return fn({ orgId });
}

// Etapp L1c (beslutspunkt 1) – kundens mätvärdesaggregat, senaste 12 veckorna. Loggas mot
// kundens EGEN revisionskedja i functions/matvarden.js, inte "_plattform".
export function hamtaKundmatvarden(orgId) {
  const fn = httpsCallable(functions, "hamtaKundmatvarden");
  return fn({ orgId });
}

// Etapp L1f (beslutspunkt 4) – leverantören begär ett supportfönster i appen, kundens
// superadmin godkänner/avslår fortfarande själv (svaraSupportbegaran).
export function begarSupportAtkomst(orgId, anledning) {
  const fn = httpsCallable(functions, "begarSupportAtkomst");
  return fn({ orgId, anledning });
}

export function svaraSupportbegaran(begaranId, godkann) {
  const fn = httpsCallable(functions, "svaraSupportbegaran");
  return fn({ begaranId, godkann });
}

// Etapp 51 – demo-/övningsorganisation: nollställ innehållet, valfritt med en färsk
// superadmin-inbjudan till en specifik e-postadress (samma mekanism som skapaOrganisation).
export function nollstallDemoOrganisation(inbjudanEpost) {
  const fn = httpsCallable(functions, "nollstallDemoOrganisation");
  return fn(inbjudanEpost ? { inbjudanEpost } : {});
}

// Etapp 15c – faktureringsunderlag/månadsrapport per organisation
export function manadsrapportOrganisationer() {
  const fn = httpsCallable(functions, "manadsrapportOrganisationer");
  return fn();
}

// Etapp 53a – globalt nödstopp för all utgående e-post, oavsett vilken funktion som
// försöker skicka. Ingen kod, ingen deploy – bara en knapptryckning.
export function angeEpostAvstangd(avstangd) {
  const fn = httpsCallable(functions, "angeEpostAvstangd");
  return fn({ avstangd });
}

// Etapp 70e: seedar startbiblioteket mot en organisation som REDAN finns. Idempotent –
// hoppar över varje del som redan har innehåll. Finns för att en organisation som skapades
// utan verksamhetstyp annars var permanent tom, utan väg tillbaka.
export function seedaStartbibliotek(organisationId, verksamhetstyp) {
  const fn = httpsCallable(functions, "seedaStartbibliotek");
  return fn({ organisationId, verksamhetstyp });
}

// Etapp 6b – organisationsetablering (verksamhetstyp: Etapp 10d, valfritt startbibliotek).
// Etapp 15a lade till orgnr/kontaktperson/anvandartak – kontaktperson.epost bjuder samtidigt
// in kundens första superadmin (svaret innehåller då en inbjudanToken).
export function skapaOrganisation(namn, moduler, verksamhetstyp, { orgnr, kontaktperson, anvandartak } = {}) {
  const fn = httpsCallable(functions, "skapaOrganisation");
  return fn({ namn, moduler, verksamhetstyp, orgnr, kontaktperson, anvandartak });
}

// Etapp 6d – avetablering
export function pausaOrganisation(orgId, pausad) {
  const fn = httpsCallable(functions, "pausaOrganisation");
  return fn({ orgId, pausad });
}

// Etapp 15d – avtalsstatus (offert/signerat/aktiv/pausad/avslutad), betalning/signering sker
// utanför appen (statusflagga, se ETAPPLAN3.md beslutspunkt 6)
export function satAvtalsstatus(orgId, avtalsstatus) {
  const fn = httpsCallable(functions, "satAvtalsstatus");
  return fn({ orgId, avtalsstatus });
}

// Etapp 32c – rolländring, moduler, 2FA-policy och budgettak går nu via Cloud Functions
// istället för direkta klient-skrivningar, så varje ändring loggas i revisionsloggen.
export function uppdateraAnvandarRoll(userId, roll) {
  const fn = httpsCallable(functions, "uppdateraAnvandarRoll");
  return fn({ userId, roll });
}

export function uppdateraModuler(modul, paslagen) {
  const fn = httpsCallable(functions, "uppdateraModuler");
  return fn({ modul, paslagen });
}

export function uppdateraMfaPolicy(kravMfaForRoller) {
  const fn = httpsCallable(functions, "uppdateraMfaPolicy");
  return fn({ kravMfaForRoller });
}

export function uppdateraGeminiBudgetTak(taketOre) {
  const fn = httpsCallable(functions, "uppdateraGeminiBudgetTak");
  return fn({ taketOre });
}

// Etapp 15e – provperiod (ISO-datum "ÅÅÅÅ-MM-DD" eller null för att ta bort den)
export function satProvperiod(orgId, provperiodSlut) {
  const fn = httpsCallable(functions, "satProvperiod");
  return fn({ orgId, provperiodSlut });
}

export function satAvtaladArsavgift(orgId, avtaladArsavgiftKr) {
  const fn = httpsCallable(functions, "satAvtaladArsavgift");
  return fn({ orgId, avtaladArsavgiftKr });
}

export function satSokkvotTakPerDygn(orgId, sokkvotTakPerDygn) {
  const fn = httpsCallable(functions, "satSokkvotTakPerDygn");
  return fn({ orgId, sokkvotTakPerDygn });
}

// Etapp 54b – huvudmannagruppering ovanpå organisationsmodellen, ingen ny läsväg
export function satHuvudman(orgId, huvudman) {
  const fn = httpsCallable(functions, "satHuvudman");
  return fn({ orgId, huvudman });
}

// Etapp L1p punkt 1, B12 – registrerar ATT ett PUB-avtal finns (aldrig avtalet självt).
// Låser upp satAvtalsstatus('aktiv'), som annars nekas.
export function satPubAvtal(orgId, tecknat, version) {
  const fn = httpsCallable(functions, "satPubAvtal");
  return fn({ orgId, tecknat, version });
}

// Etapp L1p punkt 2, B13 – registrerar att en kund underrättats om en given version av
// avtal/UNDERBITRADEN.md (PUB-avtalsmallens punkt 5, invändningsrätt).
export function satUnderbitradeUnderrattad(orgId, version) {
  const fn = httpsCallable(functions, "satUnderbitradeUnderrattad");
  return fn({ orgId, version });
}

// Etapp L1p punkt 3, B11 – styr om organisationens incidentklocka räknar 24h (NIS2,
// cybersäkerhetslagen 2025:1506) eller 72h (PUB-avtalets ordinarie frist).
export function satOmfattasAvNIS2(orgId, omfattasAvNIS2) {
  const fn = httpsCallable(functions, "satOmfattasAvNIS2");
  return fn({ orgId, omfattasAvNIS2 });
}

// Etapp L1p punkt 4, B15 – fritext + datum för vad som lovats just den här kunden.
export function satAtagandeblock(orgId, text) {
  const fn = httpsCallable(functions, "satAtagandeblock");
  return fn({ orgId, text });
}

// Etapp L1p punkt 5, B19 – leverantören BER, kunden UTFÖR med sitt eget samtycke via
// exporteraReferensunderlag (ingen ny åtkomst).
export function begarReferensunderlag(orgId, anledning) {
  const fn = httpsCallable(functions, "begarReferensunderlag");
  return fn({ orgId, anledning });
}

// Etapp L1p punkt 3 – 72/24-timmarsklockan vid en misstänkt personuppgiftsincident.
export function startaIncident(kannedomTidpunkt, orgIds) {
  const fn = httpsCallable(functions, "startaIncident");
  return fn({ kannedomTidpunkt, orgIds });
}

export function kvitteraIncidentunderrattelse(incidentId, orgId) {
  const fn = httpsCallable(functions, "kvitteraIncidentunderrattelse");
  return fn({ incidentId, orgId });
}

// Etapp 49a – schemalägger permanent radering av den egna organisationen (48 h väntetid)
export function begarRaderingAvOrganisation(anledning) {
  const fn = httpsCallable(functions, "begarRaderingAvOrganisation");
  return fn({ anledning });
}

// Etapp 49a – avbryter en schemalagd radering. orgId behövs bara för en leverantörsadmin
// (kundens egen superadmin avbryter alltid sin egen organisation, ingen orgId behövs då).
export function avbrytRaderingAvOrganisation(orgId) {
  const fn = httpsCallable(functions, "avbrytRaderingAvOrganisation");
  return fn(orgId ? { orgId } : {});
}

// Etapp 50b – tillfällig, kundinitierad supportåtkomst
export function beviljaSupportAtkomst(anledning) {
  const fn = httpsCallable(functions, "beviljaSupportAtkomst");
  return fn({ anledning });
}

export function avslutaSupportAtkomst(orgId) {
  const fn = httpsCallable(functions, "avslutaSupportAtkomst");
  return fn(orgId ? { orgId } : {});
}

export function exporteraOrganisation(orgId) {
  const fn = httpsCallable(functions, "exporteraOrganisation");
  return fn({ orgId });
}

// Etapp L1n – listar en organisations sparade backupfiler (datum, storlek – aldrig innehåll)
export function listaBackuper(orgId) {
  const fn = httpsCallable(functions, "listaBackuper");
  return fn({ orgId });
}

// Etapp L1n – återställer en organisation från en tidigare backup. Skriver ÖVER nuvarande
// data och går inte att ångra; UI:t ska alltid kräva en dubbel bekräftelse innan anropet.
export function aterstallOrganisation(orgId, sokvag) {
  const fn = httpsCallable(functions, "aterstallOrganisationCallable");
  return fn({ orgId, sokvag });
}

// Etapp 6c – inbjudningsflöde
export function skapaInbjudan(epost, roll) {
  const fn = httpsCallable(functions, "skapaInbjudan");
  return fn({ epost, roll });
}

export function granskaInbjudan(token) {
  const fn = httpsCallable(functions, "granskaInbjudan");
  return fn({ token });
}

export function losInInbjudan(token, namn) {
  const fn = httpsCallable(functions, "losInInbjudan");
  return fn({ token, namn });
}

// Etapp 39c – anonym personalpuls. Inget enskilt svar skickas till klienten någonsin, bara
// aggregat (se personalpulsResultat i firestore.rules/functions/matvarden.js).
export function svaraPersonalpuls(omrade, svar1, svar2, svar3) {
  const fn = httpsCallable(functions, "svaraPersonalpuls");
  return fn({ omrade, svar1, svar2, svar3 });
}

// Etapp 39d – anonymiserat referensunderlag för säljmaterial. samtycke måste bekräftas aktivt
// vid varje enskild export (se ägarbeslutet i ETAPPLAN6.md).
export function exporteraReferensunderlag(samtycke) {
  const fn = httpsCallable(functions, "exporteraReferensunderlag");
  return fn({ samtycke });
}

// Etapp 55 – kiosk-PIN. Klienten skickar/får aldrig hashen, bara ett booleskt svar från
// verifieraKioskPin (se functions/index.js för hela motiveringen).
// Etapp 71 – frågebanken bakom Öva-läget. All redigering går via Cloud Functions eftersom
// varje ändring ska rolltestas, PII-kontrolleras och revisionsloggas (se functions/kvissbank.js).

// Leverantören (plattformsadmin): globala frågor och globalt nödstopp per paket.
export function sparaGlobalKvissfraga(fraga) {
  const fn = httpsCallable(functions, "sparaGlobalKvissfraga");
  return fn(fraga);
}

export function taBortGlobalKvissfraga(id) {
  const fn = httpsCallable(functions, "taBortGlobalKvissfraga");
  return fn({ id });
}

export function satGlobaltKvisspaketStopp(paket, avstangt) {
  const fn = httpsCallable(functions, "satGlobaltKvisspaketStopp");
  return fn({ paket, avstangt });
}

// Kunden (superadmin/VÖL): paketval, överlagringar och egna frågor.
export function satKvisspaket(paket, aktivt) {
  const fn = httpsCallable(functions, "satKvisspaket");
  return fn({ paket, aktivt });
}

export function sparaKvissoverlagring(overlagring) {
  const fn = httpsCallable(functions, "sparaKvissoverlagring");
  return fn(overlagring);
}

export function aterstallKvissoverlagring(fragaId) {
  const fn = httpsCallable(functions, "aterstallKvissoverlagring");
  return fn({ fragaId });
}

export function sparaEgenKvissfraga(fraga) {
  const fn = httpsCallable(functions, "sparaEgenKvissfraga");
  return fn(fraga);
}

export function taBortEgenKvissfraga(id) {
  const fn = httpsCallable(functions, "taBortEgenKvissfraga");
  return fn({ id });
}

// Skriver om startinnehållet i den globala banken. Idempotent – kör om den efter en rättelse
// i functions/kvissfragorSeed.js, så når ändringen alla kunder som inte skrivit om frågan.
export function seedaKvissbank(endastNya = false) {
  const fn = httpsCallable(functions, "seedaKvissbank");
  return fn({ endastNya });
}

// Etapp L1o: skriver in de fyra åtagandena. Idempotent, rör aldrig ett redan kvitterat datum.
export function seedaAtagandekalender() {
  const fn = httpsCallable(functions, "seedaAtagandekalender");
  return fn({});
}

// senastUtfort är valfritt (ÅÅÅÅ-MM-DD) – utelämnas den sätts "nu".
export function sattAtagandeUtfort(id, senastUtfort = null) {
  const fn = httpsCallable(functions, "sattAtagandeUtfort");
  return fn({ id, senastUtfort });
}

export function satKioskPin(pin) {
  const fn = httpsCallable(functions, "satKioskPin");
  return fn({ pin });
}

export function verifieraKioskPin(pin) {
  const fn = httpsCallable(functions, "verifieraKioskPin");
  return fn({ pin });
}
