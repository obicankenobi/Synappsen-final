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

// Etapp 6a – leverantörsadmin
export function blibForstaPlattformsadmin() {
  const fn = httpsCallable(functions, "blibForstaPlattformsadmin");
  return fn();
}

export function listaOrganisationer() {
  const fn = httpsCallable(functions, "listaOrganisationer");
  return fn();
}

// Etapp 15c – faktureringsunderlag/månadsrapport per organisation
export function manadsrapportOrganisationer() {
  const fn = httpsCallable(functions, "manadsrapportOrganisationer");
  return fn();
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

// Etapp 15e – provperiod (ISO-datum "ÅÅÅÅ-MM-DD" eller null för att ta bort den)
export function satProvperiod(orgId, provperiodSlut) {
  const fn = httpsCallable(functions, "satProvperiod");
  return fn({ orgId, provperiodSlut });
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
