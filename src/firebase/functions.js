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

export function skapaKommentar({ rutinId, text, svarPa }) {
  const fn = httpsCallable(functions, "skapaKommentar");
  return fn({ rutinId, text, svarPa });
}

export function skickaFeedback({ typ, text }) {
  const fn = httpsCallable(functions, "skickaFeedback");
  return fn({ typ, text });
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

export function verifieraRevisionslogg() {
  const fn = httpsCallable(functions, "verifieraRevisionsloggAdmin");
  return fn();
}

export function exporteraRevisionslogg() {
  const fn = httpsCallable(functions, "exporteraRevisionslogg");
  return fn();
}

// Etapp 46
export function hamtaBackupstatus() {
  const fn = httpsCallable(functions, "hamtaBackupstatus");
  return fn();
}

// Etapp 6a – leverantörsadmin
export function blibForstaPlattformsadmin() {
  const fn = httpsCallable(functions, "blibForstaPlattformsadmin");
  return fn();
}

export function listaOrganisationer() {
  const fn = httpsCallable(functions, "listaOrganisationer");
  return fn();
}

// Etapp 50a – strukturell diagnostik per organisation (metadata, aldrig dokumentinnehåll)
export function hamtaOrganisationsdiagnostik(orgId) {
  const fn = httpsCallable(functions, "hamtaOrganisationsdiagnostik");
  return fn({ orgId });
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
export function satKioskPin(pin) {
  const fn = httpsCallable(functions, "satKioskPin");
  return fn({ pin });
}

export function verifieraKioskPin(pin) {
  const fn = httpsCallable(functions, "verifieraKioskPin");
  return fn({ pin });
}
