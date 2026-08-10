#!/usr/bin/env node
// Etapp 60a (ETAPPLAN12.md): seedar Firestore-EMULATORN (aldrig produktion – kräver
// FIRESTORE_EMULATOR_HOST) med en realistisk rutinmängd för att mäta appen mot faktisk
// volym istället för demo-organisationens en handfull rutiner. Skapar EN organisation med
// N rutiner (realistisk innehållsstorlek: markdown-brödtext, en del med checklistesteg,
// en del med kviss, en del med källor) och 200 användare vars uid:n sprids ut i varje
// rutins lasteAv-array (kvitteringar) – det är den delen av ett rutindokument som växer
// med användarantalet, inte bara med rutinantalet.
//
// Körs MOT en redan startad Firestore-/Auth-emulator (samma mönster som
// tests/e2e/global-setup.mjs):
//   npx firebase-tools@13 emulators:start --project demo-test --only firestore,auth &
//   node scripts/prestandaseed.mjs --antal 2000
import admin from "firebase-admin";

const ANTAL_RUTINER = Number(process.argv.find((a) => a.startsWith("--antal="))?.split("=")[1] ?? 500);
const ANTAL_ANVANDARE = 200;
const ORG_ID = "prestandaOrg";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.GCLOUD_PROJECT = "demo-test";

const app = admin.initializeApp({ projectId: "demo-test" }, `prestandaseed-${Date.now()}`);
const db = app.firestore();
const auth = app.auth();

// En handfull realistiska stycken att slumpmässigt sy ihop till brödtext – ger varierande men
// verklighetstrogen textlängd (verkliga rutiner varierar mycket, en enda mall skulle ge en
// missvisande enhetlig dokumentstorlek).
const STYCKEN = [
  "Vid mottagande av patient ska triage genomföras enligt lokal rutin inom fem minuter från ankomst. Ansvarig sjuksköterska dokumenterar vitalparametrar och eventuella avvikelser i journalsystemet innan läkarbedömning påbörjas.",
  "Personal ska bära föreskriven skyddsutrustning vid samtliga moment som innebär kontakt med kroppsvätskor. Handdesinfektion utförs före och efter varje patientkontakt, oavsett om handskar använts.",
  "Vid larm ska närmaste tillgängliga personal omedelbart bege sig till platsen. Ansvarsfördelningen mellan läkare, sjuksköterska och undersköterska följer den lokalt fastställda rollindelningen och ska inte improviseras under pågående insats.",
  "Dokumentation ska ske fortlöpande under vårdförloppet, inte retroaktivt vid arbetspassets slut. Varje anteckning ska vara tidsstämplad och signerad av den som utfört åtgärden.",
  "Överlämning mellan skift genomförs strukturerat enligt SBAR-metoden (situation, bakgrund, aktuellt tillstånd, rekommendation). Särskild vikt läggs vid patienter med instabilt tillstånd eller pågående utredning.",
  "Läkemedel som kräver dubbelkontroll ska alltid kontrolleras av två behöriga personer innan administrering. Avvikelser i läkemedelshanteringen rapporteras samma dag enligt avvikelserutinen.",
  "Vid osäkerhet om lämplig åtgärd ska bakjour eller ansvarig läkare kontaktas utan dröjsmål. Att avvakta i onödan innebär en större risk än att kontakta fel instans.",
];

function slumpParagraf(minst, hogst) {
  const antal = minst + Math.floor(Math.random() * (hogst - minst + 1));
  const valda = [];
  for (let i = 0; i < antal; i++) valda.push(STYCKEN[Math.floor(Math.random() * STYCKEN.length)]);
  return valda.join("\n\n");
}

function slumpInnehall(titel) {
  return (
    `# Bakgrund\n\n${slumpParagraf(1, 2)}\n\n` +
    `# Handläggning\n\n${slumpParagraf(2, 4)}\n\n` +
    `# Varningstecken\n\n${slumpParagraf(1, 2)}`
  );
}

function slumpSteg() {
  const n = 4 + Math.floor(Math.random() * 5);
  return Array.from({ length: n }, (_, i) => `Steg ${i + 1}: ${STYCKEN[i % STYCKEN.length].slice(0, 90)}`);
}

function slumpKviss() {
  const n = 2 + Math.floor(Math.random() * 3);
  return Array.from({ length: n }, (_, i) => ({
    fraga: `Testfråga ${i + 1} om rutinens innehåll?`,
    svarsalternativ: ["Alternativ A", "Alternativ B", "Alternativ C"],
    rattSvarIndex: Math.floor(Math.random() * 3),
  }));
}

async function main() {
  console.log(`Seedar ${ANTAL_RUTINER} rutiner + ${ANTAL_ANVANDARE} användare i org ${ORG_ID}...`);

  await db.collection("organisationer").doc(ORG_ID).set({
    namn: "Prestandatest AB",
    status: "aktiv",
    plan: "core",
    moduler: { operations: true, intelligence: true, kallbevakning: true },
  });

  // 200 användare – både i Auth (så inloggning fungerar) och users/{uid} (så lasteAv-namnen
  // är kopplade till riktiga konton, inte bara slumpade uid-strängar).
  const anvandarUid = [];
  let userBatch = db.batch();
  let userBatchAntal = 0;
  for (let i = 0; i < ANTAL_ANVANDARE; i++) {
    const uid = `prestandaUser${i}`;
    anvandarUid.push(uid);
    if (i === 0) {
      await auth
        .createUser({ uid, email: `prestanda0@exempel.se`, password: "test1234", emailVerified: true })
        .catch(() => auth.updateUser(uid, { email: `prestanda0@exempel.se`, password: "test1234" }));
    }
    userBatch.set(db.collection("users").doc(uid), {
      namn: `Testperson ${i}`,
      email: `prestanda${i}@exempel.se`,
      role: i === 0 ? "superadmin" : "personal",
      organisationId: ORG_ID,
    });
    userBatchAntal++;
    if (userBatchAntal === 400) {
      await userBatch.commit();
      userBatch = db.batch();
      userBatchAntal = 0;
    }
  }
  if (userBatchAntal > 0) await userBatch.commit();

  // Rutiner, i batchar om 400 (Firestores gräns är 500 skrivningar/batch).
  let batch = db.batch();
  let iBatch = 0;
  const OMRADEN = ["kliniskt-stod", "administration"];
  for (let i = 0; i < ANTAL_RUTINER; i++) {
    const omrade = OMRADEN[i % OMRADEN.length];
    const titel = `Rutin ${i + 1} – ${omrade === "kliniskt-stod" ? "klinisk åtgärd" : "administrativt moment"}`;
    const antalLasare = 10 + Math.floor(Math.random() * 170);
    // Etapp 60b (ETAPPLAN12.md): namn ingår MEDVETET inte längre – kvitteraLast slutade
    // skriva det (ren duplicering, namnet slås upp från användarlistan i UI:t istället), så
    // seedningen ska spegla den faktiska skrivformen.
    const lasteAv = Array.from({ length: antalLasare }, () => {
      const uid = anvandarUid[Math.floor(Math.random() * anvandarUid.length)];
      return { uid, tidpunkt: admin.firestore.Timestamp.now() };
    });
    const harChecklista = Math.random() < 0.1;
    const harKviss = Math.random() < 0.2;
    const doc = {
      titel,
      innehall: slumpInnehall(titel),
      omrade,
      status: "godkand",
      organisationId: ORG_ID,
      kalla: "prestandaseed",
      // Etapp 60c: useRutiner.js frågar nu server-side på borttagen==false, utan detta
      // fält skulle ingen av de seedade rutinerna synas i mätningarna längre.
      borttagen: false,
      skapadAv: "prestandaUser0",
      skapad: admin.firestore.FieldValue.serverTimestamp(),
      granskadDatum: admin.firestore.Timestamp.fromMillis(Date.now() - Math.floor(Math.random() * 400) * 86400000),
      agare: Math.random() < 0.7 ? { typ: "roll", varde: "sektionsledare" } : null,
      lasteAv,
      kallVarning: false,
      ...(harChecklista ? { akutlage: true, steg: slumpSteg() } : {}),
      ...(harKviss ? { kviss: slumpKviss() } : {}),
    };
    batch.set(db.collection("rutiner").doc(), doc);
    iBatch++;
    if (iBatch === 400) {
      await batch.commit();
      batch = db.batch();
      iBatch = 0;
      process.stdout.write(`.`);
    }
  }
  if (iBatch > 0) await batch.commit();

  console.log(`\nKlart: ${ANTAL_RUTINER} rutiner, ${ANTAL_ANVANDARE} användare i organisation "${ORG_ID}".`);
  console.log(`Logga in som prestanda0@exempel.se / test1234 (superadmin) för att mäta.`);
  await app.delete();
}

main().catch((fel) => {
  console.error("Seedningen misslyckades:", fel);
  process.exit(1);
});
